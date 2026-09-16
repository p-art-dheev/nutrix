"""
Deficiency-Aware Food Selection — Mixed-Integer Linear Programming (MILP)
=========================================================================
Optimization Problem 2

Mathematical Formulation (from slides)
--------------------------------------
Decision Variables
  xᵢ ∈ {0, 1}        — binary: 1 if food i is selected, 0 otherwise
  qᵢ ≥ 0             — quantity of food i (grams)
  yⱼ ∈ [0, 1]        — fraction of deficiency j covered

Objective
  max Z = yⱼ

Subject to
  1. Calorie capacity :  Σ (Cᵢ / 100) · qᵢ  ≤  Cmax
  2. Deficiency coverage :  yⱼ  ≤  Σ (Nᵢⱼ / 100) · qᵢ  /  D
     → rearranged for linearity:  yⱼ · D  ≤  Σ (Nᵢⱼ / 100) · qᵢ
  3. Minimum food variety :  Σ xᵢ  ≥  Vmin
  4. Maximum food variety :  Σ xᵢ  ≤  Vmax
  5. Quantity–selection linking :  qᵢ  ≤  Mᵢ · xᵢ   ∀ i
        where  Mᵢ = 100 · Cmax / Cᵢ   (big-M, max grams before hitting Cmax)
        fallback when Cᵢ = 0 :  Mᵢ = 100 · Cmax  (effectively unconstrained)
  6. Variable restrictions :  xᵢ ∈ {0,1},  qᵢ ≥ 0,  0 ≤ yⱼ ≤ 1

Where
  Cᵢ     = "Caloric Value" column (kcal per 100 g of food i)
  Nᵢⱼ    = nutrient j column (units per 100 g of food i)
  D      = user-supplied required dosage for nutrient j
  Cmax   = user-supplied maximum calorie capacity
  Vmin   = minimum number of distinct foods
  Vmax   = maximum number of distinct foods
"""

from typing import Any, Optional

import pandas as pd
import pulp

from app.data_utils import get_food_name


# ---------------------------------------------------------------------------
# Internal helpers (shared pattern with high_protein.py)
# ---------------------------------------------------------------------------

def _find_column(df: pd.DataFrame, candidates: tuple[str, ...]) -> Optional[str]:
    """Case-insensitive fuzzy column lookup — exact match first, then substring."""
    lookup = {str(col).strip().lower(): col for col in df.columns}
    for name in candidates:
        if name.lower() in lookup:
            return lookup[name.lower()]
    for key, original in lookup.items():
        for name in candidates:
            if name.lower() in key:
                return original
    return None


def _numeric(value: Any) -> float:
    """Coerce a cell value to a non-negative float; NaN / bad values → 0.0."""
    try:
        number = float(value)
    except (TypeError, ValueError):
        return 0.0
    if pd.isna(number):
        return 0.0
    return max(number, 0.0)


def get_available_nutrient_columns(df: pd.DataFrame) -> list[str]:
    """
    Return a sorted list of numeric columns in *df* that could represent
    nutrient concentrations.  Excludes known non-nutrient numeric columns
    (row indices, etc.).
    """
    EXCLUDE = {"unnamed: 0", "id", "index"}
    cols = []
    for col in df.select_dtypes(include="number").columns:
        if col.strip().lower() not in EXCLUDE:
            cols.append(str(col))
    return sorted(cols)


# ---------------------------------------------------------------------------
# Main solver
# ---------------------------------------------------------------------------

def solve_deficiency_coverage(
    df: pd.DataFrame,
    row_ids: list[int],
    nutrient_col: str,
    required_dosage: float,
    calorie_max: float,
    variety_min: int,
    variety_max: int,
    source: str,
) -> dict[str, Any]:
    """
    Solve the Deficiency-Aware Food Selection MILP.

    Parameters
    ----------
    df            : Loaded food dataset (global_df from state).
    row_ids       : Row indices to include (pantry or full dataset).
    nutrient_col  : Exact column name for the deficient nutrient (j).
    required_dosage : D — required amount of nutrient j (same units as dataset).
    calorie_max   : Cmax — maximum total calories.
    variety_min   : Vmin — minimum number of distinct foods selected.
    variety_max   : Vmax — maximum number of distinct foods selected.
    source        : "pantry" or "dataset" (for UI display only).

    Returns
    -------
    dict with keys: status, message, foods, totals, limits, food_count, source.
    """

    # ------------------------------------------------------------------
    # 1. Resolve calorie column (Cᵢ)
    # ------------------------------------------------------------------
    calorie_col = _find_column(df, ("Caloric Value", "Calories", "Calorie", "Energy", "kcal"))
    if calorie_col is None:
        raise ValueError(
            "Dataset is missing a calorie column (expected 'Caloric Value', 'Calories', etc.)."
        )

    # ------------------------------------------------------------------
    # 2. Validate nutrient column (Nᵢⱼ)
    # ------------------------------------------------------------------
    if nutrient_col not in df.columns:
        raise ValueError(
            f"Nutrient column '{nutrient_col}' not found in the dataset. "
            f"Available columns: {list(df.columns)}."
        )
    if not pd.api.types.is_numeric_dtype(df[nutrient_col]):
        raise ValueError(
            f"Column '{nutrient_col}' is not numeric and cannot be used as a nutrient."
        )

    # ------------------------------------------------------------------
    # 3. Build food list from selected rows
    # ------------------------------------------------------------------
    foods: list[dict[str, Any]] = []
    for row_id in row_ids:
        if row_id < 0 or row_id >= len(df):
            continue
        row = df.iloc[row_id]
        calories_per_100g = _numeric(row[calorie_col])
        nutrient_per_100g = _numeric(row[nutrient_col])
        foods.append(
            {
                "id": row_id,
                "name": get_food_name(df, row_id) or f"Food {row_id}",
                "calories": calories_per_100g,   # Cᵢ
                "nutrient": nutrient_per_100g,   # Nᵢⱼ
            }
        )

    if not foods:
        raise ValueError(
            "No foods available. Upload a dataset or add items to the pantry."
        )

    n = len(foods)

    # ------------------------------------------------------------------
    # 4. Validate variety bounds against available foods
    # ------------------------------------------------------------------
    if variety_min > variety_max:
        raise ValueError(
            f"Vmin ({variety_min}) must be ≤ Vmax ({variety_max})."
        )
    if variety_min > n:
        raise ValueError(
            f"Vmin ({variety_min}) exceeds the number of available foods ({n}). "
            "Lower Vmin or add more foods to the pantry."
        )
    if variety_max < 1:
        raise ValueError("Vmax must be at least 1.")

    # ------------------------------------------------------------------
    # 5. Build MILP model
    # ------------------------------------------------------------------
    problem = pulp.LpProblem("DeficiencyCoverage", pulp.LpMaximize)

    # Decision variable xᵢ ∈ {0, 1}
    x = {
        food["id"]: pulp.LpVariable(f"x_{food['id']}", cat=pulp.LpBinary)
        for food in foods
    }

    # Decision variable qᵢ ≥ 0  (grams)
    q = {
        food["id"]: pulp.LpVariable(f"q_{food['id']}", lowBound=0, cat=pulp.LpContinuous)
        for food in foods
    }

    # Decision variable yⱼ ∈ [0, 1]  (deficiency coverage fraction)
    y = pulp.LpVariable("y_j", lowBound=0, upBound=1, cat=pulp.LpContinuous)

    # ------------------------------------------------------------------
    # 6. Objective: max Z = yⱼ
    # ------------------------------------------------------------------
    problem += y, "maximize_deficiency_coverage"

    # ------------------------------------------------------------------
    # 7. Constraint 1 — Calorie capacity: Σ (Cᵢ/100) · qᵢ ≤ Cmax
    # ------------------------------------------------------------------
    problem += (
        pulp.lpSum((food["calories"] / 100.0) * q[food["id"]] for food in foods)
        <= calorie_max,
        "calorie_capacity",
    )

    # ------------------------------------------------------------------
    # 8. Constraint 2 — Deficiency coverage:
    #    yⱼ ≤ Σ (Nᵢⱼ/100) · qᵢ / D
    #    → linearised: yⱼ · D ≤ Σ (Nᵢⱼ/100) · qᵢ
    # ------------------------------------------------------------------
    problem += (
        y * required_dosage
        <= pulp.lpSum((food["nutrient"] / 100.0) * q[food["id"]] for food in foods),
        "deficiency_coverage",
    )

    # ------------------------------------------------------------------
    # 9. Constraint 3 — Minimum food variety: Σ xᵢ ≥ Vmin
    # ------------------------------------------------------------------
    problem += (
        pulp.lpSum(x[food["id"]] for food in foods) >= variety_min,
        "min_variety",
    )

    # ------------------------------------------------------------------
    # 10. Constraint 4 — Maximum food variety: Σ xᵢ ≤ Vmax
    # ------------------------------------------------------------------
    problem += (
        pulp.lpSum(x[food["id"]] for food in foods) <= variety_max,
        "max_variety",
    )

    # ------------------------------------------------------------------
    # 11. Constraint 5 — Quantity–selection linking: qᵢ ≤ Mᵢ · xᵢ  ∀ i
    #     Mᵢ = 100 · Cmax / Cᵢ   (max grams of food i before exhausting Cmax)
    #     Fallback when Cᵢ = 0: Mᵢ = 100 · Cmax (large but finite)
    # ------------------------------------------------------------------
    for food in foods:
        ci = food["calories"]
        if ci > 0:
            mi = 100.0 * calorie_max / ci   # Mᵢ from the slide formula
        else:
            # Zero-calorie food: quantity is only limited by other constraints;
            # use a sufficiently large M (total gram budget = 100 × Cmax).
            mi = 100.0 * calorie_max

        problem += (
            q[food["id"]] <= mi * x[food["id"]],
            f"linking_{food['id']}",
        )

    # ------------------------------------------------------------------
    # 12. Solve
    # ------------------------------------------------------------------
    status_code = problem.solve(pulp.PULP_CBC_CMD(msg=False))
    status_name = pulp.LpStatus[status_code]

    limits = {
        "calorie_max": calorie_max,
        "required_dosage": required_dosage,
        "variety_min": variety_min,
        "variety_max": variety_max,
        "nutrient": nutrient_col,
    }

    # ------------------------------------------------------------------
    # 13. Handle non-optimal outcomes
    # ------------------------------------------------------------------
    if status_name != "Optimal":
        if status_name == "Infeasible":
            message = (
                "No feasible solution exists for these parameters. "
                "Try: increasing Cmax, lowering Vmin, raising Vmax, or "
                "relaxing the required dosage D."
            )
        else:
            message = f"The solver returned status: {status_name}."

        return {
            "status": status_name,
            "message": message,
            "foods": [],
            "totals": {
                "calories": 0.0,
                "nutrient_obtained": 0.0,
                "required_dosage": required_dosage,
                "deficiency_coverage_fraction": 0.0,
                "deficiency_coverage_pct": 0.0,
                "food_count_selected": 0,
            },
            "limits": limits,
            "food_count": n,
            "source": source,
        }

    # ------------------------------------------------------------------
    # 14. Extract solution
    # ------------------------------------------------------------------
    y_val = float(pulp.value(y) or 0.0)
    y_val = max(0.0, min(1.0, y_val))   # clamp numerical noise

    selected = []       # foods with xi=1 AND qi > threshold (non-trivial quantity)
    x_selected_count = 0  # total foods with xi=1 (binary constraint count)
    total_calories = 0.0
    total_nutrient = 0.0

    for food in foods:
        xi_val = float(pulp.value(x[food["id"]]) or 0.0)
        qi_val = float(pulp.value(q[food["id"]]) or 0.0)

        # Count all foods with xi=1 (this is what satisfies Vmin constraint)
        if xi_val >= 0.5:
            x_selected_count += 1

        # Only report foods that have a meaningful non-zero quantity allocated
        if xi_val < 0.5 or qi_val < 1e-4:
            continue

        cal_contrib = (food["calories"] / 100.0) * qi_val
        nut_contrib = (food["nutrient"] / 100.0) * qi_val
        total_calories += cal_contrib
        total_nutrient += nut_contrib

        selected.append(
            {
                "id": food["id"],
                "food": food["name"],
                "selected": True,           # xᵢ = 1
                "quantity": round(qi_val, 2),          # qᵢ (grams)
                "calories": round(cal_contrib, 2),
                "nutrient_obtained": round(nut_contrib, 4),
                "calories_per_100g": food["calories"],
                "nutrient_per_100g": food["nutrient"],
            }
        )

    # Sort by nutrient contribution descending
    selected.sort(key=lambda item: item["nutrient_obtained"], reverse=True)

    nutrient_obtained = (y_val * required_dosage)   # == total_nutrient (within solver tolerance)

    return {
        "status": "Optimal",
        "message": "Optimal deficiency-coverage plan found.",
        "foods": selected,
        "totals": {
            "calories": round(total_calories, 2),
            "nutrient_obtained": round(total_nutrient, 4),
            "required_dosage": required_dosage,
            "deficiency_coverage_fraction": round(y_val, 6),
            "deficiency_coverage_pct": round(y_val * 100.0, 2),
            # x_selected: foods with xi=1 (satisfies variety constraint)
            # foods_with_quantity: foods with xi=1 AND qi>0 (non-zero allocation)
            "food_count_selected": x_selected_count,
            "food_count_with_quantity": len(selected),
        },
        "limits": limits,
        "food_count": n,
        "source": source,
    }
