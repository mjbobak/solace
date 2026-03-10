"""Tests for CSV ETL service."""

import csv
from decimal import Decimal
from io import StringIO

from backend.app.etl.csv_etl_service import CsvEtlService


class TestCsvEtlService:
    """Tests for CSV ETL filtering and parsing rules."""

    def test_parse_chase_1466_filters_payment_rows(self):
        """Account 1466 rows with Type=Payment should be marked as filtered."""
        service = CsvEtlService()
        reader = csv.DictReader(
            StringIO(
                "\n".join(
                    [
                        "Transaction Date,Post Date,Description,Category,Type,Amount,Memo",
                        "03/01/2026,03/02/2026,AUTOPAY,,Payment,-500.00,",
                        "03/03/2026,03/04/2026,COFFEE SHOP,Food & Drink,Sale,-6.25,",
                    ]
                )
            )
        )

        transactions = service._parse_chase_1466(reader)

        assert len(transactions) == 2
        assert transactions[0].is_filtered is True
        assert transactions[0].filter_reason == "Filtered 1466 payment transaction"
        assert transactions[1].is_filtered is False
        assert transactions[1].filter_reason is None

    def test_parse_chase_2939_splits_servicemac_mortgage_payment(self):
        """Exact ServiceMac mortgage payments should import as mortgage + extra principal."""
        service = CsvEtlService()
        reader = csv.DictReader(
            StringIO(
                "\n".join(
                    [
                        "Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #",
                        (
                            "DEBIT,03/02/2026,"
                            "SERVICEMAC PMT   MTGE PAYMT 5110249801      WEB ID: 4823070213,"
                            "-3955.28,ACH_DEBIT,10000.00,"
                        ),
                    ]
                )
            )
        )

        transactions = service._parse_chase_2939(reader)

        assert len(transactions) == 2
        assert [txn.amount for txn in transactions] == [Decimal("2955.28"), Decimal("1000.00")]
        assert [txn.budget_id for txn in transactions] == [6, 28]
        assert all(txn.auto_categorized is True for txn in transactions)
