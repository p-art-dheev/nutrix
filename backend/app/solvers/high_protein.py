"""
Problem 1 — Optimal Protein Diet (Linear Programming)

    max  Z = Σ (Pᵢ/100)·xᵢ                      total protein
    s.t. Σ (Cᵢ/100)·xᵢ ≤ Cmax                   1. maximum calories
         Σ (Fᵢ/100)·xᵢ ≤ Fmax                   2. maximum fat
         Σ (Pᵢ/100)·xᵢ ≥ Pmin                   3. minimum protein
         Σ xᵢ          ≤ Qmax                   4. maximum total food quantity
         xᵢ ≥ 0                                 5. non-negativity

    xᵢ         = grams of food i
    Cᵢ, Fᵢ, Pᵢ = calories, fat, protein of food i per 100 g

Input foods: [{"id", "name", "calories", "fat", "protein"}, ...]
"""

import pulp

from app.solvers.common import solve, value

MIN_REPORTED_GRAMS = 0.05  # hide foods the solver gave (almost) nothing


def solve_high_protein(
    foods: list[dict],
    calorie_max: float,
    fat_max: float,
    protein_min: float,
    quantity_max: float,
) -> dict:
    if not foods:
        raise ValueError("No usable foods to optimize. Check your pantry or dataset.")

    limits = {
        "calorie_max": calorie_max,
        "fat_max": fat_max,
        "protein_min": protein_min,
        "quantity_max": quantity_max,
    }

    # ---- Model ------------------------------------------------------------
    model = pulp.LpProblem("OptimalProteinDiet", pulp.LpMaximize)
    x = {f["id"]: pulp.LpVariable(f"x_{f['id']}", lowBound=0) for f in foods}  # xᵢ ≥ 0

    def total(nutrient: str):
        """Σ (Nᵢ/100)·xᵢ — amount of `nutrient` in the whole diet."""
        return pulp.lpSum(f[nutrient] / 100 * x[f["id"]] for f in foods)

    model += total("protein")                                      # objective
    model += total("calories") <= calorie_max, "max_calories"      # 1
    model += total("fat") <= fat_max, "max_fat"                    # 2
    model += total("protein") >= protein_min, "min_protein"        # 3
    model += pulp.lpSum(x.values()) <= quantity_max, "max_quantity"  # 4

    status = solve(model)

    # ---- Result -----------------------------------------------------------
    if status != "Optimal":
        message = (
            "No diet satisfies these limits. Try raising Cmax, Fmax or Qmax, or lowering Pmin."
            if status == "Infeasible"
            else f"The solver returned status: {status}."
        )
        return {
            "status": status,
            "message": message,
            "foods": [],
            "totals": {"calories": 0, "protein": 0, "fat": 0, "quantity": 0, "objective_protein": 0},
            "limits": limits,
        }

    rows = []
    for f in foods:
        grams = value(x[f["id"]])
        if grams < MIN_REPORTED_GRAMS:
            continue
        rows.append({
            "id": f["id"],
            "food": f["name"],
            "quantity": round(grams, 2),
            "calories": round(f["calories"] * grams / 100, 2),
            "protein": round(f["protein"] * grams / 100, 2),
            "fat": round(f["fat"] * grams / 100, 2),
            "calories_per_100g": f["calories"],
            "protein_per_100g": f["protein"],
            "fat_per_100g": f["fat"],
        })
    rows.sort(key=lambda row: row["protein"], reverse=True)

    return {
        "status": "Optimal",
        "message": "Optimal high-protein diet found.",
        "foods": rows,
        "totals": {
            "calories": round(value(total("calories")), 2),
            "protein": round(value(total("protein")), 2),
            "fat": round(value(total("fat")), 2),
            "quantity": round(value(pulp.lpSum(x.values())), 2),
            "objective_protein": round(value(model.objective), 2),
        },
        "limits": limits,
    }
