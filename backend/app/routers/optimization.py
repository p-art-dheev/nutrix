from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import app.state as state
from app.solvers.high_protein import solve_high_protein
from app.solvers.deficiency_coverage import solve_deficiency_coverage, get_available_nutrient_columns

router = APIRouter()


# ============================================================
# Problem 1 — High-Protein Diet (existing, unchanged)
# ============================================================

class HighProteinRequest(BaseModel):
    calorie_max: float = Field(..., gt=0, alias="calorieMax")
    fat_max: float = Field(..., gt=0, alias="fatMax")
    protein_min: float = Field(..., gt=0, alias="proteinMin")
    quantity_max: float = Field(..., gt=0, alias="quantityMax")

    model_config = {"populate_by_name": True}


@router.post("/api/optimization/high-protein")
def run_high_protein(body: HighProteinRequest):
    if state.global_df is None:
        raise HTTPException(status_code=400, detail="No dataset loaded. Please upload a dataset first.")

    df = state.global_df
    used_pantry = bool(state.pantry_ids)
    row_ids = sorted(state.pantry_ids) if used_pantry else list(range(len(df)))

    try:
        return solve_high_protein(
            df=df,
            row_ids=row_ids,
            calorie_max=body.calorie_max,
            fat_max=body.fat_max,
            protein_min=body.protein_min,
            quantity_max=body.quantity_max,
            source="pantry" if used_pantry else "dataset",
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


# ============================================================
# Problem 2 — Deficiency-Aware Food Selection (new MILP)
# ============================================================

@router.get("/api/optimization/nutrients")
def get_nutrient_columns():
    """
    Return the list of numeric nutrient columns available in the loaded dataset.
    The frontend uses this to populate the nutrient dropdown for Problem 2.
    """
    if state.global_df is None:
        raise HTTPException(
            status_code=400,
            detail="No dataset loaded. Please upload a dataset first.",
        )
    columns = get_available_nutrient_columns(state.global_df)
    return {"nutrients": columns}


class DeficiencyCoverageRequest(BaseModel):
    """
    User inputs for the Deficiency-Aware MILP (Problem 2).

    Fields
    ------
    nutrient       : exact column name for the deficient nutrient (j)
    required_dosage: D — required amount of nutrient j (same units as dataset)
    calorie_max    : Cmax — maximum total calorie capacity
    variety_min    : Vmin — minimum number of distinct foods to select
    variety_max    : Vmax — maximum number of distinct foods to select
    """

    nutrient: str = Field(..., alias="nutrient")
    required_dosage: float = Field(..., gt=0, alias="requiredDosage")
    calorie_max: float = Field(..., gt=0, alias="calorieMax")
    variety_min: int = Field(..., ge=1, alias="varietyMin")
    variety_max: int = Field(..., ge=1, alias="varietyMax")

    model_config = {"populate_by_name": True}


@router.post("/api/optimization/deficiency-coverage")
def run_deficiency_coverage(body: DeficiencyCoverageRequest):
    """
    Solve the Deficiency-Aware Food Selection MILP (Problem 2).

    Implements exactly:
      max yⱼ
      s.t.
        Σ (Cᵢ/100)·qᵢ ≤ Cmax                       [calorie capacity]
        yⱼ·D ≤ Σ (Nᵢⱼ/100)·qᵢ                      [deficiency coverage]
        Vmin ≤ Σ xᵢ ≤ Vmax                           [food variety]
        qᵢ ≤ Mᵢ·xᵢ,  Mᵢ = 100·Cmax/Cᵢ              [linking]
        xᵢ ∈ {0,1},  qᵢ ≥ 0,  0 ≤ yⱼ ≤ 1           [variable restrictions]
    """
    if state.global_df is None:
        raise HTTPException(
            status_code=400,
            detail="No dataset loaded. Please upload a dataset first.",
        )

    if body.variety_min > body.variety_max:
        raise HTTPException(
            status_code=422,
            detail=f"varietyMin ({body.variety_min}) must be ≤ varietyMax ({body.variety_max}).",
        )

    df = state.global_df
    used_pantry = bool(state.pantry_ids)
    row_ids = sorted(state.pantry_ids) if used_pantry else list(range(len(df)))

    try:
        return solve_deficiency_coverage(
            df=df,
            row_ids=row_ids,
            nutrient_col=body.nutrient,
            required_dosage=body.required_dosage,
            calorie_max=body.calorie_max,
            variety_min=body.variety_min,
            variety_max=body.variety_max,
            source="pantry" if used_pantry else "dataset",
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
