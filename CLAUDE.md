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

### Docker

```bash
# Development (with hot reload)
docker-compose -f docker-compose.dev.yml up
# Frontend: http://localhost:5173
# Backend: http://localhost:8000

# Production
docker-compose up -d
# App: http://localhost:8080
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

#### Custom Hooks

- **One responsibility**: Each hook solves ONE specific problem
- **Reusable logic**: Extract any logic used in multiple components to hooks
- **Naming**: Use `use` prefix (useBudgetFiltering, useBudgetEditing, etc.)
- **Return interface**: Always define clear return type/interface
- **Pure functions**: No side effects beyond React hook side effects
- **Testing friendly**: Hooks should be easily testable in isolation

#### Imports Organization

Always organize imports in this order:

1. React imports
2. Third-party library imports
3. Shared component/utils imports (`@/shared/`)
4. Feature-specific imports (relative paths)
5. Blank line between groups

Example:

```typescript
import React from 'react';

import { Button } from '@/shared/components/Button';
import { formatCurrency } from '@/shared/utils/currency';

import { useBudgetCalculations } from '../hooks/useBudgetCalculations';
import { BudgetSummary } from './BudgetSummary';
```

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

## Anti-Patterns to Avoid

These issues were addressed in the budget feature refactoring and should be avoided in all future features:

### ❌ DON'T: Mix Business Logic and UI in Components

```typescript
// BAD - 543 lines with filtering, editing, calculations all in component
export const BudgetView: React.FC = () => {
  const [data, setData] = useState(mockBudgetData);

  // Filtering logic in component
  const filtered = useMemo(() => {
    // ... 30 lines of filtering logic
  }, [data]);

  // Calculations in component
  const totals = useMemo(() => {
    // ... 20 lines of calculation logic
  }, [filtered]);

  // EditableCell defined inline
  const EditableCell = ({ row }) => { /* ... */ };

  // Render logic mixed with everything
  return <div>{/* 200+ lines of JSX */}</div>;
};
```

✅ **DO**: Extract logic to hooks, keep components focused

```typescript
// GOOD - 86 lines, pure orchestration
export const BudgetView: React.FC = () => {
  const [data, setData] = useState(mockBudgetData);

  // Business logic in hooks
  const filtered = useBudgetFiltering(data, period, typeFilter, categoryFilter);
  const totals = useBudgetCalculations(filtered);
  const editing = useBudgetEditing(data, setData);

  // Render extracted components
  return <BudgetSummary /> <Table columns={getBudgetTableColumns()} />;
};
```

### ❌ DON'T: Cross-Feature Dependencies

```typescript
// BAD - Budget feature imports from home feature
import { mockBudgetData } from '../../home/services/mockTableData';
import type { BudgetEntry } from '../../home/services/mockTableData';

// This creates tight coupling and circular dependencies
```

✅ **DO**: Keep features self-contained

```typescript
// GOOD - Budget feature owns its own data and types
import { mockBudgetData } from '../services/mockBudgetData';
import type { BudgetEntry } from '../types/budgetView';

// Features only import from shared, not other features
import { Button } from '@/shared/components/Button';
```

### ❌ DON'T: Put Constants and Types in Components

```typescript
// BAD - Hardcoded values scattered in component
export const BudgetView: React.FC = () => {
  const EXPENSE_TYPES = ['ESSENTIAL', 'FUNSIES']; // Line 19
  const EXPENSE_CATEGORIES = [
    /* 13 items */
  ]; // Lines 20-34

  type BudgetPeriod = 'monthly' | 'annual'; // Line 15
  type ExpenseTypeFilter = '...'; // Line 16

  // Used everywhere in component
};
```

✅ **DO**: Centralize types and constants in dedicated files

```typescript
// constants/expenseConfig.ts
export const EXPENSE_TYPES = ['ESSENTIAL', 'FUNSIES'] as const;
export const EXPENSE_CATEGORIES = [...] as const;

// types/budgetView.ts
export type BudgetPeriod = 'monthly' | 'annual';
export type ExpenseTypeFilter = 'ESSENTIAL' | 'FUNSIES' | 'ALL';

// In component
import { EXPENSE_TYPES } from '../constants/expenseConfig';
import type { BudgetPeriod } from '../types/budgetView';
```

### ❌ DON'T: Mix Multiple Concerns in One Hook

```typescript
// BAD - One hook doing everything
export function useBudgetLogic(entries) {
  const [filtered, setFiltered] = useState(entries);
  const [editing, setEditing] = useState(null);
  const [totals, setTotals] = useState({});

  // Filtering logic
  // Editing state
  // Calculations
  // CRUD operations
  // Custom options management
  // All mixed together = 150 lines
}
```

✅ **DO**: One hook = one responsibility

```typescript
// hooks/useBudgetFiltering.ts - Just filtering
export function useBudgetFiltering(entries, period, typeFilter) {
  return useMemo(() => {
    /* 20 lines of filtering */
  }, [entries, period, typeFilter]);
}

// hooks/useBudgetEditing.ts - Just editing state
export function useBudgetEditing(entries, setEntries) {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  return { editingCell, editValue, handleSave, handleCancel };
}

// hooks/useBudgetCalculations.ts - Just calculations
export function useBudgetCalculations(data) {
  return useMemo(() => {
    /* 20 lines of totals */
  }, [data]);
}
```

### ❌ DON'T: Create Large Monolithic Components

```typescript
// BAD - 543 lines in one file
export const BudgetView: React.FC = () => {
  // Multiple features:
  // - Period selection
  // - Summary cards
  // - Filters
  // - Table columns
  // - Editable cells
  // - Cell editing logic
  // All in one component
};
```

✅ **DO**: Decompose into small, focused components

```typescript
// components/BudgetView.tsx (86 lines) - Orchestrator
// components/BudgetSummary.tsx (40 lines) - Summary section
// components/BudgetFilters.tsx (80 lines) - Filters UI
// components/EditableCell.tsx (90 lines) - Reusable cell
// components/budgetTableColumns.tsx (200 lines) - Column config

// Each file has ONE job, easy to understand and test
```

### ❌ DON'T: Have Undefined or Implicit Public API

```typescript
// BAD - index.ts is empty or has random exports
export const BudgetView;
// Can't tell what the feature exposes to the rest of the app
```

✅ **DO**: Define clear public API with organized exports

```typescript
// index.ts - Clear what's public
export { BudgetView } from './components/BudgetView';
export type { BudgetEntry, BudgetPeriod } from './types/budgetView';
export { useBudgetFiltering } from './hooks/useBudgetFiltering';
export { budgetService } from './services/budgetService';
export { EXPENSE_TYPES } from './constants/expenseConfig';
```

---

## Development Rules

1. **Plan first**: Before coding, read relevant files and write a detailed plan
2. **Get approval**: Have the plan reviewed before starting implementation
3. **Incremental changes**: Make small, focused changes - not massive refactors
4. **Simple always**: Every change should be as simple as possible, impact minimal code
5. **Clear explanations**: After each change, explain what was modified at a high level
6. **Document changes**: Summarize changes in a review section when complete

### Code Quality Principles

7. **No laziness**: Find root causes, not temporary fixes. You're a senior developer.
8. **Type safety**: All TypeScript code fully typed, no `any` types
9. **Testing mindset**: Write code that's easy to test (pure functions, testable hooks)
10. **Simplicity over cleverness**: Plain, readable code beats clever tricks
11. **No over-engineering**: Don't add features or abstraction you're not using right now

THIS IS A GREEN FIELD PROJECT. WE ARE STILL DEVELOPING SO WE DONT EVER NEED BACKWARDS COMPATIBILITY!
