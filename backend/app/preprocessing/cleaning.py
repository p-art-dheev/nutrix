"""
Cleaning steps 1 and 2: general tidying, independent of what the table contains.
"""

import re

import pandas as pd

# Columns pandas creates for an unnamed header, e.g. a saved DataFrame index:
# "Unnamed: 0", "Unnamed: 0.1"
INDEX_COLUMN = re.compile(r"^Unnamed: \d+(\.\d+)*$")


def drop_index_columns(df: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    """Step 1: drop index columns pandas wrote into the CSV ("Unnamed: 0", ...)."""
    index_cols = [c for c in df.columns if INDEX_COLUMN.match(str(c))]
    return df.drop(columns=index_cols), len(index_cols)


def drop_zero_rows(df: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    """
    Step 2: drop rows whose numeric values are all zero (or missing).
    Such a food carries no information and only adds noise.
    """
    numeric = df.select_dtypes(include="number")
    if numeric.empty:
        return df, 0
    all_zero = numeric.fillna(0).eq(0).all(axis=1)
    return df[~all_zero].reset_index(drop=True), int(all_zero.sum())
