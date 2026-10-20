"""
HTTP layer for uploading a dataset.
The cleaning steps live in app/preprocessing/.
"""

import io
from typing import List

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.preprocessing import preprocess
from app.storage import save_dataset

router = APIRouter()


@router.post("/api/data/upload")
async def upload_data(files: List[UploadFile] = File(...)):
    """
    Read one or more CSV files, merge them, preprocess and store the result, and
    return its dataset ID plus basic statistics. The browser sends the ID with later requests.
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

    try:
        df, removed = preprocess(pd.concat(dfs, ignore_index=True))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    dataset_id = save_dataset(df)

    return {
        "success": True,
        "dataset_id": dataset_id,
        "files_processed": len(files),
        "food_items": len(df),
        "columns": len(df.columns),
        **removed,  # index columns, all-zero rows and impossible rows removed
    }
