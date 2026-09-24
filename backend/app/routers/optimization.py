"""
HTTP layer for the optimization methods.

The router only does three things:
    1. read the request and the user's column mapping
    2. turn dataset rows into a food list (common.load_foods)
    3. call the solver and add dataset info to its result
All optimization logic lives in app/solvers/.
"""

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

import app.state as state
from app.solvers.common import COLUMN_HINTS, load_foods, numeric_columns, resolve_columns, suggest_column
from app.solvers.deficiency_coverage import solve_deficiency_coverage
from app.solvers.high_protein import solve_high_protein

router = APIRouter()


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _require_dataset():
    if state.global_df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded. Please upload a dataset first.")
    return state.global_df


def _run(solver, column_mapping: dict[str, Optional[str]], **params) -> dict:
    """Load foods for the mapped columns, run `solver`, and attach dataset info."""
    df = _require_dataset()
    use_pantry = bool(state.pantry_ids)
    row_ids = sorted(state.pantry_ids) if use_pantry else range(len(df))

    try:
        columns = resolve_columns(df, column_mapping)
        foods, skipped = load_foods(df, row_ids, columns)
        result = solver(foods, **params)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    result["food_count"] = len(foods)
    result["skipped_count"] = skipped  # rows ignored because of missing/invalid values
    result["source"] = "pantry" if use_pantry else "dataset"
    result["columns"] = columns
    return result


# ---------------------------------------------------------------------------
# Column mapping
# ---------------------------------------------------------------------------

@router.get("/api/optimization/columns")
def get_columns():
    """Numeric columns the user can map, plus our best guess for each role."""
    df = _require_dataset()
    return {
        "numeric_columns": numeric_columns(df),
        "suggested": {role: suggest_column(df, role) for role in COLUMN_HINTS},
    }


# ---------------------------------------------------------------------------
# Problem 1 — Optimal Protein Diet (LP)
# ---------------------------------------------------------------------------

class HighProteinRequest(BaseModel):
    calorie_max: float = Field(..., gt=0, alias="calorieMax")
    fat_max: float = Field(..., gt=0, alias="fatMax")
    protein_min: float = Field(..., gt=0, alias="proteinMin")
    quantity_max: float = Field(..., gt=0, alias="quantityMax")
    # Column mapping (None → use the suggested column)
    calories_column: Optional[str] = Field(None, alias="caloriesColumn")
    fat_column: Optional[str] = Field(None, alias="fatColumn")
    protein_column: Optional[str] = Field(None, alias="proteinColumn")

    model_config = {"populate_by_name": True}


@router.post("/api/optimization/high-protein")
def run_high_protein(body: HighProteinRequest):
    return _run(
        solve_high_protein,
        column_mapping={
            "calories": body.calories_column,
            "fat": body.fat_column,
            "protein": body.protein_column,
        },
        calorie_max=body.calorie_max,
        fat_max=body.fat_max,
        protein_min=body.protein_min,
        quantity_max=body.quantity_max,
    )


# ---------------------------------------------------------------------------
# Problem 2 — Deficiency-Aware Food Selection (MILP)
# ---------------------------------------------------------------------------

class DeficiencyCoverageRequest(BaseModel):
    nutrient: str                                                    # column of nutrient j
    required_dosage: float = Field(..., gt=0, alias="requiredDosage")    # D
    calorie_max: float = Field(..., gt=0, alias="calorieMax")            # Cmax
    variety_min: int = Field(..., ge=1, alias="varietyMin")              # Vmin
    variety_max: int = Field(..., ge=1, alias="varietyMax")              # Vmax
    min_portion: float = Field(10, ge=0, alias="minPortion")             # q_min (grams)
    calories_column: Optional[str] = Field(None, alias="caloriesColumn")

    model_config = {"populate_by_name": True}


@router.post("/api/optimization/deficiency-coverage")
def run_deficiency_coverage(body: DeficiencyCoverageRequest):
    result = _run(
        solve_deficiency_coverage,
        column_mapping={"calories": body.calories_column, "nutrient": body.nutrient},
        required_dosage=body.required_dosage,
        calorie_max=body.calorie_max,
        variety_min=body.variety_min,
        variety_max=body.variety_max,
        min_portion=body.min_portion,
    )
    result["limits"]["nutrient"] = body.nutrient
    return result
