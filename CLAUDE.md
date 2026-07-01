# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a family finance web application for managing spending, tracking budgets, forecasting savings, and measuring progress toward financial goals. The app is self-hosted, local-first, and privacy-focused. It uses React 19 frontend with FastAPI backend and SQLite database.

**Core workflow**: Two CSV uploads per month → automatic categorization → accurate dashboards with minimal cleanup.

## Development Commands

### Frontend (React + Vite)

```bash
# Start development server (hot reload)
npm run dev                    # Runs on http://localhost:5173

# Build for production
npm run build                  # TypeScript compilation + Vite build

# Linting
npm run lint                   # ESLint check
npm run lint:fix-imports       # Auto-fix import issues

# Testing
npm run test                   # Run all tests once
npm run test:watch             # Watch mode
npm run test:ui                # Vitest UI
npm run test:coverage          # With coverage report

# Specific test suites
npm run test:components        # Component tests only
npm run test:services          # Service tests only
npm run test:utils             # Utility tests only
npm run test:hooks             # Hook tests only
npm run test:pages             # Page tests only
```

### Backend (FastAPI + Python)

```bash
# Start backend development server
uvicorn backend.app.main:app --reload    # Runs on http://localhost:8000

# Testing
pytest                                    # Run all backend tests
pytest backend/tests/test_<module>.py    # Run specific test file
pytest -v                                # Verbose output
pytest --cov=backend/app                 # With coverage

# Access API docs
# http://localhost:8000/docs (Swagger UI)
# http://localhost:8000/redoc (ReDoc)
```

## Architecture

**Key principles**:

- **Self-contained features**: Each feature owns its components, hooks, services, types, and constants
- **Clean separation**: Business logic → hooks, UI → components, Data → services
- **No cross-feature dependencies**: Features should not import from other features (except shared)
- **Absolute imports**: Use `@/` prefix (e.g., `import { Button } from '@/shared/components'`)
- **Functional components**: TypeScript interfaces for all props
- **Constants & configuration**: Feature-specific config in `constants/` directory
- **Public API**: Export only public interfaces from `index.ts`

### Backend Structure

**Key principles**:

- **API layer** (`api/`): Route handlers only validate input and call services
- **Service layer** (`services/`): Contains all business logic, data operations
- **Models** (`models/`): Pydantic schemas for validation and serialization
- Services are framework-agnostic and easily testable

### API Design

- Base path: `/api`
- Current endpoints: `/api/apps/` (CRUD operations)
- Future endpoints: `/api/transactions`, `/api/budgets`, `/api/income`, `/api/dashboard`, etc.
- All async operations return Pydantic models
- Standard HTTP status codes (201 for create, 204 for delete, 404 for not found)

## Code Style & Conventions

### TypeScript/React

#### General Principles

- **Simplicity first**: Keep all files 50-150 lines. Break into smaller files if growing larger.
- **Single responsibility**: Each file/hook/component does ONE thing well
- **No cross-feature imports**: Features should only import from shared, not other features
- **Naming**: PascalCase for components/types, camelCase for variables/functions
- **Imports**: Always use absolute imports with `@/` prefix, organize by category

#### Components

- **Functional components**: React.FC with TypeScript interfaces for props
- **No business logic**: Components only handle UI rendering
- **Props-driven**: All behavior controlled via props and callbacks
- **Size**: 50-150 lines maximum (sign you need to break it into smaller pieces)
- **Styling**: Tailwind CSS 4 with minimalist, glassmorphism aesthetic
- **Naming**: Descriptive names that reflect purpose (BudgetView, EditableCell, etc.)

#### State Management

- **Keep state local**: useState for component-specific state
- **Extract to hooks**: Complex state logic → custom hooks
- **Hooks abstract state**: Component doesn't know how state works, just calls hooks
- **Props for communication**: Pass data and callbacks via props between components

### Python/FastAPI

- **Naming**: snake_case for variables/functions, CamelCase for classes
- **Type hints**: Required for all function parameters and returns
- **Docstrings**: Use for all public functions and classes
- **Testing**: pytest, file naming `test_<module>.py`
- **API routes**: Delegate logic to services, only handle validation and responses
- **Services**: Framework-agnostic, pure business logic

### ❌ DON'T: Mix Business Logic and UI in Components

## Development Rules

1. Focus on YAGNI (you aint going to need it) pricinples
2. prioritize one-liner code

### Code Quality Principles

7. **No laziness**: Find root causes, not temporary fixes. You're a senior developer.
8. **Type safety**: All TypeScript code fully typed, no `any` types
9. **Testing mindset**: Write code that's easy to test (pure functions, testable hooks)
10. **Simplicity over cleverness**: Plain, readable code beats clever tricks
11. **No over-engineering**: Don't add features or abstraction you're not using right now

THIS IS A GREEN FIELD PROJECT. WE ARE STILL DEVELOPING SO WE DONT EVER NEED BACKWARDS COMPATIBILITY!

Do note test anything unless asked by the user.
