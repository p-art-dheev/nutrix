"""
Validation steps 3 and 4: remove rows whose nutrient values are physically impossible.
"""

import pandas as pd

from app.columns import suggest_column

# Energy per gram of each macronutrient (kcal), the standard 4-4-9 factors
KCAL_PER_GRAM = {"protein": 4, "carbohydrates": 4, "fat": 9}

# Limits for a 100 g portion: pure fat has about 900 kcal per 100 g, and the
# macronutrients of 100 g of food cannot weigh more than 100 g together.
MAX_KCAL_PER_100G = 900
MAX_MACRO_GRAMS_PER_100G = 100


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


def drop_not_per_100g_rows(df: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    """
    Remove rows that cannot describe 100 g of food: more than 900 kcal, or
    protein + fat + carbohydrates above 100 g (e.g. a whole roast entered as one row).

    Returns (cleaned_df, removed_count). Checks whose columns are missing are skipped.
    """
    columns = {role: suggest_column(df, role) for role in ("calories", *KCAL_PER_GRAM)}
    not_per_100g = pd.Series(False, index=df.index)

    if columns["calories"] is not None:
        kcal = pd.to_numeric(df[columns["calories"]], errors="coerce")
        not_per_100g |= kcal > MAX_KCAL_PER_100G

    macro_cols = [columns[role] for role in KCAL_PER_GRAM if columns[role] is not None]
    if macro_cols:
        macro_grams = sum(pd.to_numeric(df[col], errors="coerce").fillna(0) for col in macro_cols)
        not_per_100g |= macro_grams > MAX_MACRO_GRAMS_PER_100G

    return df[~not_per_100g].reset_index(drop=True), int(not_per_100g.sum())
