# Service Layer Pattern

## Overview

The service layer contains all business logic and data access operations. Services are framework-agnostic and can be easily tested in isolation.

## Architecture

```
API Layer (FastAPI Routes)
    ↓
Service Layer (Business Logic)
    ↓
Database Layer (SQLAlchemy ORM)
```

## BaseService

All services can use `BaseService` for standard CRUD operations. BaseService is a generic class that provides:

- **Create**: `create(obj_in, **extra_fields)`
- **Read**: `get_by_id(id)`, `get_all()`, `get_by_field()`, `get_many_by_field()`, `count()`
- **Update**: `update(id, obj_in)`
- **Delete**: `delete(id)`
- **Utilities**: `exists(id)`, `validate_unique_field()`

### Usage Patterns

#### Pattern 1: Direct Usage (Simple CRUD)

For simple entities that only need basic CRUD:

```python
from backend.app.services.base_service import BaseService
from backend.app.db.models.tag import Tag
from backend.app.models.tag import TagCreate, TagUpdate

# In your router
@router.post("/tags/")
def create_tag(
    tag_data: TagCreate,
    db: Session = Depends(get_db)
):
    service = BaseService[Tag, TagCreate, TagUpdate](db=db, model=Tag)
    tag = service.create(tag_data)
    return tag
```

#### Pattern 2: Inheritance (Domain-Specific Logic)

For complex entities with custom validation or queries:

```python
from backend.app.services.base_service import BaseService

class TransactionService(BaseService[Transaction, TransactionCreate, TransactionUpdate]):
    def __init__(self, db: Session):
        super().__init__(db=db, model=Transaction)

    def create(self, obj_in: TransactionCreate, user_id: int) -> Transaction:
        """Override create to add user context and validation."""
        # Custom validation
        if obj_in.amount == 0:
            raise ValueError("Transaction amount cannot be zero")

        # Call parent with extra fields
        return super().create(obj_in, user_id=user_id)

    def get_by_date_range(self, start: date, end: date, user_id: int) -> List[Transaction]:
        """Domain-specific query method."""
        return (
            self.db.query(Transaction)
            .filter(Transaction.user_id == user_id)
            .filter(Transaction.date >= start)
            .filter(Transaction.date <= end)
            .order_by(Transaction.date.desc())
            .all()
        )
```

## Error Handling

Services should raise exceptions for error conditions:

- **ValueError**: For business logic validation errors (e.g., duplicate name, invalid amount)
- **Database errors**: Let SQLAlchemy exceptions bubble up to API layer

The API layer catches these and converts to appropriate HTTP responses:

```python
@router.post("/categories/")
def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db)
):
    try:
        service = CategoryService(db)
        category = service.create(category_data)
        return category
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating category: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create category"
        )
```

## Testing

All services should have comprehensive test coverage. See:

- `tests/test_base_service.py` - Tests for BaseService CRUD operations
- `tests/test_category_service.py` - Example of testing inherited service
- `tests/conftest.py` - Shared fixtures

### Test Structure

```python
class TestServiceName:
    """Tests for ServiceName."""

    def test_operation_success(self, db_session, fixtures):
        """Test successful operation."""
        # Arrange
        service = ServiceName(db_session)

        # Act
        result = service.operation()

        # Assert
        assert result is expected

    def test_operation_error(self, db_session):
        """Test error condition."""
        service = ServiceName(db_session)

        with pytest.raises(ValueError, match="error message"):
            service.operation(invalid_data)
```

## Migration Guide

### When to Use BaseService

**Use BaseService directly when:**

- Entity only needs basic CRUD operations
- No custom validation beyond Pydantic schemas
- No complex queries needed
- Examples: Tags, simple lookup tables

**Inherit from BaseService when:**

- Need custom validation logic
- Have domain-specific query methods
- Need to add user context or other fields
- Examples: Transactions, Categories, Budgets

### Don't Refactor Existing Services

Existing services (UserService, AppService) should NOT be refactored to use BaseService. They work fine as-is. BaseService is for new features going forward.

## Examples

See these files for complete examples:

- [backend/app/services/category_service.py](./category_service.py) - Full service implementation
- [backend/tests/test_category_service.py](../../tests/test_category_service.py) - Service tests

## Common Patterns

### Adding User Context

Many operations require user context from authentication:

```python
class MyService(BaseService[MyModel, MyCreate, MyUpdate]):
    def create(self, obj_in: MyCreate, user_id: int) -> MyModel:
        # Add user_id to all creates
        return super().create(obj_in, user_id=user_id)
```

### Pagination in Routes

```python
@router.get("/items/")
def list_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    service = ItemService(db)
    items = service.get_all(skip=skip, limit=limit)
    total = service.count()
    return {"items": items, "total": total, "skip": skip, "limit": limit}
```

### Filtering by Related Entities

```python
class TransactionService(BaseService[Transaction, TransactionCreate, TransactionUpdate]):
    def get_by_category(self, category_id: int) -> List[Transaction]:
        return self.get_many_by_field("category_id", category_id)
```

### Soft Delete Pattern

Override the delete method for soft deletes:

```python
class MyService(BaseService[MyModel, MyCreate, MyUpdate]):
    def delete(self, id: int) -> bool:
        """Soft delete by setting status to deleted."""
        obj = self.get_by_id(id)
        if not obj:
            return False

        obj.status = "deleted"
        self.db.commit()
        logger.info(f"Soft deleted {self.model_name} (ID: {id})")
        return True
```
