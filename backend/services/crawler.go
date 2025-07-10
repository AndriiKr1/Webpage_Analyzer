package services

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/AndriiKr1/webpage_analyzer/database"
	"github.com/AndriiKr1/webpage_analyzer/models"
)

func ProcessURL(id uint, rawURL string) {
	// Позначаємо як "running"
	database.DB.Model(&models.URL{}).Where("id = ?", id).Update("status", "running")

	client := http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Get(rawURL)
	if err != nil || resp.StatusCode != 200 {
		database.DB.Model(&models.URL{}).Where("id = ?", id).Update("status", "error")
		return
	}
	defer resp.Body.Close()

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		database.DB.Model(&models.URL{}).Where("id = ?", id).Update("status", "error")
		return
	}

	var data = map[string]interface{}{
		"Status": "done",
	}

	// HTML версія
	data["HTMLVersion"] = getHTMLVersion(resp)

	// Заголовок
	data["Title"] = doc.Find("title").Text()

	// Підрахунок заголовків
	for i := 1; i <= 6; i++ {
		count := doc.Find(fmt.Sprintf("h%d", i)).Length()
		data[fmt.Sprintf("H%d", i)] = count
	}

	// Посилання
	internal := 0
	external := 0
	broken := 0

	doc.Find("a[href]").Each(func(i int, s *goquery.Selection) {
		href, _ := s.Attr("href")
		if href == "" {
			return
		}

		// Нормалізуємо посилання
		if strings.HasPrefix(href, "/") {
			href = strings.TrimRight(rawURL, "/") + href
		}

		// Визначаємо внутрішнє/зовнішнє
		if strings.Contains(href, rawURL) {
			internal++
		} else {
			external++
		}

		// Перевірка битого посилання (HEAD-запит)
		resp, err := client.Head(href)
		if err != nil || resp.StatusCode >= 400 {
			broken++
		}
	})

	data["InternalLinks"] = internal
	data["ExternalLinks"] = external
	data["BrokenLinks"] = broken

	// Чи є форма логіну?
	hasLogin := false
	doc.Find("form").Each(func(i int, s *goquery.Selection) {
		inputs := s.Find("input[type='password']")
		if inputs.Length() > 0 {
			hasLogin = true
		}
	})
	data["HasLoginForm"] = hasLogin

	// Оновлення в БД
	database.DB.Model(&models.URL{}).Where("id = ?", id).Updates(data)
}

func getHTMLVersion(resp *http.Response) string {
	ct := resp.Header.Get("Content-Type")
	if strings.Contains(ct, "html") {
		return "HTML5"
	}
	return "Unknown"
}
