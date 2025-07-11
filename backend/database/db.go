package database

import (
	"fmt"
	"log"
	"os"

	"github.com/AndriiKr1/webpage_analyzer/models"
	"github.com/joho/godotenv"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	_ = godotenv.Load() // Load environment variables from .env file

	dsn := os.Getenv("MYSQL_DSN")
	if dsn == "" {
		dsn = "analyzer_user:analyzer_password@tcp(localhost:3306)/webpage_analyzer?charset=utf8mb4&parseTime=True&loc=Local"
	}

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to DB:", err)
	}

	// Auto-migrate the schema
	err = DB.AutoMigrate(&models.URL{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	fmt.Println("Connected to DB and migrated schema")
}
