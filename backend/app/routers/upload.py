import io
from typing import List

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.preprocessing import clean_table, drop_impossible_rows
from app.storage import save_dataset

router = APIRouter()


@router.post("/api/data/upload")
async def upload_data(files: List[UploadFile] = File(...)):
    """
    Read one or more CSV files, merge them, store the result and return its
    dataset ID plus basic statistics. The browser sends the ID with later requests.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    dfs = []
    for file in files:
        if not file.filename.endswith(".csv"):
            raise HTTPException(status_code=400, detail=f"File {file.filename} is not a CSV")
        try:
            content = await file.read()
            dfs.append(pd.read_csv(io.BytesIO(content)))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error reading {file.filename}: {str(e)}")

    if not dfs:
        raise HTTPException(status_code=400, detail="No valid CSV files to process")

    combined_df = pd.concat(dfs, ignore_index=True)
    combined_df, cleaning = clean_table(combined_df)
    if combined_df.empty:
        raise HTTPException(status_code=400, detail="The uploaded files contain no data rows")
    combined_df, rows_removed = drop_impossible_rows(combined_df)
    dataset_id = save_dataset(combined_df)

    return {
        "success": True,
        "dataset_id": dataset_id,
        "files_processed": len(files),
        "food_items": len(combined_df),
        "columns": len(combined_df.columns),
        "rows_removed": rows_removed,  # impossible nutrient values
        **cleaning,  # index columns and all-zero rows dropped
    }
