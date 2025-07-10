package models

import (
	"gorm.io/gorm"
)

type URL struct {
	gorm.Model
	Address        string
	Status         string

	Title          string
	HTMLVersion    string

	H1             int
	H2             int
	H3             int
	H4             int
	H5             int
	H6             int

	InternalLinks  int
	ExternalLinks  int
	BrokenLinks    int

	HasLoginForm   bool
}
