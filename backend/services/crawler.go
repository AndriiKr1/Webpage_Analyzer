package services

import (
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/AndriiKr1/webpage_analyzer/database"
	"github.com/AndriiKr1/webpage_analyzer/models"
	"github.com/PuerkitoBio/goquery"
)

func ProcessURL(id uint, rawURL string) {
	log.Printf("Starting analysis for URL ID %d: %s", id, rawURL)

	// Mark as "running"
	database.DB.Model(&models.URL{}).Where("id = ?", id).Update("status", "running")

	client := http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Get(rawURL)
	if err != nil {
		log.Printf("Failed to fetch URL ID %d: %v", id, err)
		database.DB.Model(&models.URL{}).Where("id = ?", id).Update("status", "error")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		log.Printf("Non-200 status code for URL ID %d: %d", id, resp.StatusCode)
		database.DB.Model(&models.URL{}).Where("id = ?", id).Update("status", "error")
		return
	}

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		log.Printf("Failed to parse HTML for URL ID %d: %v", id, err)
		database.DB.Model(&models.URL{}).Where("id = ?", id).Update("status", "error")
		return
	}

	// Parse base URL for link analysis
	baseURL, err := url.Parse(rawURL)
	if err != nil {
		log.Printf("Failed to parse base URL for ID %d: %v", id, err)
		database.DB.Model(&models.URL{}).Where("id = ?", id).Update("status", "error")
		return
	}

	var data = map[string]interface{}{
		"status": "done",
	}

	// HTML version
	data["html_version"] = getHTMLVersion(resp)

	// Title
	data["title"] = strings.TrimSpace(doc.Find("title").Text())

	// Count headings H1-H6
	for i := 1; i <= 6; i++ {
		count := doc.Find(fmt.Sprintf("h%d", i)).Length()
		data[fmt.Sprintf("h%d", i)] = count
	}

	// Links analysis
	internal := 0
	external := 0
	var broken int64 = 0
	var wg sync.WaitGroup
	var links []string

	doc.Find("a[href]").Each(func(i int, s *goquery.Selection) {
		href, exists := s.Attr("href")
		if !exists || href == "" {
			return
		}

		// Parse and normalize the link
		linkURL, err := url.Parse(href)
		if err != nil {
			return
		}

		// Convert relative URLs to absolute
		if !linkURL.IsAbs() {
			linkURL = baseURL.ResolveReference(linkURL)
		}

		// Determine if internal or external
		if linkURL.Host == baseURL.Host {
			internal++
		} else {
			external++
		}

		// Collect links for broken link checking
		links = append(links, linkURL.String())
	})

	// Check for broken links with proper synchronization
	for _, link := range links {
		wg.Add(1)
		go func(checkURL string) {
			defer wg.Done()
			client := http.Client{
				Timeout: 5 * time.Second,
			}
			resp, err := client.Head(checkURL)
			if err != nil || (resp != nil && resp.StatusCode >= 400) {
				atomic.AddInt64(&broken, 1)
			}
		}(link)
	}

	// Wait for all broken link checks to complete
	wg.Wait()

	data["internal_links"] = internal
	data["external_links"] = external
	data["broken_links"] = int(broken)

	// Check for login form
	hasLogin := false
	doc.Find("form").Each(func(i int, s *goquery.Selection) {
		// Look for password input fields
		if s.Find("input[type='password']").Length() > 0 {
			hasLogin = true
			return
		}

		// Look for common login field patterns
		s.Find("input").Each(func(j int, input *goquery.Selection) {
			name, _ := input.Attr("name")
			id, _ := input.Attr("id")
			placeholder, _ := input.Attr("placeholder")

			loginKeywords := []string{
				"login", "username", "email", "user", "password", "pass",
				"signin", "auth", "credential",
			}

			for _, keyword := range loginKeywords {
				if strings.Contains(strings.ToLower(name), keyword) ||
					strings.Contains(strings.ToLower(id), keyword) ||
					strings.Contains(strings.ToLower(placeholder), keyword) {
					hasLogin = true
					return
				}
			}
		})
	})
	data["has_login_form"] = hasLogin

	// Update database with all collected data
	database.DB.Model(&models.URL{}).Where("id = ?", id).Updates(data)

	log.Printf("Completed analysis for URL ID %d: Internal: %d, External: %d, Broken: %d",
		id, internal, external, int(broken))
}

func getHTMLVersion(resp *http.Response) string {
	contentType := resp.Header.Get("Content-Type")
	if strings.Contains(contentType, "html") {
		// This is simplified - in reality you'd parse the DOCTYPE from the HTML
		return "HTML5"
	}
	return "Unknown"
}
