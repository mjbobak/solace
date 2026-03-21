#!/usr/bin/env python3
"""Create a demo-safe copy of the primary SQLite database.

The generated database keeps the schema, record counts, and foreign keys intact
while rewriting identifying and household-specific content into a coherent
fictional dataset suitable for demos.
"""

from __future__ import annotations

import argparse
import random
import re
import shutil
import sqlite3
import sys
import uuid
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
DEFAULT_SOURCE = ROOT / "data" / "database.db"
DEFAULT_TARGET = ROOT / "data" / "database.demo.db"
SEED = 20260318
UUID_NAMESPACE = uuid.UUID("6f7e778b-93fb-4c70-8244-c1a43d7ce051")
DEMO_USERNAME = "demo"
DEMO_PASSWORD = "demo123"

CHECKING_ACCOUNT = "Harbor Checking"
CREDIT_ACCOUNT = "Summit Rewards Visa"
SECONDARY_CARD = "Crescent Cash Card"

CATEGORY_NAMES = {
    1: "Kids & School",
    2: "Household Basics",
    3: "Loans & Commitments",
    4: "Leisure",
    5: "Family Flex",
    6: "Personal Allowances",
    7: "Wellness",
    8: "Long-Term Goals",
    9: "Annual Escrow",
    10: "Emergency Buffer",
    11: "Transportation",
    12: "Home Utilities",
    13: "Prototype Lab",
    14: "Streaming",
}

BUDGET_TEXT = {
    1: ("Rowan Basics", "Seasonal clothing, school gear, and everyday kid supplies."),
    2: ("Learning Studio Tuition", "Monthly tuition and occasional school program fees."),
    3: ("Market & Pantry", "Groceries, pantry staples, and quick home supply runs."),
    4: ("Auto Loan", ""),
    5: ("Bank & Card Fees", "Annual card fees and account service charges."),
    6: ("Home Mortgage", ""),
    7: ("Kids Programs", ""),
    8: ("Household Memberships", ""),
    10: ("Device Protection Plan", ""),
    11: ("Family Cloud Bundle", ""),
    12: ("Warehouse Membership", ""),
    15: ("Navigation Premium", ""),
    17: ("Childcare Backup", ""),
    18: ("Home Cleaning", ""),
    19: ("Dining & Date Nights", ""),
    20: ("Celebrations & Gifts", ""),
    21: ("Home Projects & Shopping", ""),
    22: ("Travel & Outings", ""),
    24: ("Casey Personal", ""),
    25: ("Jordan Personal", ""),
    26: ("Health & Wellness", ""),
    27: ("Education Savings", ""),
    28: ("Extra Principal", ""),
    29: ("Auto Insurance", ""),
    30: ("Home Insurance", ""),
    31: ("Property Taxes", ""),
    32: ("House Buffer", ""),
    33: ("Fuel & Charging", ""),
    34: ("Vehicle Registration", ""),
    35: ("Commute Costs", ""),
    36: ("UTILS - Electric", ""),
    37: ("UTILS - Gas", ""),
    38: ("UTILS - Internet", ""),
    39: ("UTILS - Mobile", ""),
    40: ("UTILS - Waste", ""),
    41: ("UTILS - Water", ""),
    42: ("Brokerage Investing", ""),
    43: ("Streaming Bundle", "Video, music, and family entertainment subscriptions."),
}

BUDGET_FACTORS = {
    1: 1.09,
    2: 0.93,
    3: 1.04,
    4: 0.96,
    5: 1.08,
    6: 0.91,
    7: 1.11,
    8: 0.98,
    10: 1.06,
    11: 0.95,
    12: 1.02,
    15: 1.03,
    17: 1.12,
    18: 1.05,
    19: 1.08,
    20: 0.92,
    21: 1.03,
    22: 1.05,
    24: 0.86,
    25: 0.88,
    26: 1.01,
    27: 1.10,
    28: 0.94,
    29: 1.04,
    30: 0.97,
    31: 1.06,
    32: 1.09,
    33: 1.02,
    34: 1.07,
    35: 0.99,
    36: 1.05,
    37: 0.96,
    38: 1.04,
    39: 0.93,
    40: 1.01,
    41: 1.05,
    42: 0.89,
    43: 1.12,
}

LOW_VARIANCE_BUDGETS = {
    2,
    4,
    5,
    6,
    10,
    11,
    12,
    15,
    24,
    25,
    27,
    28,
    29,
    30,
    31,
    32,
    34,
    35,
    36,
    37,
    38,
    39,
    40,
    41,
    42,
}

WHOLE_DOLLAR_BUDGETS = {2, 4, 7, 8, 12, 15, 17, 18, 20, 22, 24, 25, 27, 28, 32, 34, 35, 42}

INCOME_SOURCE_NAMES = {
    1: "North Peak Robotics",
    2: "Lakeview Analytics",
    5: "Cedar Street Studio",
}

INCOME_COMPONENT_LABELS = {
    1: "Base salary",
    2: "Base salary",
    3: "Annual performance bonus",
    4: "Spring incentive",
    5: "Summer incentive",
    6: "Autumn incentive",
    7: "Year-end incentive",
    8: "Retention bonus",
    11: "Consulting income",
    12: "Learning reimbursement",
    13: "Dependent care reimbursement",
    14: "Tax refund",
    15: "Dependent care reimbursement",
    16: "Tax refund",
}

INCOME_VERSION_OVERRIDES = {
    1: (6895.00, 4120.00, 24),
    2: (4980.00, 2810.00, 26),
    5: (7240.00, 4350.00, 24),
    6: (5210.00, 2960.00, 26),
    7: (6685.00, 3980.00, 24),
}

INCOME_OCCURRENCE_OVERRIDES = {
    1: (24500.00, 13950.00, "actual"),
    2: (3350.00, 2310.00, "actual"),
    3: (3480.00, 2390.00, "expected"),
    4: (3525.00, 2435.00, "expected"),
    5: (3610.00, 2495.00, "expected"),
    6: (22800.00, 13350.00, "actual"),
    7: (9800.00, 6650.00, "actual"),
    9: (0.00, 5200.00, "actual"),
    11: (0.00, 3600.00, "actual"),
}

YEAR_SETTINGS = {
    2025: {"contributions_401k": 22000.00, "emergency_fund_balance": 42000.00},
    2026: {"contributions_401k": 28500.00, "emergency_fund_balance": 46000.00},
}

YEAR_BUCKETS = {
    2025: {
        "401k": 22000.00,
        "hsa": 5200.00,
        "fsa_daycare": 4200.00,
        "fsa_medical": 1800.00,
    },
    2026: {
        "401k": 28500.00,
        "hsa": 6400.00,
        "fsa_daycare": 5000.00,
        "fsa_medical": 2200.00,
    },
}

ACCOUNT_RENAMES = {
    "Chase Checking": CHECKING_ACCOUNT,
    "Chase Credit Card": CREDIT_ACCOUNT,
    "Discover": SECONDARY_CARD,
}


@dataclass(frozen=True)
class BudgetDefinition:
    merchants: tuple[str, ...]
    chase_categories: tuple[str | None, ...]
    formatter: str = "merchant"
    account: str | None = None


BUDGET_DEFINITIONS = {
    1: BudgetDefinition(
        merchants=(
            "Sprout & Pine Kids",
            "Paper Kite Children",
            "Juniper School Supply",
            "Row House Books",
            "Little Harbor Shoes",
            "Northfield Kids Co.",
        ),
        chase_categories=("Shopping", "Shopping", "Shopping", "Education"),
    ),
    2: BudgetDefinition(
        merchants=("Maple Grove Learning Co-op",),
        chase_categories=(None,),
        formatter="zelle",
        account=CHECKING_ACCOUNT,
    ),
    3: BudgetDefinition(
        merchants=(
            "Green Basket Market",
            "Cedar Street Grocer",
            "Harvest Commons",
            "Riverway Foods",
            "Oak Pantry",
            "Sunrise Produce",
            "Neighborhood Pharmacy",
        ),
        chase_categories=("Groceries", "Groceries", "Groceries", "Food & Drink", "Shopping", "Health & Wellness"),
    ),
    4: BudgetDefinition(
        merchants=("Pioneer Credit Union AUTO LOAN",),
        chase_categories=(None,),
        formatter="ach",
        account=CHECKING_ACCOUNT,
    ),
    5: BudgetDefinition(
        merchants=("Summit Rewards Annual Fee", "Harbor Banking Service Fee", "Card Statement Fee"),
        chase_categories=("Fees & Adjustments",),
    ),
    6: BudgetDefinition(
        merchants=("Riverstone Home Loans",),
        chase_categories=(None,),
        formatter="ach",
        account=CHECKING_ACCOUNT,
    ),
    7: BudgetDefinition(
        merchants=("Bluebird Swim School", "Maker Barn Workshops", "Little Fox Soccer", "Piano Path Studio"),
        chase_categories=("Education", "Entertainment"),
    ),
    8: BudgetDefinition(
        merchants=("Neighborhood Pool Club", "City Museum Membership", "Family Rec Pass"),
        chase_categories=("Entertainment",),
    ),
    10: BudgetDefinition(
        merchants=("Device Shield Plan",),
        chase_categories=("Shopping",),
    ),
    11: BudgetDefinition(
        merchants=("Family Cloud Bundle",),
        chase_categories=("Shopping",),
    ),
    12: BudgetDefinition(
        merchants=("Warehouse Club Membership",),
        chase_categories=("Shopping",),
    ),
    15: BudgetDefinition(
        merchants=("RoadPilot Premium",),
        chase_categories=("Automotive",),
    ),
    17: BudgetDefinition(
        merchants=("Maple Nannies", "Evening Sitter Co.", "Bright Weekend Care"),
        chase_categories=("Personal", "Education"),
    ),
    18: BudgetDefinition(
        merchants=("Bright Nest Home Care", "Neat Harbor Cleaning", "Sparrow Housekeeping"),
        chase_categories=("Home",),
    ),
    19: BudgetDefinition(
        merchants=(
            "Luna Pasta House",
            "Ember Cafe",
            "Cobalt Tacos",
            "North Side Ramen",
            "Basil & Board",
            "Copper Lantern",
            "Riverfront Bistro",
            "Marlow Coffee",
        ),
        chase_categories=("Food & Drink",),
    ),
    20: BudgetDefinition(
        merchants=("Willow Gift Shop", "Paper Lantern Gifts", "Oak Street Florals", "NeighborAid Donation"),
        chase_categories=("Gifts & Donations", "Shopping"),
    ),
    21: BudgetDefinition(
        merchants=(
            "Harbor Home Supply",
            "Juniper Decor",
            "Lakeside Hardware",
            "Fern Market",
            "Studio North Prints",
            "Tool Shed Direct",
            "Garden & Grain",
            "Hearth & Table",
        ),
        chase_categories=("Home", "Shopping", "Personal", "Professional Services"),
    ),
    22: BudgetDefinition(
        merchants=(
            "Skyway Air",
            "Trailhead Hotel",
            "MetroRide",
            "ParkPass Mobile",
            "Express Tollway",
            "Station Car Share",
            "Bluewater Weekend Inn",
        ),
        chase_categories=("Travel",),
    ),
    24: BudgetDefinition(
        merchants=("Casey Personal Transfer",),
        chase_categories=(None,),
        formatter="transfer_person",
        account=CHECKING_ACCOUNT,
    ),
    25: BudgetDefinition(
        merchants=("Jordan Personal Transfer",),
        chase_categories=(None,),
        formatter="transfer_person",
        account=CHECKING_ACCOUNT,
    ),
    26: BudgetDefinition(
        merchants=("Harbor Yoga Collective", "Wellpath Physical Therapy", "Lumen Wellness Clinic"),
        chase_categories=("Health & Wellness",),
    ),
    27: BudgetDefinition(
        merchants=("BrightFuture Learning Fund",),
        chase_categories=(None,),
        formatter="education_transfer",
        account=CHECKING_ACCOUNT,
    ),
    28: BudgetDefinition(
        merchants=("Riverstone Home Loans",),
        chase_categories=(None,),
        formatter="extra_principal",
        account=CHECKING_ACCOUNT,
    ),
    29: BudgetDefinition(
        merchants=("North Harbor Auto Insurance", "Cedar Mutual Auto", "Summit Road Insurance"),
        chase_categories=("Bills & Utilities", "Automotive"),
        formatter="autopay",
        account=CHECKING_ACCOUNT,
    ),
    30: BudgetDefinition(
        merchants=("North Harbor Home Insurance", "Maple Shield Property", "Cedar Mutual Home"),
        chase_categories=("Bills & Utilities", "Home"),
        formatter="autopay",
        account=CHECKING_ACCOUNT,
    ),
    31: BudgetDefinition(
        merchants=("Cook County Treasurer", "County Tax Services"),
        chase_categories=(None,),
        formatter="tax",
        account=CHECKING_ACCOUNT,
    ),
    32: BudgetDefinition(
        merchants=("Harbor Reserve Savings", "Home Repair Reserve"),
        chase_categories=(None,),
        formatter="reserve_transfer",
        account=CHECKING_ACCOUNT,
    ),
    33: BudgetDefinition(
        merchants=("North Loop Fuel", "QuickCharge Station", "Prairie Fuel Stop", "Metro Fuel Express"),
        chase_categories=("Gas", "Automotive"),
    ),
    34: BudgetDefinition(
        merchants=("Secretary of State Online", "County Vehicle Services", "City Sticker Payment"),
        chase_categories=("Bills & Utilities", "Automotive"),
    ),
    35: BudgetDefinition(
        merchants=("Regional Transit Pass",),
        chase_categories=("Travel",),
    ),
    36: BudgetDefinition(
        merchants=("Lake Electric Utility",),
        chase_categories=("Bills & Utilities",),
        formatter="autopay",
        account=CHECKING_ACCOUNT,
    ),
    37: BudgetDefinition(
        merchants=("Prairie Gas Utility",),
        chase_categories=("Bills & Utilities",),
        formatter="autopay",
        account=CHECKING_ACCOUNT,
    ),
    38: BudgetDefinition(
        merchants=("NorthNet Fiber",),
        chase_categories=("Bills & Utilities",),
        formatter="autopay",
        account=CHECKING_ACCOUNT,
    ),
    39: BudgetDefinition(
        merchants=("Peak Mobile",),
        chase_categories=("Bills & Utilities",),
        formatter="autopay",
        account=CHECKING_ACCOUNT,
    ),
    40: BudgetDefinition(
        merchants=("ClearWay Disposal",),
        chase_categories=("Bills & Utilities",),
        formatter="autopay",
        account=CHECKING_ACCOUNT,
    ),
    41: BudgetDefinition(
        merchants=("Village Water Services",),
        chase_categories=("Bills & Utilities",),
        formatter="autopay",
        account=CHECKING_ACCOUNT,
    ),
    42: BudgetDefinition(
        merchants=("Northstar Brokerage",),
        chase_categories=(None,),
        formatter="brokerage_transfer",
        account=CHECKING_ACCOUNT,
    ),
    43: BudgetDefinition(
        merchants=("StoryStream+", "CineCloud", "Melody Family", "Campfire Video"),
        chase_categories=("Entertainment",),
    ),
}

CATEGORY_MERCHANTS = {
    "Groceries": ("Green Basket Market", "Cedar Street Grocer", "Harvest Commons", "Riverway Foods"),
    "Food & Drink": ("Luna Pasta House", "Ember Cafe", "Copper Lantern", "Cobalt Tacos"),
    "Shopping": ("Juniper General Store", "Willow Mercantile", "Harbor Goods", "Oakline Retail"),
    "Travel": ("MetroRide", "ParkPass Mobile", "Trailhead Hotel", "Station Car Share"),
    "Bills & Utilities": ("Lake Electric Utility", "Prairie Gas Utility", "NorthNet Fiber", "Peak Mobile"),
    "Home": ("Harbor Home Supply", "Juniper Decor", "Lakeside Hardware"),
    "Health & Wellness": ("Harbor Yoga Collective", "Wellpath Physical Therapy", "Northside Pharmacy"),
    "Education": ("Bluebird Swim School", "Maker Barn Workshops", "Maple Grove Learning Co-op"),
    "Entertainment": ("Classic Theater Co.", "StoryStream+", "City Museum Membership"),
    "Gas": ("North Loop Fuel", "Prairie Fuel Stop", "QuickCharge Station"),
    "Fees & Adjustments": ("Annual Rewards Credit", "Card Service Adjustment"),
    "Professional Services": ("North Peak Design", "Harbor Tax Prep"),
    "Personal": ("Maple Nannies", "Jordan Personal Transfer", "Casey Personal Transfer"),
    "Miscellaneous": ("Neighborhood Merchant", "Local Services"),
    "Gifts & Donations": ("NeighborAid Donation", "Paper Lantern Gifts"),
    "Automotive": ("Cedar Mutual Auto", "QuickCharge Station", "County Vehicle Services"),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE, help="Path to the real database.")
    parser.add_argument("--output", type=Path, default=DEFAULT_TARGET, help="Path to the demo database copy.")
    return parser.parse_args()


def hash_password_for_demo(password: str) -> str:
    try:
        import bcrypt
    except ImportError:  # pragma: no cover - fallback for unusual local environments
        from backend.app.auth.password import hash_password

        return hash_password(password)
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def deterministic_rng(*parts: object) -> random.Random:
    seed = SEED
    for part in parts:
        for character in str(part):
            seed = (seed * 131 + ord(character)) % (2**32)
    return random.Random(seed)


def cycle_choice(options: Iterable[str], key: object) -> str:
    values = tuple(options)
    if not values:
        raise ValueError("Expected at least one option.")
    rng = deterministic_rng(key, "choice")
    return values[rng.randrange(len(values))]


def build_code(prefix: str, row_id: int, length: int = 8) -> str:
    rng = deterministic_rng(prefix, row_id)
    digits = "".join(str(rng.randrange(10)) for _ in range(length))
    return digits


def build_amount(original: float, key: object, *, base_factor: float, low_variance: bool, whole_dollars: bool) -> float:
    rng = deterministic_rng(key, "amount")
    jitter = 0.025 if low_variance else 0.14
    amount = max(1.00, original * (base_factor + rng.uniform(-jitter, jitter)))
    return float(round(amount if not whole_dollars else round(amount), 2))


def normalize_account(account: str | None) -> str | None:
    if account is None:
        return None
    return ACCOUNT_RENAMES.get(account, account)


def format_description(formatter: str, merchant: str, row_id: int, transaction_date: str | None) -> str:
    mmdd = ""
    if transaction_date:
        try:
            parsed = datetime.strptime(transaction_date, "%Y-%m-%d")
            mmdd = parsed.strftime("%m/%d")
        except ValueError:
            mmdd = ""
    if formatter == "merchant":
        return merchant
    if formatter == "ach":
        return f"{merchant} WEB ID: {build_code('ach', row_id, 10)}"
    if formatter == "zelle":
        return f"Zelle payment to {merchant} ref {build_code('zelle', row_id, 10)}"
    if formatter == "autopay":
        return f"{merchant} AUTO PAY REF {build_code('autopay', row_id, 8)}"
    if formatter == "tax":
        return f"{merchant} TAX PAYMENT REF {build_code('tax', row_id, 8)}"
    if formatter == "reserve_transfer":
        return f"Transfer to {merchant} ref {build_code('reserve', row_id, 8)}"
    if formatter == "transfer_person":
        ending = build_code("person", row_id, 4)
        return f"Transfer to {merchant} ending in {ending}"
    if formatter == "education_transfer":
        return f"{merchant} CONTRIBUTION WEB ID: {build_code('edu', row_id, 10)}"
    if formatter == "extra_principal":
        return f"{merchant} EXTRA PRINCIPAL WEB ID: {build_code('principal', row_id, 10)}"
    if formatter == "brokerage_transfer":
        return f"Transfer to {merchant} {build_code('brokerage', row_id, 6)}"
    if formatter == "statement_credit":
        suffix = f" {mmdd}" if mmdd else ""
        return f"{merchant}{suffix}"
    if formatter == "card_payment":
        suffix = f" {mmdd}" if mmdd else ""
        return f"Payment to Summit card ending in 7421{suffix}"
    if formatter == "checking_transfer":
        return f"Online transfer to Harbor Checking ref {build_code('checking', row_id, 10)}"
    if formatter == "atm":
        suffix = f" {mmdd}" if mmdd else ""
        return f"ATM withdrawal downtown station{suffix}"
    return merchant


def rewrite_users(connection: sqlite3.Connection) -> None:
    connection.execute(
        """
        UPDATE users
        SET username = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP
        """,
        (DEMO_USERNAME, hash_password_for_demo(DEMO_PASSWORD)),
    )


def rewrite_categories(connection: sqlite3.Connection) -> None:
    for category_id, name in CATEGORY_NAMES.items():
        connection.execute("UPDATE expense_categories SET name = ? WHERE id = ?", (name, category_id))


def rewrite_budgets(connection: sqlite3.Connection) -> None:
    rows = connection.execute(
        """
        SELECT id, budgeted
        FROM budgets
        ORDER BY id
        """
    ).fetchall()
    for row in rows:
        budget_id = row["id"]
        label, note = BUDGET_TEXT.get(budget_id, (f"Demo Budget {budget_id}", ""))
        factor = BUDGET_FACTORS.get(budget_id, 1.0)
        budgeted = build_amount(
            float(row["budgeted"]),
            f"budget:{budget_id}",
            base_factor=factor,
            low_variance=budget_id in LOW_VARIANCE_BUDGETS,
            whole_dollars=budget_id in WHOLE_DOLLAR_BUDGETS,
        )
        connection.execute(
            """
            UPDATE budgets
            SET expense_label = ?, expense_label_note = ?, budgeted = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (label, note or None, budgeted, budget_id),
        )


def rewrite_income(connection: sqlite3.Connection) -> None:
    for source_id, name in INCOME_SOURCE_NAMES.items():
        connection.execute(
            "UPDATE income_sources SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (name, source_id),
        )

    for component_id, label in INCOME_COMPONENT_LABELS.items():
        connection.execute(
            "UPDATE income_components SET label = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (label, component_id),
        )

    for version_id, (gross_amount, net_amount, periods_per_year) in INCOME_VERSION_OVERRIDES.items():
        connection.execute(
            """
            UPDATE income_component_versions
            SET gross_amount = ?, net_amount = ?, periods_per_year = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (gross_amount, net_amount, periods_per_year, version_id),
        )

    for occurrence_id, (gross_amount, net_amount, status) in INCOME_OCCURRENCE_OVERRIDES.items():
        connection.execute(
            """
            UPDATE income_occurrences
            SET gross_amount = ?, net_amount = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (gross_amount, net_amount, status, occurrence_id),
        )

    year_rows = connection.execute("SELECT id, year FROM income_year_settings").fetchall()
    year_id_by_year = {row["year"]: row["id"] for row in year_rows}
    for row in year_rows:
        settings = YEAR_SETTINGS.get(row["year"])
        if not settings:
            continue
        connection.execute(
            """
            UPDATE income_year_settings
            SET contributions_401k = ?, emergency_fund_balance = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (settings["contributions_401k"], settings["emergency_fund_balance"], row["id"]),
        )

    bucket_rows = connection.execute(
        """
        SELECT b.id, s.year, b.bucket_type
        FROM income_year_tax_advantaged_buckets b
        JOIN income_year_settings s ON s.id = b.year_settings_id
        """
    ).fetchall()
    for row in bucket_rows:
        annual_amount = YEAR_BUCKETS.get(row["year"], {}).get(row["bucket_type"])
        if annual_amount is None:
            continue
        connection.execute(
            """
            UPDATE income_year_tax_advantaged_buckets
            SET annual_amount = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (annual_amount, row["id"]),
        )

    for year, settings in YEAR_SETTINGS.items():
        settings_id = year_id_by_year.get(year)
        if settings_id is None:
            continue
        connection.execute(
            """
            UPDATE income_year_tax_advantaged_buckets
            SET annual_amount = ?
            WHERE year_settings_id = ? AND bucket_type = '401k'
            """,
            (settings["contributions_401k"], settings_id),
        )


def build_budget_transaction(row: sqlite3.Row) -> tuple[str, str | None, str | None, float]:
    budget_id = row["budget_id"]
    definition = BUDGET_DEFINITIONS.get(budget_id)
    if definition is None:
        merchant = f"Demo Merchant {budget_id}"
        description = merchant
        chase_category = row["chase_category"]
        account = normalize_account(row["account"])
    else:
        merchant = cycle_choice(definition.merchants, f"budget:{budget_id}:merchant:{row['id']}")
        chase_values = tuple(value for value in definition.chase_categories if value is not None)
        chase_category = cycle_choice(chase_values, f"budget:{budget_id}:chase:{row['id']}") if chase_values else None
        account = definition.account or normalize_account(row["account"])
        description = format_description(definition.formatter, merchant, row["id"], row["transaction_date"])

    amount = build_amount(
        float(row["amount"]),
        f"budget-transaction:{budget_id}:{row['id']}",
        base_factor=BUDGET_FACTORS.get(budget_id, 1.0),
        low_variance=budget_id in LOW_VARIANCE_BUDGETS,
        whole_dollars=budget_id in WHOLE_DOLLAR_BUDGETS,
    )
    return description, merchant, account, amount if chase_category is not None else amount


def category_based_merchant(chase_category: str | None, row_id: int) -> tuple[str, str | None]:
    if not chase_category:
        return ("Neighborhood Merchant", None)
    merchants = CATEGORY_MERCHANTS.get(chase_category)
    if not merchants:
        return ("Neighborhood Merchant", chase_category)
    return cycle_choice(merchants, f"category:{chase_category}:merchant:{row_id}"), chase_category


def rewrite_uncategorized_transaction(row: sqlite3.Row) -> tuple[str, str, str | None, str | None, float]:
    account = normalize_account(row["account"])
    original_description = (row["description"] or "").lower()
    chase_category = row["chase_category"]
    formatter = "merchant"

    if "statement credit" in original_description:
        merchant = "Annual Rewards Credit"
        formatter = "statement_credit"
        chase_category = "Fees & Adjustments"
    elif "payment thank you" in original_description or "payment to chase card ending" in original_description:
        merchant = "Summit Card Payment"
        formatter = "card_payment"
        chase_category = None
        account = CHECKING_ACCOUNT
    elif "online transfer to chk" in original_description:
        merchant = "Harbor Checking Transfer"
        formatter = "checking_transfer"
        chase_category = None
        account = CREDIT_ACCOUNT if account == CREDIT_ACCOUNT else CHECKING_ACCOUNT
    elif "atm withdrawal" in original_description:
        merchant = "Downtown Station ATM"
        formatter = "atm"
        chase_category = None
        account = CHECKING_ACCOUNT
    elif "zelle payment" in original_description:
        merchant = "Maple Grove Learning Co-op"
        formatter = "zelle"
        chase_category = None
        account = CHECKING_ACCOUNT
    elif "discover" in original_description:
        merchant = "Payment to Crescent Cash Card"
        formatter = "autopay"
        chase_category = None
        account = CHECKING_ACCOUNT
    elif "aafcu" in original_description:
        merchant = "Pioneer Credit Union AUTO LOAN"
        formatter = "ach"
        chase_category = None
        account = CHECKING_ACCOUNT
    elif "comed" in original_description:
        merchant = "Lake Electric Utility"
        formatter = "autopay"
        chase_category = "Bills & Utilities"
        account = CHECKING_ACCOUNT
    elif "nicor" in original_description:
        merchant = "Prairie Gas Utility"
        formatter = "autopay"
        chase_category = "Bills & Utilities"
        account = CHECKING_ACCOUNT
    elif "comcast" in original_description:
        merchant = "NorthNet Fiber"
        formatter = "autopay"
        chase_category = "Bills & Utilities"
        account = CHECKING_ACCOUNT
    elif "ild529" in original_description:
        merchant = "BrightFuture Learning Fund"
        formatter = "education_transfer"
        chase_category = None
        account = CHECKING_ACCOUNT
    else:
        merchant, chase_category = category_based_merchant(chase_category, row["id"])

    description = format_description(formatter, merchant, row["id"], row["transaction_date"])
    base_factor = 1.0 + deterministic_rng("uncategorized", row["id"]).uniform(-0.12, 0.12)
    amount = build_amount(
        float(row["amount"]),
        f"uncategorized:{row['id']}",
        base_factor=base_factor,
        low_variance=formatter in {"autopay", "card_payment", "statement_credit", "ach", "education_transfer"},
        whole_dollars=float(row["amount"]).is_integer(),
    )
    return description, merchant, account, chase_category, amount


def rewrite_transactions(connection: sqlite3.Connection) -> None:
    batch_values = [
        row["import_batch_id"]
        for row in connection.execute(
            "SELECT DISTINCT import_batch_id FROM transactions WHERE import_batch_id IS NOT NULL"
        ).fetchall()
    ]
    batch_map = {
        original: str(uuid.uuid5(UUID_NAMESPACE, f"batch:{original}"))
        for original in batch_values
        if original
    }

    rows = connection.execute(
        """
        SELECT id, transaction_date, description, merchant, account, amount, budget_id, chase_category, import_batch_id
        FROM transactions
        ORDER BY id
        """
    ).fetchall()

    for row in rows:
        if row["budget_id"] is not None:
            description, merchant, account, amount = build_budget_transaction(row)
            definition = BUDGET_DEFINITIONS.get(row["budget_id"])
            chase_values = ()
            if definition is not None:
                chase_values = tuple(value for value in definition.chase_categories if value is not None)
            chase_category = cycle_choice(chase_values, f"budget:{row['budget_id']}:chase:{row['id']}") if chase_values else None
        else:
            description, merchant, account, chase_category, amount = rewrite_uncategorized_transaction(row)

        connection.execute(
            """
            UPDATE transactions
            SET description = ?,
                merchant = ?,
                account = ?,
                amount = ?,
                chase_category = ?,
                import_batch_id = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (
                description,
                merchant,
                account,
                amount,
                chase_category,
                batch_map.get(row["import_batch_id"]),
                row["id"],
            ),
        )


def rewrite_demo_database(target: Path) -> None:
    connection = sqlite3.connect(target)
    connection.row_factory = sqlite3.Row
    try:
        connection.execute("PRAGMA foreign_keys = OFF")
        with connection:
            rewrite_users(connection)
            rewrite_categories(connection)
            rewrite_budgets(connection)
            rewrite_income(connection)
            rewrite_transactions(connection)
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("VACUUM")
    finally:
        connection.close()


def ensure_safe_paths(source: Path, target: Path) -> tuple[Path, Path]:
    source = source.resolve()
    target = target.resolve()
    if source == target:
        raise ValueError("Source and output must be different files.")
    if not source.exists():
        raise FileNotFoundError(f"Source database not found: {source}")
    return source, target


def main() -> None:
    args = parse_args()
    source, target = ensure_safe_paths(args.source, args.output)
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    rewrite_demo_database(target)
    print(f"Created demo database at {target}")
    print(f"Demo login: username={DEMO_USERNAME} password={DEMO_PASSWORD}")


if __name__ == "__main__":
    main()
