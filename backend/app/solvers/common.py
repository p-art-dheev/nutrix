"""
Shared helpers for every optimization method.

Every solver follows the same three steps:
    1. prepare foods   -> load_foods() turns dataset rows into plain dicts
    2. build the model -> done inside each solver file (PuLP)
    3. read the result -> solve() returns the solver status

Solvers only receive plain Python data (a list of food dicts), never the
DataFrame, so a new method can be added without touching the data layer.
"""

import re
from typing import Iterable, Optional

import pandas as pd
import pulp

from app.data_utils import get_food_column

# Names we try (in order) when pre-filling the column-mapping dropdowns.
# These are only suggestions — the user can always pick a different column.
COLUMN_HINTS: dict[str, tuple[str, ...]] = {
    "calories": ("caloric value", "calories", "calorie", "energy", "kcal"),
    "fat": ("total fat", "fat"),
    "protein": ("protein",),
}

# Numeric columns that are identifiers, not nutrients.
NON_NUTRIENT_COLUMNS = {"unnamed: 0", "id", "index"}


# ---------------------------------------------------------------------------
# Columns
# ---------------------------------------------------------------------------

def _clean_name(column: str) -> str:
    """'Total Fat (g)' -> 'total fat'   |   'protein_g' -> 'protein g'"""
    name = re.sub(r"\(.*?\)|\[.*?\]", "", str(column))
    return name.replace("_", " ").strip().lower()


def numeric_columns(df: pd.DataFrame) -> list[str]:
    """All numeric columns that could hold a nutrient value."""
    return [
        str(col)
        for col in df.select_dtypes(include="number").columns
        if str(col).strip().lower() not in NON_NUTRIENT_COLUMNS
    ]


def suggest_column(df: pd.DataFrame, role: str) -> Optional[str]:
    """
    Guess which column holds `role` (e.g. "fat").
    Pass 1: exact name match ('Fat', 'Total Fat (g)').
    Pass 2: name starts with the hint ('Protein g').
    A column like 'Saturated Fat' never matches 'fat' because it neither
    equals nor starts with it.
    """
    hints = COLUMN_HINTS.get(role, ())
    cleaned = {col: _clean_name(col) for col in numeric_columns(df)}
    for hint in hints:
        for col, name in cleaned.items():
            if name == hint:
                return col
    for hint in hints:
        for col, name in cleaned.items():
            if name.startswith(hint):
                return col
    return None


def resolve_columns(df: pd.DataFrame, mapping: dict[str, Optional[str]]) -> dict[str, str]:
    """
    Turn the user's column mapping into validated column names.
    `mapping` looks like {"calories": "Caloric Value", "fat": None, ...};
    a None value falls back to suggest_column().
    """
    resolved: dict[str, str] = {}
    available = numeric_columns(df)
    for role, column in mapping.items():
        column = column or suggest_column(df, role)
        if column is None:
            raise ValueError(f"Could not find a '{role}' column. Please map it manually.")
        if column not in df.columns:
            raise ValueError(f"Column '{column}' (mapped to {role}) is not in the dataset.")
        if column not in available:
            raise ValueError(f"Column '{column}' (mapped to {role}) is not numeric.")
        resolved[role] = column
    return resolved


# ---------------------------------------------------------------------------
# Foods
# ---------------------------------------------------------------------------

def load_foods(
    df: pd.DataFrame, row_ids: Iterable[int], columns: dict[str, str]
) -> tuple[list[dict], int]:
    """
    Build the food list a solver needs.

    Returns (foods, skipped_count). Each food looks like:
        {"id": 12, "name": "Lentils", "calories": 116.0, "protein": 9.0, ...}
    with one key per role in `columns` (values are per 100 g).

    Rows with a missing, non-numeric or negative value in any required column
    are skipped. Treating them as 0 would be wrong: a food with unknown
    calories would look calorie-free and the solver would pick it without limit.
    """
    food_column = get_food_column(df)
    foods: list[dict] = []
    skipped = 0

    for row_id in row_ids:
        if not 0 <= row_id < len(df):
            continue
        row = df.iloc[row_id]
        values = {role: pd.to_numeric(row[col], errors="coerce") for role, col in columns.items()}

        if any(pd.isna(v) or v < 0 for v in values.values()):
            skipped += 1
            continue

        name = row[food_column]
        foods.append({
            "id": int(row_id),
            "name": str(name) if pd.notna(name) else f"Food {row_id}",
            **{role: float(v) for role, v in values.items()},
        })

    return foods, skipped


# ---------------------------------------------------------------------------
# Solving
# ---------------------------------------------------------------------------

def solve(model: pulp.LpProblem) -> str:
    """Solve with the bundled CBC solver and return 'Optimal', 'Infeasible', ..."""
    model.solve(pulp.PULP_CBC_CMD(msg=False))
    return pulp.LpStatus[model.status]


def value(expression) -> float:
    """Numeric value of a PuLP variable/expression after solving (None -> 0)."""
    return float(pulp.value(expression) or 0.0)
