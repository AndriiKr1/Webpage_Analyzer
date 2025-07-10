package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/AndriiKr1/webpage_analyzer/models"
	"github.com/AndriiKr1/webpage_analyzer/database"
	"github.com/AndriiKr1/webpage_analyzer/services"
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

	// Ось цей рядок запускає crawler у фоні
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
