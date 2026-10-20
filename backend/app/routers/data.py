"""
HTTP layer for reading the stored dataset (the table on the Data page).
"""

import math
from typing import Any

import numpy as np
import pandas as pd
from fastapi import APIRouter, Depends, Query

from app.columns import get_food_column
from app.storage import current_dataset

router = APIRouter()


def _json_value(value: Any) -> Any:
    """Turn a pandas/numpy cell into a JSON-safe value (NaN/inf -> None)."""
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return None
    if isinstance(value, np.integer):
        return int(value)
    if isinstance(value, (np.floating, float)):
        return None if math.isnan(value) or math.isinf(value) else float(value)
    if isinstance(value, np.bool_):
        return bool(value)
    return value


@router.get("/api/data/rows")
def get_rows(
    offset: int = Query(0, ge=0),
    limit: int = Query(0, ge=0),
    df: pd.DataFrame = Depends(current_dataset),
):
    """
    Return dataset rows with all columns. limit=0 returns all rows from offset.
    """
    columns = [str(col) for col in df.columns]
    total = len(df)
    slice_df = df.iloc[offset:] if limit == 0 else df.iloc[offset: offset + limit]

    rows = []
    for idx in slice_df.index:
        row = df.iloc[int(idx)]
        rows.append({"id": int(idx), "values": {col: _json_value(row[col]) for col in columns}})

    return {
        "columns": columns,
        "food_column": get_food_column(df),
        "total": total,
        "offset": offset,
        "limit": limit if limit > 0 else total - offset,
        "rows": rows,
    }
