package models

import (
	"time"
)

type URL struct {
	ID            uint      `json:"id" gorm:"primaryKey"`
	Address       string    `json:"address"`
	Status        string    `json:"status"`
	Title         string    `json:"title"`
	HTMLVersion   string    `json:"htmlVersion"`
	H1            int       `json:"h1"`
	H2            int       `json:"h2"`
	H3            int       `json:"h3"`
	H4            int       `json:"h4"`
	H5            int       `json:"h5"`
	H6            int       `json:"h6"`
	InternalLinks int       `json:"internalLinks"`
	ExternalLinks int       `json:"externalLinks"`
	BrokenLinks   int       `json:"brokenLinks"`
	HasLoginForm  bool      `json:"hasLoginForm"`
	CreatedAt     time.Time `json:"createdAt"`
}
