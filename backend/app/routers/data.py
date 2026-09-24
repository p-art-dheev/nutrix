import pandas as pd
from fastapi import APIRouter, Depends, Query

from app.data_utils import get_food_column, row_to_dict
from app.storage import current_dataset

router = APIRouter()


@router.get("/api/data/rows")
def get_rows(
    offset: int = Query(0, ge=0),
    limit: int = Query(0, ge=0),
    df: pd.DataFrame = Depends(current_dataset),
):
    """
    Return dataset rows with all columns. limit=0 returns all rows from offset.
    """
    food_column = get_food_column(df)
    columns = [str(col) for col in df.columns]
    total = len(df)

    if limit == 0:
        slice_df = df.iloc[offset:]
    else:
        slice_df = df.iloc[offset : offset + limit]

    rows = []
    for idx in slice_df.index:
        row_id = int(idx)
        row_data = row_to_dict(df, row_id, columns)
        rows.append(
            {
                "id": row_id,
                "values": row_data,
            }
        )

    return {
        "columns": columns,
        "food_column": food_column,
        "total": total,
        "offset": offset,
        "limit": limit if limit > 0 else total - offset,
        "rows": rows,
    }
