Version `0.1.0`

# 📘 Family Finance Web App

A modern, minimalist family finance application for managing spending, tracking budgets, forecasting savings, and measuring progress toward financial goals. Designed to be fully local, fully private, and self-hosted. Built with React 19, FastAPI, and Docker.

## Purpose & Vision

This app helps you:

- Import and review transactions from bank CSV files
- Maintain categorized monthly budgets
- Track recurring and one-time income streams
- Apply categorization rules automatically during CSV ingest
- View spending, budget, and income dashboards

**Core Design**: Two CSV uploads per month → fully categorized data → accurate dashboards with minimal cleanup.

## Key Features

- **Transaction Import & Processing**: CSV import with filtering, preview, auto-categorization, and review workflow
- **Smart Categorization**: Rule-based engine matching by merchant, keywords, amounts, and patterns
- **Category Budgeting**: Budget line items grouped by expense category and type
- **Income Tracking**: Record salary, bonuses, side income, and FSA contributions
- **Dashboard Analytics**: Cash flow, budget vs actual, income summaries, and infographic views
- **Minimalist UI**: Clean, contemporary design with glassmorphism and Apple-like aesthetics
- **Local & Private**: Self-hosted, no external data transfer, password-protected login
- **Docker Ready**: Fully containerized with persistent SQLite storage

## Tech Stack

### Frontend

- React 19 + TypeScript
- Vite for build tooling
- Tailwind CSS 4 for styling
- React Router v7 for routing
- React Icons (Lucide set)
- Sonner for toast notifications
- Vitest + React Testing Library for testing

### Backend

- FastAPI (Python 3.12)
- Pydantic for data validation
- SQLite database
- JWT or secure local cookie authentication
- CSV ingestion and transformation service
- Rule-based categorization engine
- Forecasting service

### Deployment

- Docker multi-stage build
- Nginx reverse proxy
- Supervisor for process management
- Volume-mounted SQLite database
- Local self-hosted deployment only

## Quick Start

### Development (Hot Reload)

1. Start the development environment:

```bash
docker-compose -f docker-compose.dev.yml up
```

2. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Production

1. Build and run:

```bash
docker-compose up -d
```

2. Access the application:
   - App: http://localhost:8080

## Local Development (Without Docker)

### Prerequisites

- Node.js 22.13.0+
- Python 3.12+

### Frontend Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

### Backend Setup

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start backend
uvicorn backend.app.main:app --reload
```

## Configuration

### Database

The app uses SQLite for persistent storage with the following tables:

- `users` – Login credentials
- `expense_categories` – Shared budget categories
- `budgets` – Budget line items
- `transactions` – Imported and manually managed transactions
- `categorization_rules` – Auto-assignment rules for transaction imports
- `incomes` – Income streams
- `income_effective_ranges` – Historical compensation ranges per income stream
- `income_deductions` – Deduction details attached to income ranges

### Environment Variables

Optional environment variables:

- `PYTHONUNBUFFERED=1` – Python output buffering
- `DEV_MODE=true` – Development mode flag

## API Endpoints

- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET|POST|PUT|DELETE /api/budgets`
- `GET|POST|PUT|PATCH|DELETE /api/transactions`
- `POST /api/transactions/upload/preview`, `POST /api/transactions/upload/confirm`
- `GET|POST|PUT|DELETE /api/expense-categories`
- `GET|POST|PUT|DELETE /api/incomes`
- `POST|PUT|DELETE /api/incomes/*/ranges`

Full API documentation available at `/docs` when running.

## Project Structure

````
.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth_router.py
│   │   │   ├── budgets_router.py
│   │   │   ├── csv_upload_router.py
│   │   │   ├── expense_categories_router.py
│   │   │   ├── incomes_router.py
│   │   │   └── transactions_router.py
│   │   ├── db/
│   │   │   ├── database.py              # SQLAlchemy engine/session config
│   │   │   ├── init_db.py               # Startup schema/bootstrap logic
│   │   │   └── models/                  # SQLAlchemy ORM models
│   │   ├── models/                      # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── budget_service.py
│   │   │   ├── category_service.py
│   │   │   ├── income_service.py
│   │   │   └── transaction_service.py
│   │   └── main.py                      # FastAPI app
│   ├── scripts/                         # Seed scripts
│   └── tests/                           # Backend tests
├── data/                                # Local SQLite files, backups, and sample uploads
├── src/
│   ├── app/                             # App initialization & routing
│   ├── features/
│   │   ├── auth/
│   │   ├── budget/
│   │   ├── dashboard-infographic/
│   │   ├── home/
│   │   ├── income/
│   │   └── spending/
│   ├── shared/                          # Shared components & utilities
│   └── __tests__/                       # Frontend tests
├── docker-compose.yml                   # Production deployment
├── docker-compose.dev.yml               # Development environment
└── Dockerfile                           # Multi-stage build

## Deployment

### Reverse Proxy (Traefik/Nginx)

The app runs on port 8080 and is ready for reverse proxy:

**Traefik Example:**

```yaml
labels:
  - 'traefik.enable=true'
  - 'traefik.http.routers.home-launcher.rule=Host(`apps.yourdomain.com`)'
  - 'traefik.http.services.home-launcher.loadbalancer.server.port=8080'
````

**Nginx Example:**

```nginx
location / {
    proxy_pass http://localhost:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### Data Persistence

The SQLite database is volume-mounted to persist all financial data:

```yaml
volumes:
  - ./data:/app/data
```

Make sure the data directory exists before starting the container. Regular backups are recommended.

## Development Scripts

```bash
# Frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run test         # Run tests

# Backend
uvicorn backend.app.main:app --reload  # Dev server
```

## Security

This app is designed for private, local use only:

- Password-protected login (no external OAuth)
- HTTPS via local reverse proxy
- No external data transfer
- SQLite database stored locally
- All data remains on your home server

## MVP Scope

### Included in v1.0

- Transaction import with CSV mapping
- Rule-based auto-categorization
- Monthly and annual budgeting
- Income tracking
- Core dashboard analytics
- Basic net worth tracking
- Local authentication
- SQLite database

### Planned for Later Releases

- Sankey flow visualization
- Advanced forecasting and scenario analysis
- Tag management and filtering
- Bulk transaction editing
- Merchant normalization
- Advanced net worth tracking
- Automatic CSV folder watching
- PDF monthly summary reports

## Contributing

This is a personal finance application for family use. Feel free to fork and customize for your needs!

## License

MIT

## Version

1.0 (Finance App)
