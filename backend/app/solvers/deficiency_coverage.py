"""
Problem 2 — Deficiency-Aware Food Selection (Mixed-Integer Linear Programming)

Decision variables
    xᵢ ∈ {0, 1}   1 if food i is selected
    qᵢ ≥ 0        grams of food i
    y  ∈ [0, 1]   fraction of the deficiency covered

    max  Z = y
    s.t. Σ (Cᵢ/100)·qᵢ ≤ Cmax                  1. calorie capacity
         y·D ≤ Σ (Nᵢ/100)·qᵢ                   2. deficiency coverage
                                                  (slide: y ≤ Σ(Nᵢ/100)·qᵢ / D, both sides × D)
         Vmin ≤ Σ xᵢ ≤ Vmax                    3. food variety
         qᵢ ≤ Mᵢ·xᵢ,  Mᵢ = 100·Cmax / Cᵢ       4. quantity–selection linking (big-M)
         qᵢ ≥ q_min·xᵢ                         5. minimum portion  (added to the slide model:
                                                  a food counted in Vmin must actually be eaten)
         xᵢ ∈ {0,1},  qᵢ ≥ 0,  0 ≤ y ≤ 1       6. variable restrictions

    Cᵢ = calories of food i per 100 g
    Nᵢ = amount of the deficient nutrient in food i per 100 g
    D  = required dosage of that nutrient (same unit as the dataset column)

Input foods: [{"id", "name", "calories", "nutrient"}, ...]
"""

import pulp

from app.solvers.common import solve, value


def big_m(calories_per_100g: float, calorie_max: float) -> float:
    """
    Mᵢ = most grams of food i that fit in the calorie budget (slide 11).
    A 0-kcal food is never limited by calories, so we fall back to the grams
    a 1 kcal/100 g food could reach (100·Cmax) to keep M finite.
    """
    if calories_per_100g > 0:
        return 100 * calorie_max / calories_per_100g
    return 100 * calorie_max


def solve_deficiency_coverage(
    foods: list[dict],
    required_dosage: float,
    calorie_max: float,
    variety_min: int,
    variety_max: int,
    min_portion: float,
) -> dict:
    if not foods:
        raise ValueError("No usable foods to optimize. Check your pantry or dataset.")
    if variety_min > variety_max:
        raise ValueError(f"Vmin ({variety_min}) must be ≤ Vmax ({variety_max}).")
    if variety_min > len(foods):
        raise ValueError(
            f"Vmin ({variety_min}) is more than the {len(foods)} available foods. "
            "Lower Vmin or add foods to the pantry."
        )

    limits = {
        "calorie_max": calorie_max,
        "required_dosage": required_dosage,
        "variety_min": variety_min,
        "variety_max": variety_max,
        "min_portion": min_portion,
    }

    # ---- Model ------------------------------------------------------------
    model = pulp.LpProblem("DeficiencyCoverage", pulp.LpMaximize)
    x = {f["id"]: pulp.LpVariable(f"x_{f['id']}", cat=pulp.LpBinary) for f in foods}
    q = {f["id"]: pulp.LpVariable(f"q_{f['id']}", lowBound=0) for f in foods}
    y = pulp.LpVariable("y", lowBound=0, upBound=1)

    calories = pulp.lpSum(f["calories"] / 100 * q[f["id"]] for f in foods)
    nutrient = pulp.lpSum(f["nutrient"] / 100 * q[f["id"]] for f in foods)
    foods_selected = pulp.lpSum(x.values())

    model += y                                                          # objective
    model += calories <= calorie_max, "calorie_capacity"                # 1
    model += y * required_dosage <= nutrient, "deficiency_coverage"     # 2
    model += foods_selected >= variety_min, "min_variety"               # 3
    model += foods_selected <= variety_max, "max_variety"               # 3
    for f in foods:
        i = f["id"]
        model += q[i] <= big_m(f["calories"], calorie_max) * x[i], f"link_{i}"   # 4
        model += q[i] >= min_portion * x[i], f"min_portion_{i}"                  # 5

    status = solve(model)

    # ---- Result -----------------------------------------------------------
    if status != "Optimal":
        message = (
            "No selection satisfies these limits. Try raising Cmax, lowering Vmin, "
            "raising Vmax or using a smaller minimum portion."
            if status == "Infeasible"
            else f"The solver returned status: {status}."
        )
        return {
            "status": status,
            "message": message,
            "foods": [],
            "totals": {
                "calories": 0.0,
                "nutrient_obtained": 0.0,
                "required_dosage": required_dosage,
                "deficiency_coverage_fraction": 0.0,
                "deficiency_coverage_pct": 0.0,
                "food_count_selected": 0,
                "food_count_with_quantity": 0,
            },
            "limits": limits,
        }

    rows = []
    for f in foods:
        if value(x[f["id"]]) < 0.5:          # xᵢ = 0 → not selected
            continue
        grams = value(q[f["id"]])
        rows.append({
            "id": f["id"],
            "food": f["name"],
            "selected": True,
            "quantity": round(grams, 2),
            "calories": round(f["calories"] * grams / 100, 2),
            "nutrient_obtained": round(f["nutrient"] * grams / 100, 4),
            "calories_per_100g": f["calories"],
            "nutrient_per_100g": f["nutrient"],
        })
    rows.sort(key=lambda row: row["nutrient_obtained"], reverse=True)

    coverage = min(max(value(y), 0.0), 1.0)  # clamp tiny solver noise
    return {
        "status": "Optimal",
        "message": "Optimal deficiency-coverage plan found.",
        "foods": rows,
        "totals": {
            "calories": round(value(calories), 2),
            "nutrient_obtained": round(value(nutrient), 4),
            "required_dosage": required_dosage,
            "deficiency_coverage_fraction": round(coverage, 6),
            "deficiency_coverage_pct": round(coverage * 100, 2),
            "food_count_selected": len(rows),
            "food_count_with_quantity": sum(1 for row in rows if row["quantity"] > 0),
        },
        "limits": limits,
    }
