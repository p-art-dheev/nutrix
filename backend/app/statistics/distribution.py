"""
Distribution of one numeric column: a histogram with equal-width bins.
"""

import math

import numpy as np
import pandas as pd


def _range_label(lower: float, upper: float) -> str:
    """Bin label rounded to the size of the numbers: '0.00 - 0.50', '28.0 - 56.0', '1200 - 1800'."""
    if upper > 1000:
        return f"{int(lower)} - {int(upper)}"
    if upper > 10:
        return f"{lower:.1f} - {upper:.1f}"
    return f"{lower:.2f} - {upper:.2f}"


def histogram(series: pd.Series, bins: int) -> dict:
    """
    Split the value range into `bins` equal-width bins, width = (max - min) / bins,
    and count the values in each. Also returns mean, median and standard deviation.
    """
    s = series.dropna()
    if s.empty:
        raise ValueError("Column contains no valid data.")

    counts, edges = np.histogram(s, bins=bins)

    def number_or_none(value: float):
        return None if math.isnan(value) else value

    return {
        "statistics": {
            "mean": number_or_none(float(s.mean())),
            "median": number_or_none(float(s.median())),
            "std": number_or_none(float(s.std())),
        },
        "distribution": [
            {"range": _range_label(float(edges[i]), float(edges[i + 1])), "count": int(counts[i])}
            for i in range(len(counts))
        ],
    }
