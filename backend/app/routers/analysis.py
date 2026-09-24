from fastapi import APIRouter, Depends, HTTPException
import pandas as pd
import numpy as np
import math

from app.storage import current_dataset

router = APIRouter()

@router.get("/api/data/columns")
def get_columns(df: pd.DataFrame = Depends(current_dataset)):
    """
    Returns a list of numerical columns available for descriptive statistics.
    """
    
    # Filter for numeric columns only, and exclude generic ones like 'Unnamed: 0' if possible
    numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
    # Optional: exclude common index/id columns if they exist
    numeric_cols = [c for c in numeric_cols if c not in ['Unnamed: 0', 'id', 'ID']]
    
    return {"columns": numeric_cols}

@router.get("/api/data/stats/{column_name}")
def get_stats(column_name: str, df: pd.DataFrame = Depends(current_dataset)):
    """
    Returns descriptive statistics for a specific column.
    """
        
    if column_name not in df.columns:
        raise HTTPException(status_code=404, detail=f"Column '{column_name}' not found.")
        
    # Check if the column is numeric
    if not pd.api.types.is_numeric_dtype(df[column_name]):
        raise HTTPException(status_code=400, detail=f"Column '{column_name}' is not numeric.")
        
    series = df[column_name].dropna() # Drop NaNs for accurate stats
    
    stats = {
        "count": int(series.count()),
        "mean": float(series.mean()),
        "median": float(series.median()),
        "std": float(series.std()),
        "min": float(series.min()),
        "q1": float(series.quantile(0.25)),
        "q3": float(series.quantile(0.75)),
        "max": float(series.max())
    }
    
    # Handle NaN values resulting from operations on empty/invalid series
    for k, v in stats.items():
        if math.isnan(v) or math.isinf(v):
            stats[k] = None
            
    return {"attribute": column_name, "statistics": stats}

@router.get("/api/data/distribution/{column_name}")
def get_distribution(column_name: str, bins: int = 5, df: pd.DataFrame = Depends(current_dataset)):
    """
    Returns histogram data and basic stats for a specific column's distribution.
    """
        
    if column_name not in df.columns:
        raise HTTPException(status_code=404, detail=f"Column '{column_name}' not found.")
        
    # Check if the column is numeric
    if not pd.api.types.is_numeric_dtype(df[column_name]):
        raise HTTPException(status_code=400, detail=f"Column '{column_name}' is not numeric.")
        
    series = df[column_name].dropna() # Drop NaNs
    
    if series.empty:
        raise HTTPException(status_code=400, detail="Column contains no valid data.")

    # Calculate statistics
    mean_val = float(series.mean())
    median_val = float(series.median())
    std_val = float(series.std())

    # Calculate histogram
    counts, bin_edges = np.histogram(series, bins=bins)
    
    # Format for frontend charting library
    distribution_data = []
    for i in range(len(counts)):
        lower = float(bin_edges[i])
        upper = float(bin_edges[i+1])
        
        # Round intelligently based on magnitude
        if upper > 1000:
            range_label = f"{int(lower)} - {int(upper)}"
        elif upper > 10:
            range_label = f"{lower:.1f} - {upper:.1f}"
        else:
            range_label = f"{lower:.2f} - {upper:.2f}"
            
        distribution_data.append({
            "range": range_label,
            "count": int(counts[i])
        })
        
    return {
        "attribute": column_name,
        "statistics": {
            "mean": mean_val if not math.isnan(mean_val) else None,
            "median": median_val if not math.isnan(median_val) else None,
            "std": std_val if not math.isnan(std_val) else None
        },
        "distribution": distribution_data
    }
