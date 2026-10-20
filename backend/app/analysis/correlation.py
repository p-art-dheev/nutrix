"""
Correlation between two numeric columns.
"""

import math

import pandas as pd

MAX_POINTS = 2000  # scatter points sent to the browser, to keep the chart fast


def pearson(x: pd.Series, y: pd.Series) -> dict:
    """
    Pearson correlation coefficient
        r = Σ(x - x̄)(y - ȳ) / √(Σ(x - x̄)² · Σ(y - ȳ)²)
    over the rows where both values are present, plus points for a scatter plot.
    """
    pairs = pd.DataFrame({"x": x, "y": y}).dropna()
    if len(pairs) < 2:
        raise ValueError("Need at least two rows with values in both columns.")

    r = float(pairs["x"].corr(pairs["y"]))
    if math.isnan(r):
        r = None  # one column is constant, so correlation is undefined

    sample = pairs.sample(n=MAX_POINTS, random_state=0) if len(pairs) > MAX_POINTS else pairs
    return {
        "pearson_r": r,
        "pair_count": int(len(pairs)),
        "points": [{"x": float(px), "y": float(py)} for px, py in zip(sample["x"], sample["y"])],
    }
