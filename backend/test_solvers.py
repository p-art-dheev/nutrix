"""
Checks for both optimization models. Run from the backend/ folder:
    python test_solvers.py
(or `pytest test_solvers.py` if pytest is installed)
"""

import os
import sys

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.dirname(__file__))

from app.solvers.common import load_foods, resolve_columns, suggest_column
from app.solvers.deficiency_coverage import solve_deficiency_coverage
from app.solvers.high_protein import solve_high_protein

# Small hand-made dataset (values per 100 g)
DATA = pd.DataFrame({
    "food":          ["Lentils", "Spinach", "Beef Liver", "Tofu", "Broccoli", "Tea"],
    "Caloric Value": [116, 23, 135, 76, 34, 0],
    "Fat":           [0.4, 0.4, 3.6, 4.8, 0.4, 0],
    "Protein":       [9.0, 2.9, 20.0, 8.0, 2.8, 0],
    "Iron":          [3.3, 2.7, 6.2, 2.7, 0.7, 0.1],
})
ALL_ROWS = range(len(DATA))


def foods_for(columns: dict, df: pd.DataFrame = DATA):
    foods, _ = load_foods(df, ALL_ROWS, resolve_columns(df, columns))
    return foods


# ---------------------------------------------------------------------------
# Problem 1 — LP
# ---------------------------------------------------------------------------

def test_lp_respects_every_constraint():
    foods = foods_for({"calories": None, "fat": None, "protein": None})
    r = solve_high_protein(foods, calorie_max=2000, fat_max=70, protein_min=50, quantity_max=1500)
    t = r["totals"]
    assert r["status"] == "Optimal"
    assert t["calories"] <= 2000 + 1e-6
    assert t["fat"] <= 70 + 1e-6
    assert t["protein"] >= 50 - 1e-6
    assert t["quantity"] <= 1500 + 1e-6
    # Beef liver has the best protein per calorie, so it binds on Cmax
    assert r["foods"][0]["food"] == "Beef Liver"


def test_lp_infeasible_is_reported():
    foods = foods_for({"calories": None, "fat": None, "protein": None})
    r = solve_high_protein(foods, calorie_max=100, fat_max=70, protein_min=500, quantity_max=1500)
    assert r["status"] == "Infeasible"
    assert r["foods"] == []


# ---------------------------------------------------------------------------
# Problem 2 — MILP
# ---------------------------------------------------------------------------

def test_milp_every_selected_food_gets_min_portion():
    foods = foods_for({"calories": None, "nutrient": "Iron"})
    r = solve_deficiency_coverage(foods, required_dosage=18, calorie_max=2000,
                                  variety_min=3, variety_max=5, min_portion=20)
    t = r["totals"]
    assert r["status"] == "Optimal"
    assert t["deficiency_coverage_pct"] == 100
    assert 3 <= t["food_count_selected"] <= 5
    assert all(row["quantity"] >= 20 - 1e-6 for row in r["foods"])  # no 0 g "selected" foods
    assert t["calories"] <= 2000 + 1e-6


def test_milp_partial_coverage_when_budget_is_tight():
    # Tea is left out: a 0-kcal food is not limited by Cmax (no Qmax in this model)
    foods = [f for f in foods_for({"calories": None, "nutrient": "Iron"}) if f["calories"] > 0]
    r = solve_deficiency_coverage(foods, required_dosage=18, calorie_max=100,
                                  variety_min=1, variety_max=5, min_portion=10)
    assert r["status"] == "Optimal"
    assert 0 < r["totals"]["deficiency_coverage_fraction"] < 1


def test_milp_bad_variety_bounds():
    foods = foods_for({"calories": None, "nutrient": "Iron"})
    for vmin, vmax in [(4, 2), (10, 10)]:
        try:
            solve_deficiency_coverage(foods, 18, 2000, vmin, vmax, 10)
            assert False, "expected ValueError"
        except ValueError:
            pass


# ---------------------------------------------------------------------------
# Data preparation
# ---------------------------------------------------------------------------

def test_rows_with_missing_values_are_skipped():
    df = DATA.copy()
    df.loc[2, "Caloric Value"] = np.nan  # Beef Liver: unknown calories
    columns = resolve_columns(df, {"calories": None, "fat": None, "protein": None})
    foods, skipped = load_foods(df, ALL_ROWS, columns)
    assert skipped == 1
    assert "Beef Liver" not in [f["name"] for f in foods]


def test_column_suggestion_prefers_total_fat():
    df = pd.DataFrame({"Food": ["A"], "Saturated Fat (g)": [1.0], "Total Fat (g)": [10.0],
                       "Energy (kcal)": [100.0], "Protein_g": [5.0]})
    assert suggest_column(df, "fat") == "Total Fat (g)"
    assert suggest_column(df, "calories") == "Energy (kcal)"
    assert suggest_column(df, "protein") == "Protein_g"


def test_unknown_column_gives_clear_error():
    try:
        resolve_columns(DATA, {"calories": "Kilojoules"})
        assert False, "expected ValueError"
    except ValueError as exc:
        assert "Kilojoules" in str(exc)


if __name__ == "__main__":
    tests = [fn for name, fn in globals().items() if name.startswith("test_")]
    for test in tests:
        test()
        print(f"PASS  {test.__name__}")
    print(f"\nAll {len(tests)} tests passed.")
