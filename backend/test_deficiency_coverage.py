"""
Quick smoke-test for the deficiency_coverage MILP solver.
Run from the backend/ directory:
    cd backend
    venv/Scripts/python test_deficiency_coverage.py
"""
import sys
import os
# Fix Windows console encoding
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "."))

import pandas as pd
from app.solvers.deficiency_coverage import solve_deficiency_coverage

# ─── Minimal hand-crafted dataset ───────────────────────────────────────────
# 5 foods with known Iron (Nij) and Caloric Value (Ci) per 100g.
# Optimal solution can be computed by hand for validation.
data = {
    "food":          ["Lentils",  "Spinach", "Beef Liver", "Tofu",   "Broccoli"],
    "Caloric Value": [116.0,       23.0,      135.0,        76.0,     34.0],
    "Iron":          [3.3,         2.7,        6.2,         2.7,      0.7],
}
df = pd.DataFrame(data)
row_ids = list(range(len(df)))

# ─── Test 1: Normal feasible case ────────────────────────────────────────────
print("=" * 60)
print("TEST 1: Normal feasible (D=18, Cmax=2000, Vmin=2, Vmax=5)")
print("=" * 60)
result = solve_deficiency_coverage(
    df=df,
    row_ids=row_ids,
    nutrient_col="Iron",
    required_dosage=18.0,
    calorie_max=2000.0,
    variety_min=2,
    variety_max=5,
    source="dataset",
)
print(f"Status     : {result['status']}")
print(f"Coverage   : {result['totals']['deficiency_coverage_pct']:.2f}%  (yj = {result['totals']['deficiency_coverage_fraction']:.4f})")
print(f"Calories   : {result['totals']['calories']:.2f} kcal  (<= 2000)")
print(f"Iron got   : {result['totals']['nutrient_obtained']:.4f}  (D = 18)")
print(f"Foods selected ({result['totals']['food_count_selected']}):")
for f in result["foods"]:
    print(f"  xi=1  qi={f['quantity']:7.2f} g  | {f['food']:<15} | Iron: {f['nutrient_obtained']:.3f}")

# Verify variety constraint: food_count_selected counts foods with xi=1
# (This is what the Vmin/Vmax constraints act on — the binary variables)
n_selected = result["totals"]["food_count_selected"]
assert 2 <= n_selected <= 5, f"Variety constraint violated: {n_selected} foods have xi=1 (expected 2-5)"

# The solver may give qi=0 to some selected foods (xi=1 but qi=0 is allowed by the formulation)
n_with_qty = result["totals"]["food_count_with_quantity"]
print(f"  Foods with xi=1: {n_selected}  |  Foods with qi>0: {n_with_qty}")



# Verify calorie constraint
assert result["totals"]["calories"] <= 2000 + 1e-3, \
    f"Calorie constraint violated: {result['totals']['calories']} > 2000"

# Verify deficiency coverage constraint: yj*D <= iron_obtained  (i.e. yj <= iron/D)
# When iron_obtained >> D, solver caps yj at 1.0 (upBound=1), so we check yj*D <= iron_obtained
iron_obtained = result["totals"]["nutrient_obtained"]
yj = result["totals"]["deficiency_coverage_fraction"]
assert yj * 18.0 <= iron_obtained + 1e-3, \
    f"Coverage constraint violated: yj*D={yj*18:.4f} > iron_obtained={iron_obtained:.4f}"
assert 0.0 <= yj <= 1.0 + 1e-6, f"yj out of [0,1]: {yj}"

print("\n✓ All constraints verified.\n")

# ─── Test 2: Infeasibility (Vmin > number of foods) ─────────────────────────
print("=" * 60)
print("TEST 2: Infeasible -- Vmin=100 with only 5 foods")
print("=" * 60)
try:
    result2 = solve_deficiency_coverage(
        df=df,
        row_ids=row_ids,
        nutrient_col="Iron",
        required_dosage=18.0,
        calorie_max=2000.0,
        variety_min=100,
        variety_max=200,
        source="dataset",
    )
    print(f"ERROR: Should have raised ValueError, got: {result2}")
except ValueError as e:
    print(f"  Correctly raised ValueError: {e}")
    print("\n[OK] All tests passed!")
