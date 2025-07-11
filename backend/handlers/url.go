package handlers

import (
	"net/http"

	"github.com/AndriiKr1/webpage_analyzer/database"
	"github.com/AndriiKr1/webpage_analyzer/models"
	"github.com/AndriiKr1/webpage_analyzer/services"
	"github.com/gin-gonic/gin"
)

func CreateURL(c *gin.Context) {
	var req struct {
		URL string `json:"url"`
	}

	if err := c.BindJSON(&req); err != nil || req.URL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	url := models.URL{
		Address: req.URL,
		Status:  "queued",
	}

	if err := database.DB.Create(&url).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error"})
		return
	}

	// Start processing the URL in the background
	go services.ProcessURL(url.ID, req.URL)

	c.JSON(http.StatusOK, url)
}

func ListURLs(c *gin.Context) {
	var urls []models.URL
	if err := database.DB.Find(&urls).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error"})
		return
	}
	c.JSON(http.StatusOK, urls)
}

func GetURL(c *gin.Context) {
	id := c.Param("id")
	var url models.URL

	if err := database.DB.First(&url, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "URL not found"})
		return
	}

	c.JSON(http.StatusOK, url)
}

func DeleteURL(c *gin.Context) {
	id := c.Param("id")

	if err := database.DB.Delete(&models.URL{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete URL"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "URL deleted successfully"})
}

func BulkDeleteURLs(c *gin.Context) {
	var req struct {
		IDs []uint `json:"ids"`
	}

	if err := c.BindJSON(&req); err != nil || len(req.IDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if err := database.DB.Delete(&models.URL{}, req.IDs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete URLs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "URLs deleted successfully"})
}

func BulkRerunURLs(c *gin.Context) {
	var req struct {
		IDs []uint `json:"ids"`
	}

	if err := c.BindJSON(&req); err != nil || len(req.IDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	for _, id := range req.IDs {
		var url models.URL
		if err := database.DB.First(&url, id).Error; err != nil {
			continue
		}

		// Reset status to queued and restart analysis
		database.DB.Model(&url).Update("status", "queued")
		go services.ProcessURL(id, url.Address)
	}

	c.JSON(http.StatusOK, gin.H{"message": "URLs queued for re-analysis"})
}

func ReAnalyzeURL(c *gin.Context) {
	id := c.Param("id")
	var url models.URL

	if err := database.DB.First(&url, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "URL not found"})
		return
	}

	// Reset status and clear previous analysis data
	updates := map[string]interface{}{
		"status":         "queued",
		"title":          "",
		"html_version":   "",
		"h1":             0,
		"h2":             0,
		"h3":             0,
		"h4":             0,
		"h5":             0,
		"h6":             0,
		"internal_links": 0,
		"external_links": 0,
		"broken_links":   0,
		"has_login_form": false,
	}

	database.DB.Model(&url).Updates(updates)
	go services.ProcessURL(url.ID, url.Address)

	c.JSON(http.StatusOK, gin.H{"message": "URL queued for re-analysis"})
}
