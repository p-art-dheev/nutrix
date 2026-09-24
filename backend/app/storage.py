"""
Where uploaded datasets live between requests.

On Vercel, every request can be handled by a different server instance, so
nothing can be kept in memory. Instead, each upload is saved as a CSV file
under a random dataset ID, and the browser sends that ID with every request:

  - on Vercel (BLOB_READ_WRITE_TOKEN is set): in a private Vercel Blob store
  - locally: in backend/.datasets/
"""

import io
import os
import re
import uuid
from functools import lru_cache
from pathlib import Path
from typing import Optional

import pandas as pd
from fastapi import HTTPException, Query

LOCAL_DIR = Path(__file__).resolve().parent.parent / ".datasets"
DATASET_ID = re.compile(r"^[0-9a-f]{32}$")


class DatasetNotFound(Exception):
    pass


def _use_blob() -> bool:
    return bool(os.environ.get("BLOB_READ_WRITE_TOKEN"))


def _blob_path(dataset_id: str) -> str:
    return f"datasets/{dataset_id}.csv"


def save_dataset(df: pd.DataFrame) -> str:
    """Store the dataset and return its new ID."""
    dataset_id = uuid.uuid4().hex
    data = df.to_csv(index=False).encode("utf-8")

    if _use_blob():
        from vercel.blob import put
        put(_blob_path(dataset_id), data, access="private", content_type="text/csv")
    else:
        LOCAL_DIR.mkdir(exist_ok=True)
        (LOCAL_DIR / f"{dataset_id}.csv").write_bytes(data)

    return dataset_id


@lru_cache(maxsize=4)  # a warm server instance skips re-downloading recent datasets
def load_dataset(dataset_id: str) -> pd.DataFrame:
    """Load a stored dataset. The returned DataFrame is shared: do not modify it."""
    if not DATASET_ID.match(dataset_id):
        raise DatasetNotFound

    if _use_blob():
        from vercel.blob import BlobNotFoundError, get
        try:
            data = get(_blob_path(dataset_id), access="private").content
        except BlobNotFoundError as exc:
            raise DatasetNotFound from exc
    else:
        path = LOCAL_DIR / f"{dataset_id}.csv"
        if not path.exists():
            raise DatasetNotFound
        data = path.read_bytes()

    return pd.read_csv(io.BytesIO(data))


def current_dataset(dataset_id: Optional[str] = Query(None, alias="datasetId")) -> pd.DataFrame:
    """FastAPI dependency: the dataset named by the ?datasetId= query parameter."""
    if not dataset_id:
        raise HTTPException(status_code=400, detail="No dataset loaded. Please upload a dataset first.")
    try:
        return load_dataset(dataset_id)
    except DatasetNotFound:
        raise HTTPException(status_code=404, detail="Dataset not found. Please upload it again.")
