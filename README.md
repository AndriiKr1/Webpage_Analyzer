# Webpage Analyzer

A full-stack web application that analyzes websites and provides detailed insights about their structure, links, and SEO elements.

## Features

### Backend (Go + Gin + MySQL)
- URL crawling and analysis
- HTML version detection
- Heading tags counting (H1-H6)
- Internal vs external links analysis
- Broken links detection
- Login form detection
- RESTful API with authorization
- Real-time processing status

### Frontend (React + TypeScript + Tailwind)
- URL submission form with validation
- Real-time dashboard with auto-refresh
- Sortable and filterable data table
- Pagination for large datasets
- Bulk operations (delete, re-analyze)
- Detailed analysis view with charts
- Responsive design (mobile & desktop)
- Tests (basic setup, needs implementation)

## Tech Stack

### Backend
- **Go 1.24** - Server language
- **Gin** - HTTP web framework
- **GORM** - ORM for database operations
- **MySQL** - Database
- **GoQuery** - HTML parsing and scraping

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing
- **Chart.js + React-ChartJS-2** - Data visualization
- **Vitest + React Testing Library** - Testing

## Prerequisites

- **Go 1.24+**
- **Node.js 18+**
- **MySQL 8.0+**
- **Git**

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/AndriiKr1/webpage_analyzer.git
cd webpage_analyzer
```

### 2. Database Setup

1. **Create MySQL Database:**
```sql
CREATE DATABASE webpage_analyzer;
CREATE USER 'analyzer_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON webpage_analyzer.* TO 'analyzer_user'@'localhost';
FLUSH PRIVILEGES;
```

2. **Create `.env` file in backend directory:**
```env
MYSQL_DSN=analyzer_user:your_password@tcp(localhost:3306)/webpage_analyzer?charset=utf8mb4&parseTime=True&loc=Local
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
go mod download

# Run the server (it will auto-migrate database tables)
go run main.go
```

The backend server will start on `http://localhost:8080`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

### Authentication
All API requests require the `Authorization` header:
```
Authorization: Bearer devtoken123
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/urls` | Submit URL for analysis |
| GET | `/api/urls` | List all analyzed URLs |
| GET | `/api/urls/:id` | Get specific URL details |
| DELETE | `/api/urls/:id` | Delete specific URL |
| POST | `/api/urls/bulk-delete` | Delete multiple URLs |
| POST | `/api/urls/bulk-rerun` | Re-analyze multiple URLs |

### Request/Response Examples

**Submit URL:**
```bash
curl -X POST http://localhost:8080/api/urls \
  -H "Authorization: Bearer devtoken123" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

**Response:**
```json
{
  "id": 1,
  "address": "https://example.com",
  "status": "queued",
  "title": "",
  "htmlVersion": "",
  "h1": 0,
  "h2": 0,
  "h3": 0,
  "h4": 0,
  "h5": 0,
  "h6": 0,
  "internalLinks": 0,
  "externalLinks": 0,
  "brokenLinks": 0,
  "hasLoginForm": false,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

## Usage Guide

### 1. Add URLs for Analysis
- Navigate to the home page
- Enter a valid URL in the form
- Click "Start Analysis"
- The URL will be queued for processing

### 2. View Results
- URLs appear in the table with real-time status updates
- Use search and filters to find specific URLs
- Sort by any column by clicking the header
- Navigate through pages using pagination controls

### 3. Detailed Analysis
- Click "View Details" on any URL row
- See comprehensive charts and broken links
- Charts show link distribution and heading structure

### 4. Bulk Operations
- Select multiple URLs using checkboxes
- Use "Re-analyze" to restart analysis
- Use "Delete" to remove URLs from database

## Database Schema

```sql
CREATE TABLE urls (
  id INT AUTO_INCREMENT PRIMARY KEY,
  address VARCHAR(2048) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'queued',
  title TEXT,
  html_version VARCHAR(50),
  h1 INT DEFAULT 0,
  h2 INT DEFAULT 0,
  h3 INT DEFAULT 0,
  h4 INT DEFAULT 0,
  h5 INT DEFAULT 0,
  h6 INT DEFAULT 0,
  internal_links INT DEFAULT 0,
  external_links INT DEFAULT 0,
  broken_links INT DEFAULT 0,
  has_login_form BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Testing

### Frontend Tests
```bash
cd frontend
npm test
```

### Backend Tests
```bash
cd backend
go test ./...
```

## Development

### Frontend Development
```bash
cd frontend
npm run dev        # Start dev server
npm run build      # Build for production
npm run lint       # Run ESLint
npm run test:ui    # Run tests with UI
```

### Backend Development
```bash
cd backend
go run main.go     # Start development server
go mod tidy        # Clean up dependencies
```

## Production Deployment

### Backend
```bash
cd backend
go build -o webpage_analyzer main.go
./webpage_analyzer
```

### Frontend
```bash
cd frontend
npm run build
# Deploy dist/ directory to your web server
```

## Architecture

```
┌─────────────────┐    HTTP/JSON    ┌─────────────────┐
│   React Frontend │ ───────────────→ │   Go Backend    │
│   (TypeScript)   │                  │   (Gin + GORM)  │
└─────────────────┘                  └─────────────────┘
                                              │
                                              │ SQL
                                              ▼
                                     ┌─────────────────┐
                                     │   MySQL DB      │
                                     │   (URLs Table)  │
                                     └─────────────────┘
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Troubleshooting

### Common Issues

**Database Connection Error:**
- Verify MySQL is running
- Check database credentials in `.env` file
- Ensure database exists and user has proper permissions

**CORS Issues:**
- Backend includes CORS middleware for `http://localhost:5173`
- Modify `corsMiddleware()` in `main.go` for different origins

**Authorization Issues:**
- Ensure all frontend requests include `Authorization: Bearer devtoken123`
- Token is hardcoded for development; implement proper auth for production

**Port Conflicts:**
- Backend runs on `:8080`
- Frontend runs on `:5173`
- Change ports in respective configuration files if needed

## Performance Considerations

- URL analysis runs asynchronously in goroutines
- Database queries are optimized with proper indexing
- Frontend implements pagination for large datasets
- Real-time updates use polling (5-second intervals)

## Security Notes

⚠️ **This is a development/demo application:**
- Uses hardcoded authentication token
- No input sanitization for production use
- No rate limiting implemented
- No HTTPS enforcement

For production deployment, implement:
- Proper JWT authentication
- Input validation and sanitization
- Rate limiting
- HTTPS/TLS encryption
- Environment-based configuration

---

**Author:** AndriiKr1  
**Repository:** https://github.com/AndriiKr1/webpage_analyzer
