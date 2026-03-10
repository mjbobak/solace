# Pydantic Schema Pattern

All Pydantic schemas follow a three-tier pattern for consistency and type safety.

## Pattern

```python
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class EntityBase(BaseModel):
    """Base schema with common fields used in both create and response."""
    field1: str = Field(..., description="Field 1 description")
    field2: Optional[int] = Field(None, description="Optional field")


class EntityCreate(EntityBase):
    """Schema for creating entities."""
    # Inherits all fields from Base
    # Add create-specific fields if needed (e.g., password for users)
    pass


class EntityUpdate(BaseModel):
    """Schema for updating entities (all fields optional for partial updates)."""
    field1: Optional[str] = Field(None, description="Field 1 description")
    field2: Optional[int] = Field(None, description="Optional field")


class Entity(EntityBase):
    """Complete schema with metadata for API responses."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # For SQLAlchemy ORM compatibility
```

## Why This Pattern?

### 1. EntityBase - Common Fields

- Contains fields shared between create and response schemas
- Avoids duplication
- Single source of truth for common validation

### 2. EntityCreate - Input Validation

- Used for POST requests
- Inherits from Base to get all required fields
- Can add create-only fields (e.g., password that isn't returned)
- All validations apply at creation time

### 3. EntityUpdate - Partial Updates

- Used for PUT/PATCH requests
- All fields are optional (allows partial updates)
- Pydantic's `exclude_unset=True` only updates provided fields

### 4. Entity - Response Schema

- Used for API responses
- Includes database-generated fields (id, timestamps)
- `from_attributes = True` enables SQLAlchemy ORM compatibility
- Returned from GET, POST, PUT endpoints

## Real-World Examples

### Category Schema

See [category.py](./category.py):

```python
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: CategoryType
    parent_id: Optional[int] = None
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")
    icon: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[CategoryType] = None
    parent_id: Optional[int] = None
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")
    icon: Optional[str] = None


class Category(CategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
```

### User Schema (with password handling)

See [auth.py](./auth.py):

```python
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)
    # Password is required for creation but never returned


class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    # Note: Password updates handled separately for security


class User(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    # No password field in response!

    class Config:
        from_attributes = True
```

### Transaction Schema

See [transaction.py](./transaction.py):

```python
class TransactionBase(BaseModel):
    date: date
    description: str = Field(..., min_length=1, max_length=255)
    merchant: Optional[str] = Field(None, max_length=255)
    amount: Decimal
    account: Optional[str] = Field(None, max_length=100)
    category_id: Optional[int] = None
    status: TransactionStatus = Field(default=TransactionStatus.CLEARED)
    review_status: ReviewStatus = Field(default=ReviewStatus.PENDING)


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    # All fields optional for partial updates
    date: Optional[date] = None
    description: Optional[str] = Field(None, min_length=1, max_length=255)
    merchant: Optional[str] = Field(None, max_length=255)
    amount: Optional[Decimal] = None
    category_id: Optional[int] = None
    # ... etc


class Transaction(TransactionBase):
    id: int
    user_id: int  # Added by service layer
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```

## Field Validation

Pydantic provides powerful validation:

```python
from pydantic import BaseModel, Field, validator
from decimal import Decimal


class TransactionBase(BaseModel):
    amount: Decimal = Field(..., description="Transaction amount")

    @validator('amount')
    def amount_must_be_nonzero(cls, v):
        if v == 0:
            raise ValueError('Amount cannot be zero')
        return v
```

## Nested Schemas

For relationships, use nested schemas:

```python
class Transaction(TransactionBase):
    id: int
    category: Optional[Category] = None  # Nested category object

    class Config:
        from_attributes = True
```

## Enums

Use Python enums for type safety:

```python
from enum import Enum


class CategoryType(str, Enum):
    EXPENSE = "EXPENSE"
    INCOME = "INCOME"


class CategoryBase(BaseModel):
    type: CategoryType  # Validated against enum values
```

## Config Options

### from_attributes = True

Enables ORM mode - allows Pydantic to read data from SQLAlchemy models:

```python
# SQLAlchemy model
category = Category(name="Groceries", type=CategoryType.EXPENSE)

# Pydantic can convert it
category_schema = CategorySchema.from_orm(category)
```

### Other Useful Config Options

```python
class Config:
    from_attributes = True
    json_encoders = {
        datetime: lambda v: v.isoformat(),
        Decimal: lambda v: str(v)
    }
    str_strip_whitespace = True
    use_enum_values = True
```

## Testing Schemas

```python
def test_category_create_validation():
    # Valid schema
    data = CategoryCreate(
        name="Groceries",
        type=CategoryType.EXPENSE
    )
    assert data.name == "Groceries"

    # Invalid - missing required field
    with pytest.raises(ValidationError):
        CategoryCreate(name="Test")  # Missing type

    # Invalid - name too short
    with pytest.raises(ValidationError):
        CategoryCreate(name="", type=CategoryType.EXPENSE)
```

## Best Practices

1. **Use Field() for metadata**: Add descriptions, constraints, examples
2. **Validate at schema level**: Use validators for business rules
3. **Keep Update schemas flexible**: All fields optional
4. **Don't return sensitive data**: Password, tokens, etc.
5. **Use enums for fixed values**: CategoryType, TransactionStatus, etc.
6. **Document fields**: Future developers will thank you
7. **Test edge cases**: Empty strings, negative numbers, invalid formats

## Common Pitfalls

### ❌ Don't duplicate validation in Base and Create

```python
# Bad - duplicated fields
class EntityBase(BaseModel):
    name: str

class EntityCreate(BaseModel):  # Should inherit from Base
    name: str
```

### ✅ Do inherit to avoid duplication

```python
# Good - DRY principle
class EntityBase(BaseModel):
    name: str

class EntityCreate(EntityBase):
    pass
```

### ❌ Don't make Update inherit from Base

```python
# Bad - forces all fields to be required
class EntityUpdate(EntityBase):
    pass
```

### ✅ Do make Update standalone with optional fields

```python
# Good - allows partial updates
class EntityUpdate(BaseModel):
    name: Optional[str] = None
```

## Related Documentation

- [Pydantic Documentation](https://docs.pydantic.dev/)
- [FastAPI Schema Documentation](https://fastapi.tiangolo.com/tutorial/body/)
- [Service Layer README](../services/README.md)
