"""CSV ETL service for parsing and transforming bank transaction files."""

import csv
import logging
from datetime import datetime
from decimal import Decimal
from io import StringIO
from typing import List

from fastapi import UploadFile

from backend.app.models.csv_upload import CsvParseResult, ParsedTransaction

logger = logging.getLogger(__name__)

# Account configuration mapping
ACCOUNT_CONFIG = {
    "1466": {"name": "Chase Credit Card", "format": "chase_credit"},
    "2939": {"name": "Chase Checking", "format": "chase_checking"},
}

SERVICEMAC_SPLIT_DESCRIPTION = "SERVICEMAC"
SERVICEMAC_SPLIT_AMOUNT = Decimal("3955.28")
MORTGAGE_BUDGET_ID = 6
ADDITIONAL_MORTGAGE_BUDGET_ID = 28


class CsvEtlService:
    """Service for parsing and transforming CSV files into transactions."""

    @staticmethod
    def _build_preview_id(filename: str, row_number: int, split_index: int = 0) -> str:
        """Build a stable unique ID for a preview row across files and splits."""
        return f"{filename}:{row_number}:{split_index}"

    async def parse_csv_files(self, files: List[UploadFile]) -> CsvParseResult:
        """
        Parse multiple CSV files and return preview data.

        Args:
            files: List of uploaded CSV files

        Returns:
            CsvParseResult with all parsed transactions and statistics
        """
        all_transactions = []
        parse_errors = []

        for file in files:
            filename = file.filename or "unknown.csv"
            try:
                account = self._detect_account(filename)
                content = await file.read()
                transactions = await self._parse_file(content, account, filename)
                all_transactions.extend(transactions)
            except Exception as e:
                error_msg = f"{filename}: {str(e)}"
                logger.error(f"Error parsing CSV file: {error_msg}")
                parse_errors.append(error_msg)

        # Apply filter rules
        filtered_transactions = self._apply_filters(all_transactions)

        # Calculate statistics
        total = len(filtered_transactions)
        filtered = sum(1 for t in filtered_transactions if t.is_filtered)
        errors = sum(1 for t in filtered_transactions if t.validation_errors)

        return CsvParseResult(
            transactions=filtered_transactions,
            total_count=total,
            import_count=total - filtered,
            filtered_count=filtered,
            error_count=errors,
            parse_errors=parse_errors,
        )

    def _detect_account(self, filename: str) -> str:
        """
        Detect account from filename.

        Args:
            filename: Uploaded filename

        Returns:
            Account identifier (1466 or 2939)

        Raises:
            ValueError: If account cannot be detected
        """
        for account_id in ACCOUNT_CONFIG.keys():
            if account_id in filename:
                return account_id

        raise ValueError(f"Cannot detect account from filename: {filename}. Expected 1466 or 2939.")

    async def _parse_file(
        self,
        content: bytes,
        account: str,
        filename: str = "preview.csv",
    ) -> List[ParsedTransaction]:
        """
        Parse a single CSV file and return parsed transactions.

        Args:
            content: File content as bytes
            account: Account identifier

        Returns:
            List of ParsedTransaction objects
        """
        try:
            text = content.decode("utf-8")
            reader = csv.DictReader(StringIO(text))

            if account == "1466":
                return self._parse_chase_1466(reader, filename)
            elif account == "2939":
                return self._parse_chase_2939(reader, filename)
            else:
                raise ValueError(f"Unknown account: {account}")
        except Exception as e:
            logger.error(f"Error parsing CSV: {str(e)}")
            raise

    def _parse_chase_1466(
        self,
        reader: csv.DictReader,
        filename: str = "preview.csv",
    ) -> List[ParsedTransaction]:
        """
        Parse Chase credit card CSV (account 1466).

        Columns: Transaction Date, Post Date, Description, Category, Type, Amount, Memo
        """
        transactions = []

        for row_num, row in enumerate(reader, start=2):  # Row 1 is header
            try:
                # Extract and transform fields
                transaction_date = datetime.strptime(row["Transaction Date"], "%m/%d/%Y").date()
                post_date = datetime.strptime(row["Post Date"], "%m/%d/%Y").date()
                description = row["Description"].strip()
                transaction_type = row.get("Type", "").strip()
                amount = abs(Decimal(row["Amount"]))  # Make positive
                chase_category = row.get("Category", "").strip() or None

                transactions.append(
                    ParsedTransaction(
                        preview_id=self._build_preview_id(filename, row_num),
                        row_number=row_num,
                        account="1466",
                        account_name=ACCOUNT_CONFIG["1466"]["name"],
                        transaction_date=transaction_date,
                        post_date=post_date,
                        description=description,
                        amount=amount,
                        chase_category=chase_category,
                        is_filtered=transaction_type.upper() == "PAYMENT",
                        filter_reason=(
                            "Filtered 1466 payment transaction" if transaction_type.upper() == "PAYMENT" else None
                        ),
                    )
                )
            except Exception as e:
                # Include row with errors instead of failing
                logger.warning(f"Error parsing row {row_num}: {str(e)}")
                transactions.append(
                    ParsedTransaction(
                        preview_id=self._build_preview_id(filename, row_num),
                        row_number=row_num,
                        account="1466",
                        account_name=ACCOUNT_CONFIG["1466"]["name"],
                        transaction_date=None,
                        post_date=datetime.now().date(),
                        description=row.get("Description", "ERROR"),
                        amount=Decimal(0),
                        validation_errors=[f"Parse error: {str(e)}"],
                    )
                )

        return transactions

    def _parse_chase_2939(
        self,
        reader: csv.DictReader,
        filename: str = "preview.csv",
    ) -> List[ParsedTransaction]:
        """
        Parse Chase checking account CSV (account 2939).

        Columns: Details, Posting Date, Description, Amount, Type, Balance, Check or Slip #
        Only has post_date, no transaction_date.
        """
        transactions = []

        for row_num, row in enumerate(reader, start=2):  # Row 1 is header
            try:
                # Extract and transform fields
                details = row.get("Details", "").strip() or None
                post_date = datetime.strptime(row["Posting Date"], "%m/%d/%Y").date()
                description = row["Description"].strip()
                amount = abs(Decimal(row["Amount"]))  # Make positive

                transactions.extend(
                    self._build_chase_2939_transactions(
                        filename=filename,
                        row_number=row_num,
                        post_date=post_date,
                        description=description,
                        details=details,
                        amount=amount,
                    )
                )
            except Exception as e:
                # Include row with errors instead of failing
                logger.warning(f"Error parsing row {row_num}: {str(e)}")
                transactions.append(
                    ParsedTransaction(
                        preview_id=self._build_preview_id(filename, row_num),
                        row_number=row_num,
                        account="2939",
                        account_name=ACCOUNT_CONFIG["2939"]["name"],
                        transaction_date=None,
                        post_date=datetime.now().date(),
                        description=row.get("Description", "ERROR"),
                        details=row.get("Details", "").strip() or None,
                        amount=Decimal(0),
                        validation_errors=[f"Parse error: {str(e)}"],
                    )
                )

        return transactions

    def _build_chase_2939_transactions(
        self,
        *,
        filename: str,
        row_number: int,
        post_date,
        description: str,
        details: str | None,
        amount: Decimal,
    ) -> List[ParsedTransaction]:
        """Build one or more parsed transactions for a checking row."""
        if self._should_split_servicemac_transaction(description=description, amount=amount):
            return [
                self._create_chase_2939_transaction(
                    preview_id=self._build_preview_id(filename, row_number, 0),
                    row_number=row_number,
                    post_date=post_date,
                    description=description,
                    details=details,
                    amount=Decimal("2955.28"),
                    budget_id=MORTGAGE_BUDGET_ID,
                ),
                self._create_chase_2939_transaction(
                    preview_id=self._build_preview_id(filename, row_number, 1),
                    row_number=row_number,
                    post_date=post_date,
                    description=description,
                    details=details,
                    amount=Decimal("1000.00"),
                    budget_id=ADDITIONAL_MORTGAGE_BUDGET_ID,
                ),
            ]

        return [
            self._create_chase_2939_transaction(
                preview_id=self._build_preview_id(filename, row_number),
                row_number=row_number,
                post_date=post_date,
                description=description,
                details=details,
                amount=amount,
            )
        ]

    def _create_chase_2939_transaction(
        self,
        *,
        preview_id: str,
        row_number: int,
        post_date,
        description: str,
        details: str | None,
        amount: Decimal,
        budget_id: int | None = None,
    ) -> ParsedTransaction:
        """Create a parsed checking transaction with optional pre-categorization."""
        return ParsedTransaction(
            preview_id=preview_id,
            row_number=row_number,
            account="2939",
            account_name=ACCOUNT_CONFIG["2939"]["name"],
            transaction_date=None,  # Checking doesn't have transaction_date
            post_date=post_date,
            description=description,
            details=details,
            amount=amount,
            chase_category=None,  # Checking doesn't have category
            budget_id=budget_id,
            auto_categorized=budget_id is not None,
        )

    def _should_split_servicemac_transaction(self, *, description: str, amount: Decimal) -> bool:
        """Return True when a ServiceMac mortgage payment should be split."""
        return SERVICEMAC_SPLIT_DESCRIPTION in description.upper() and amount == SERVICEMAC_SPLIT_AMOUNT

    def _apply_filters(self, transactions: List[ParsedTransaction]) -> List[ParsedTransaction]:
        """
        Apply filtering rules to transactions.

        Current rule:
        - For account 2939: Filter out descriptions containing "1466" (credit card payments)
        - For account 2939: Filter out rows where Details is CREDIT or DSLIP

        Args:
            transactions: List of parsed transactions

        Returns:
            Same list with is_filtered and filter_reason set where applicable
        """
        for txn in transactions:
            if txn.account != "2939":
                continue

            details = (txn.details or "").upper()

            # Rule: Filter out checking account (2939) transactions that are payments to credit card (1466)
            if "1466" in txn.description:
                txn.is_filtered = True
                txn.filter_reason = "Payment to credit card (1466)"
                continue

            if details in {"CREDIT", "DSLIP"}:
                txn.is_filtered = True
                txn.filter_reason = f"Filtered by Details value ({details})"

        return transactions
