"""
HTTP layer for the statistical analysis (Analysis page).
The calculations live in app/analysis/.
"""

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException

from app.analysis.correlation import pearson
from app.analysis.descriptive import describe
from app.analysis.distribution import histogram
from app.columns import numeric_columns
from app.storage import current_dataset

router = APIRouter()


def _numeric_column(df: pd.DataFrame, name: str) -> pd.Series:
    """The column `name`, or a 404/400 error if it is missing or not numeric."""
    if name not in df.columns:
        raise HTTPException(status_code=404, detail=f"Column '{name}' not found.")
    if not pd.api.types.is_numeric_dtype(df[name]):
        raise HTTPException(status_code=400, detail=f"Column '{name}' is not numeric.")
    return df[name]


@router.get("/api/data/columns")
def get_columns(df: pd.DataFrame = Depends(current_dataset)):
    """Numeric columns that can be analysed."""
    return {"columns": numeric_columns(df)}


@router.get("/api/data/stats/{column_name}")
def get_stats(column_name: str, df: pd.DataFrame = Depends(current_dataset)):
    """Descriptive statistics of one column."""
    return {"attribute": column_name, "statistics": describe(_numeric_column(df, column_name))}


@router.get("/api/data/distribution/{column_name}")
def get_distribution(column_name: str, bins: int = 5, df: pd.DataFrame = Depends(current_dataset)):
    """Histogram of one column with `bins` equal-width bins."""
    series = _numeric_column(df, column_name)
    try:
        return {"attribute": column_name, **histogram(series, bins)}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/api/data/correlation")
def get_correlation(x: str, y: str, df: pd.DataFrame = Depends(current_dataset)):
    """Pearson correlation between two columns, plus scatter points."""
    x_values, y_values = _numeric_column(df, x), _numeric_column(df, y)
    try:
        return {"x": x, "y": y, **pearson(x_values, y_values)}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
