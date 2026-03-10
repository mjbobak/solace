"""
Base service providing generic CRUD operations for SQLAlchemy models.

This service uses Python generics to provide type-safe CRUD operations
that can be reused across all finance features. Services can either:
1. Use BaseService directly for simple CRUD operations
2. Inherit from BaseService and add domain-specific methods

Example usage:
    # Direct usage for simple entities
    tag_service = BaseService[Tag, TagCreate, TagUpdate](
        db=db,
        model=Tag
    )

    # Inheritance for complex entities
    class TransactionService(BaseService[Transaction, TransactionCreate, TransactionUpdate]):
        def __init__(self, db: Session):
            super().__init__(db=db, model=Transaction)

        def get_by_date_range(self, start: date, end: date) -> List[Transaction]:
            # Domain-specific query
            ...
"""

import logging
from typing import Any, Dict, Generic, List, Optional, Type, TypeVar

from pydantic import BaseModel
from sqlalchemy import asc, desc
from sqlalchemy.orm import Session

from backend.app.db.database import Base

# Type variables for generics
ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

logger = logging.getLogger(__name__)


class BaseService(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    Generic base service for CRUD operations.

    Provides:
    - Standard CRUD operations (create, read, update, delete)
    - Pagination and filtering
    - Consistent error handling
    - Automatic timestamp management (via SQLAlchemy)
    - Logging

    Type Parameters:
        ModelType: SQLAlchemy model class (e.g., Transaction, Category)
        CreateSchemaType: Pydantic schema for creating entities
        UpdateSchemaType: Pydantic schema for updating entities
    """

    def __init__(self, db: Session, model: Type[ModelType]):
        """
        Initialize service with database session and model class.

        Args:
            db: SQLAlchemy database session
            model: SQLAlchemy model class
        """
        self.db = db
        self.model = model
        self.model_name = model.__name__

    # READ OPERATIONS

    def get_by_id(self, id: int) -> Optional[ModelType]:
        """
        Get entity by ID.

        Args:
            id: Entity ID

        Returns:
            Model instance if found, None otherwise
        """
        return self.db.query(self.model).filter(self.model.id == id).first()

    def get_all(self, skip: int = 0, limit: int = 100, order_by: str = "id", order_dir: str = "asc") -> List[ModelType]:
        """
        Get all entities with pagination and sorting.

        Args:
            skip: Number of records to skip (offset)
            limit: Maximum number of records to return
            order_by: Field name to sort by
            order_dir: Sort direction ("asc" or "desc")

        Returns:
            List of model instances
        """
        query = self.db.query(self.model)

        # Apply ordering
        if hasattr(self.model, order_by):
            order_col = getattr(self.model, order_by)
            query = query.order_by(desc(order_col) if order_dir == "desc" else asc(order_col))

        return query.offset(skip).limit(limit).all()

    def get_by_field(self, field_name: str, field_value: Any) -> Optional[ModelType]:
        """
        Get entity by a specific field value.

        Args:
            field_name: Name of the field to filter by
            field_value: Value to match

        Returns:
            Model instance if found, None otherwise

        Raises:
            ValueError: If field doesn't exist on model
        """
        if not hasattr(self.model, field_name):
            raise ValueError(f"Field '{field_name}' does not exist on {self.model_name}")

        field = getattr(self.model, field_name)
        return self.db.query(self.model).filter(field == field_value).first()

    def get_many_by_field(self, field_name: str, field_value: Any, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """
        Get multiple entities by a specific field value.

        Args:
            field_name: Name of the field to filter by
            field_value: Value to match
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of model instances

        Raises:
            ValueError: If field doesn't exist on model
        """
        if not hasattr(self.model, field_name):
            raise ValueError(f"Field '{field_name}' does not exist on {self.model_name}")

        field = getattr(self.model, field_name)
        return self.db.query(self.model).filter(field == field_value).offset(skip).limit(limit).all()

    def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """
        Count entities, optionally with filters.

        Args:
            filters: Dictionary of field names and values to filter by

        Returns:
            Count of matching entities
        """
        query = self.db.query(self.model)

        if filters:
            for field_name, field_value in filters.items():
                if hasattr(self.model, field_name):
                    field = getattr(self.model, field_name)
                    query = query.filter(field == field_value)

        return query.count()

    # CREATE OPERATION

    def create(self, obj_in: CreateSchemaType, **extra_fields) -> ModelType:
        """
        Create a new entity.

        Args:
            obj_in: Pydantic schema with creation data
            **extra_fields: Additional fields to set (e.g., user_id)

        Returns:
            Created model instance

        Note:
            - Timestamps (created_at, updated_at) are managed by SQLAlchemy
            - Override this method for custom validation or business logic
        """
        # Convert Pydantic model to dict
        obj_data = obj_in.model_dump()

        # Add any extra fields (e.g., user_id from auth context)
        obj_data.update(extra_fields)

        # Create model instance
        db_obj = self.model(**obj_data)

        # Persist to database
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)

        logger.info(f"Created {self.model_name} (ID: {db_obj.id})")
        return db_obj

    # UPDATE OPERATION

    def update(self, id: int, obj_in: UpdateSchemaType, **extra_fields) -> Optional[ModelType]:
        """
        Update an existing entity.

        Args:
            id: Entity ID
            obj_in: Pydantic schema with update data
            **extra_fields: Additional fields to update

        Returns:
            Updated model instance if found, None otherwise

        Note:
            - Only fields present in obj_in are updated (partial updates)
            - updated_at timestamp is managed by SQLAlchemy
        """
        db_obj = self.get_by_id(id)
        if not db_obj:
            return None

        # Get update data (exclude unset fields for partial updates)
        update_data = obj_in.model_dump(exclude_unset=True)
        update_data.update(extra_fields)

        # Update model instance
        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        self.db.commit()
        self.db.refresh(db_obj)

        logger.info(f"Updated {self.model_name} (ID: {id})")
        return db_obj

    # DELETE OPERATION

    def delete(self, id: int) -> bool:
        """
        Delete an entity by ID.

        Args:
            id: Entity ID

        Returns:
            True if deleted, False if not found

        Note:
            This performs a hard delete. For soft deletes, override
            this method or use a status field.
        """
        db_obj = self.get_by_id(id)
        if not db_obj:
            return False

        self.db.delete(db_obj)
        self.db.commit()

        logger.info(f"Deleted {self.model_name} (ID: {id})")
        return True

    # UTILITY METHODS

    def exists(self, id: int) -> bool:
        """
        Check if entity exists by ID.

        Args:
            id: Entity ID

        Returns:
            True if exists, False otherwise
        """
        return self.db.query(self.model).filter(self.model.id == id).count() > 0

    def validate_unique_field(self, field_name: str, field_value: Any, exclude_id: Optional[int] = None) -> None:
        """
        Validate that a field value is unique.

        Args:
            field_name: Name of the field to check
            field_value: Value to validate
            exclude_id: Optional ID to exclude from check (for updates)

        Raises:
            ValueError: If value is not unique
        """
        if not hasattr(self.model, field_name):
            raise ValueError(f"Field '{field_name}' does not exist on {self.model_name}")

        field = getattr(self.model, field_name)
        query = self.db.query(self.model).filter(field == field_value)

        if exclude_id:
            query = query.filter(self.model.id != exclude_id)

        if query.first():
            raise ValueError(f"{self.model_name} with {field_name}='{field_value}' already exists")
