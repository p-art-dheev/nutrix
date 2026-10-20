"""
Shared helpers for every optimization problem.

Every problem follows the same three steps:
    1. prepare foods   -> load_foods() turns dataset rows into plain dicts
    2. build the model -> done inside each problem file (PuLP)
    3. read the result -> solve() returns the solver status

Problems only receive plain Python data (a list of food dicts), never the
DataFrame, so a new method can be added without touching the data layer.
"""

from typing import Iterable

import pandas as pd
import pulp

from app.columns import get_food_column


def load_foods(
    df: pd.DataFrame, row_ids: Iterable[int], columns: dict[str, str]
) -> tuple[list[dict], int]:
    """
    Build the food list a problem needs.

    Returns (foods, skipped_count). Each food looks like:
        {"id": 12, "name": "Lentils", "calories": 116.0, "protein": 9.0, ...}
    with one key per role in `columns` (values are per 100 g).

    Rows with a missing, non-numeric or negative value in any required column
    are skipped. Treating them as 0 would be wrong: a food with unknown
    calories would look calorie-free and the solver would pick it without limit.
    """
    food_column = get_food_column(df)
    foods: list[dict] = []
    skipped = 0

    for row_id in row_ids:
        if not 0 <= row_id < len(df):
            continue
        row = df.iloc[row_id]
        values = {role: pd.to_numeric(row[col], errors="coerce") for role, col in columns.items()}

        if any(pd.isna(v) or v < 0 for v in values.values()):
            skipped += 1
            continue

        name = row[food_column]
        foods.append({
            "id": int(row_id),
            "name": str(name) if pd.notna(name) else f"Food {row_id}",
            **{role: float(v) for role, v in values.items()},
        })

    return foods, skipped


def solve(model: pulp.LpProblem) -> str:
    """Solve with the bundled CBC solver and return 'Optimal', 'Infeasible', ..."""
    model.solve(pulp.PULP_CBC_CMD(msg=False))
    return pulp.LpStatus[model.status]


def value(expression) -> float:
    """Numeric value of a PuLP variable/expression after solving (None -> 0)."""
    return float(pulp.value(expression) or 0.0)
