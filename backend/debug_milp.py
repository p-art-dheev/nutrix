"""Debug script to inspect raw x and q values from the MILP"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "."))

import pandas as pd
import pulp

data = {
    "food":          ["Lentils",  "Spinach", "Beef Liver", "Tofu",   "Broccoli"],
    "Caloric Value": [116.0,       23.0,      135.0,        76.0,     34.0],
    "Iron":          [3.3,         2.7,        6.2,         2.7,      0.7],
}
df = pd.DataFrame(data)
foods = [
    {"id": i, "name": n, "calories": c, "nutrient": nu}
    for i, (n, c, nu) in enumerate(
        zip(data["food"], data["Caloric Value"], data["Iron"])
    )
]

problem = pulp.LpProblem("Test", pulp.LpMaximize)
x = {f["id"]: pulp.LpVariable(f"x_{f['id']}", cat=pulp.LpBinary) for f in foods}
q = {f["id"]: pulp.LpVariable(f"q_{f['id']}", lowBound=0) for f in foods}
y = pulp.LpVariable("y_j", lowBound=0, upBound=1)

problem += y
problem += pulp.lpSum((f["calories"] / 100) * q[f["id"]] for f in foods) <= 2000
problem += y * 18 <= pulp.lpSum((f["nutrient"] / 100) * q[f["id"]] for f in foods)
problem += pulp.lpSum(x[f["id"]] for f in foods) >= 2     # Vmin
problem += pulp.lpSum(x[f["id"]] for f in foods) <= 5     # Vmax
for f in foods:
    mi = 100 * 2000 / f["calories"] if f["calories"] > 0 else 100 * 2000
    problem += q[f["id"]] <= mi * x[f["id"]]

status = problem.solve(pulp.PULP_CBC_CMD(msg=False))
print(f"Status: {pulp.LpStatus[status]}")
print(f"y = {pulp.value(y):.6f}")
print("Foods:")
for f in foods:
    xv = pulp.value(x[f["id"]])
    qv = pulp.value(q[f["id"]])
    print(f"  {f['name']:<12} x={xv:.1f}  q={qv:.2f}")
print(f"Sum(x) = {sum(pulp.value(x[f['id']]) for f in foods):.1f}")
