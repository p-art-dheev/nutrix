"""
Column detection: which dataset column holds what.

Detection is by column name only, so any dataset with recognizable names works.
Used by preprocessing, statistics and both optimization problems.
"""

import re
from typing import Optional

import pandas as pd

# Names we try (in order) to detect which column holds each value.
COLUMN_HINTS: dict[str, tuple[str, ...]] = {
    "calories": ("caloric value", "calories", "calorie", "energy", "kcal"),
    "fat": ("total fat", "fat"),
    "protein": ("protein",),
    "carbohydrates": ("carbohydrates", "carbohydrate", "carbs", "carb"),
}

# Numeric columns that are identifiers, not nutrients.
NON_NUTRIENT_COLUMNS = {"unnamed: 0", "id", "index"}

# Micronutrients a person can be deficient in (Problem 2). A column counts as a
# vitamin if its name starts with "vitamin" or one of the chemical names, and as a
# mineral if its name starts with a mineral name: "Iron", "Iron (mg)", "iron_mg".
VITAMIN_NAMES = (
    "vitamin", "thiamin", "riboflavin", "niacin", "pantothenic", "pyridoxine", "biotin",
    "folate", "folic acid", "cobalamin", "retinol", "ascorbic", "tocopherol", "choline",
)
MINERAL_NAMES = (
    "calcium", "iron", "magnesium", "phosphorus", "potassium", "sodium", "zinc", "copper",
    "manganese", "selenium", "iodine", "chromium", "molybdenum", "fluoride", "chloride",
)


def _clean_name(column: str) -> str:
    """'Total Fat (g)' -> 'total fat'   |   'protein_g' -> 'protein g'"""
    name = re.sub(r"\(.*?\)|\[.*?\]", "", str(column))
    return name.replace("_", " ").strip().lower()


def get_food_column(df: pd.DataFrame) -> str:
    """The column holding food names: 'food', 'name', ... or the first text column."""
    for name in ("food", "Food", "name", "Name", "food_name", "Food Name"):
        if name in df.columns:
            return name
    for col in df.columns:
        if df[col].dtype == "object":
            return col
    return str(df.columns[0])


def numeric_columns(df: pd.DataFrame) -> list[str]:
    """All numeric columns that could hold a nutrient value."""
    return [
        str(col)
        for col in df.select_dtypes(include="number").columns
        if str(col).strip().lower() not in NON_NUTRIENT_COLUMNS
    ]


def nutrient_columns(df: pd.DataFrame) -> list[str]:
    """Numeric columns holding a vitamin or mineral: the choices for Problem 2."""
    return [
        col for col in numeric_columns(df)
        if _clean_name(col).startswith(VITAMIN_NAMES + MINERAL_NAMES)
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
    Turn a column mapping into validated column names.
    `mapping` looks like {"calories": "Caloric Value", "fat": None, ...};
    a None value falls back to suggest_column().
    """
    resolved: dict[str, str] = {}
    available = numeric_columns(df)
    for role, column in mapping.items():
        column = column or suggest_column(df, role)
        if column is None:
            raise ValueError(f"Could not find a '{role}' column in this dataset.")
        if column not in df.columns:
            raise ValueError(f"Column '{column}' (mapped to {role}) is not in the dataset.")
        if column not in available:
            raise ValueError(f"Column '{column}' (mapped to {role}) is not numeric.")
        resolved[role] = column
    return resolved
