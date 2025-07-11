package main

import (
	"fmt"

	"github.com/AndriiKr1/webpage_analyzer/database"
	"github.com/AndriiKr1/webpage_analyzer/handlers"
	"github.com/AndriiKr1/webpage_analyzer/models"
	"github.com/gin-gonic/gin"
)

func main() {
	database.Connect()

	_ = database.DB.AutoMigrate(&models.URL{})

	r := gin.Default()

	r.Use(corsMiddleware())
	r.Use(authMiddleware())

	api := r.Group("/api")
	{
		api.POST("/urls", handlers.CreateURL)
		api.GET("/urls", handlers.ListURLs)
		api.GET("/urls/:id", handlers.GetURL)
		api.DELETE("/urls/:id", handlers.DeleteURL)
		api.POST("/urls/:id/analyze", handlers.ReAnalyzeURL)
		api.POST("/urls/bulk-delete", handlers.BulkDeleteURLs)
		api.POST("/urls/bulk-rerun", handlers.BulkRerunURLs)
	}

	r.Run(":8080")
}

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == "OPTIONS" {

			c.Next()
			return
		}

		if c.GetHeader("Authorization") != "Bearer devtoken123" {
			c.JSON(401, gin.H{"error": "unauthorized"})
			c.Abort()
			return
		}
		c.Next()
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		fmt.Println("CORS middleware:", c.Request.Method, c.Request.URL.Path)

		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, DELETE, OPTIONS")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
