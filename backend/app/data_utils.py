import math
from typing import Any

import numpy as np
import pandas as pd


def get_food_column(df: pd.DataFrame) -> str:
    for name in ("food", "Food", "name", "Name", "food_name", "Food Name"):
        if name in df.columns:
            return name
    for col in df.columns:
        if df[col].dtype == "object":
            return col
    return str(df.columns[0])


def serialize_value(value: Any) -> Any:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return None
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating, float)):
        if math.isnan(value) or math.isinf(value):
            return None
        return float(value)
    if isinstance(value, (np.bool_,)):
        return bool(value)
    return value


def row_to_dict(df: pd.DataFrame, row_index: int, columns: list[str]) -> dict[str, Any]:
    row = df.iloc[row_index]
    return {col: serialize_value(row[col]) for col in columns}
