"""
Cleaning applied to every uploaded dataset, before it is stored.

Kept separate from the solvers so the models always receive data that has
already been checked.
"""

import pandas as pd

from app.solvers.common import suggest_column

# Energy per gram of each macronutrient (kcal), the standard 4-4-9 factors
KCAL_PER_GRAM = {"protein": 4, "carbohydrates": 4, "fat": 9}


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
