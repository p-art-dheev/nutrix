"""
Cleaning applied to every uploaded dataset, before it is stored.

Kept separate from the solvers so the models always receive data that has
already been checked.
"""

import re

import pandas as pd

from app.solvers.common import suggest_column

# Energy per gram of each macronutrient (kcal), the standard 4-4-9 factors
KCAL_PER_GRAM = {"protein": 4, "carbohydrates": 4, "fat": 9}

# Columns pandas creates for an unnamed header, e.g. a saved DataFrame index:
# "Unnamed: 0", "Unnamed: 0.1"
INDEX_COLUMN = re.compile(r"^Unnamed: \d+(\.\d+)*$")


def clean_table(df: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, int]]:
    """
    General tidying of an uploaded table, independent of what it contains:

    1. drop index columns pandas wrote into the CSV ("Unnamed: 0", ...)
    2. drop rows whose numeric values are all zero (or missing): such a food
       carries no information and only adds noise

    Returns (cleaned_df, counts) where counts says how much each step changed.
    """
    index_cols = [c for c in df.columns if INDEX_COLUMN.match(str(c))]
    df = df.drop(columns=index_cols)

    numeric = df.select_dtypes(include="number")
    if numeric.empty:
        all_zero = pd.Series(False, index=df.index)
    else:
        all_zero = numeric.fillna(0).eq(0).all(axis=1)
    df = df[~all_zero].reset_index(drop=True)

    return df, {
        "index_columns_dropped": len(index_cols),
        "zero_rows_dropped": int(all_zero.sum()),
    }


def drop_impossible_rows(df: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    """
    Remove rows whose protein, carbs and fat give far more energy than the
    calories listed for that row (e.g. 175 g protein in a 140 kcal food).
    Such rows look like "free" nutrients to the solvers.

    Returns (cleaned_df, removed_count). If the dataset has no calories,
    protein, carbs or fat column, the check is skipped.
    """
    columns = {role: suggest_column(df, role) for role in ("calories", *KCAL_PER_GRAM)}
    if any(col is None for col in columns.values()):
        return df, 0

    def values(role: str) -> pd.Series:
        return pd.to_numeric(df[columns[role]], errors="coerce")

    macro_kcal = sum(factor * values(role) for role, factor in KCAL_PER_GRAM.items())
    # 1.5x plus 20 kcal leaves room for rounding and fibre counted as carbs
    impossible = macro_kcal > 1.5 * values("calories") + 20

    return df[~impossible].reset_index(drop=True), int(impossible.sum())
