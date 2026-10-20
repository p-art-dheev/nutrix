"""
Descriptive statistics of one numeric column.
"""

import math

import pandas as pd


def _number_or_none(value: float):
    """NaN/inf (e.g. std of a single value) cannot be sent as JSON."""
    return None if math.isnan(value) or math.isinf(value) else value


def describe(series: pd.Series) -> dict:
    """Count, mean, median, standard deviation, min, Q1, Q3 and max (missing values ignored)."""
    s = series.dropna()
    stats = {
        "count": int(s.count()),
        "mean": float(s.mean()),
        "median": float(s.median()),
        "std": float(s.std()),            # sample standard deviation (n - 1)
        "min": float(s.min()),
        "q1": float(s.quantile(0.25)),
        "q3": float(s.quantile(0.75)),
        "max": float(s.max()),
    }
    return {key: _number_or_none(value) for key, value in stats.items()}
