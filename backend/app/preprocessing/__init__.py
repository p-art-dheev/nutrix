"""
Preprocessing applied to every uploaded dataset, before it is stored.

Kept separate from statistics and optimization so they always receive data
that has already been checked. The steps run in this order:

    1. drop index columns          cleaning.drop_index_columns
    2. drop all-zero rows          cleaning.drop_zero_rows
    3. drop impossible rows        validation.drop_impossible_rows
    4. drop rows not per 100 g     validation.drop_not_per_100g_rows
"""

import pandas as pd

from app.preprocessing.cleaning import drop_index_columns, drop_zero_rows
from app.preprocessing.validation import drop_impossible_rows, drop_not_per_100g_rows


def preprocess(df: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, int]]:
    """Run all preprocessing steps. Returns (clean_df, how many columns/rows each step removed)."""
    df, index_columns = drop_index_columns(df)
    df, zero_rows = drop_zero_rows(df)
    if df.empty:
        raise ValueError("The uploaded files contain no data rows")
    df, impossible_rows = drop_impossible_rows(df)
    df, not_per_100g_rows = drop_not_per_100g_rows(df)

    return df, {
        "index_columns_dropped": index_columns,
        "zero_rows_dropped": zero_rows,
        "rows_removed": impossible_rows,  # impossible nutrient values
        "not_per_100g_rows_dropped": not_per_100g_rows,  # values too large for 100 g
    }
