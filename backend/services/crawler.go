package services

import (
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/AndriiKr1/webpage_analyzer/database"
	"github.com/AndriiKr1/webpage_analyzer/models"
	"github.com/PuerkitoBio/goquery"
)

func ProcessURL(id uint, rawURL string) {
	// Mark as "running"
	database.DB.Model(&models.URL{}).Where("id = ?", id).Update("status", "running")

	client := http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Get(rawURL)
	if err != nil {
		database.DB.Model(&models.URL{}).Where("id = ?", id).Update("status", "error")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		database.DB.Model(&models.URL{}).Where("id = ?", id).Update("status", "error")
		return
	}

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		database.DB.Model(&models.URL{}).Where("id = ?", id).Update("status", "error")
		return
	}

	// Parse base URL for link analysis
	baseURL, err := url.Parse(rawURL)
	if err != nil {
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
	broken := 0

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

		// Check if link is broken (simplified - just check if it's accessible)
		go func(checkURL string) {
			client := http.Client{
				Timeout: 5 * time.Second,
			}
			resp, err := client.Head(checkURL)
			if err != nil || resp.StatusCode >= 400 {
				broken++
			}
		}(linkURL.String())
	})

	data["internal_links"] = internal
	data["external_links"] = external
	data["broken_links"] = broken

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
}

func getHTMLVersion(resp *http.Response) string {
	contentType := resp.Header.Get("Content-Type")
	if strings.Contains(contentType, "html") {
		// This is simplified - in reality you'd parse the DOCTYPE from the HTML
		return "HTML5"
	}
	return "Unknown"
}
