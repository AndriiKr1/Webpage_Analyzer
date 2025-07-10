package main

import (
	"github.com/gin-gonic/gin"
	"github.com/AndriiKr1/webpage_analyzer/database"
	"github.com/AndriiKr1/webpage_analyzer/models"
	"github.com/AndriiKr1/webpage_analyzer/handlers"
)

func main() {
	database.Connect()

	
	_ = database.DB.AutoMigrate(&models.URL{})

	r := gin.Default()
	r.Use(authMiddleware())

	api := r.Group("/api")
	{
		api.POST("/urls", handlers.CreateURL)
		api.GET("/urls", handlers.ListURLs)
	}

	r.Run(":8080")
}

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.GetHeader("Authorization") != "Bearer devtoken123" {
			c.JSON(401, gin.H{"error": "unauthorized"})
			c.Abort()
			return
		}
		c.Next()
	}
}
