# Graph Report - c:\Users\PARDHEEV\B Tech\7th Sem\Projects\OR\nutrition-based-meal-optimization\backend  (2026-09-18)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 81 nodes · 137 edges · 11 communities (9 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bd1cfbf5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8

## God Nodes (most connected - your core abstractions)
1. `get_food_name()` - 11 edges
2. `solve_deficiency_coverage()` - 10 edges
3. `solve_high_protein()` - 8 edges
4. `get_food_column()` - 7 edges
5. `row_to_dict()` - 6 edges
6. `get_rows()` - 6 edges
7. `_require_dataset()` - 6 edges
8. `add_to_pantry()` - 6 edges
9. `run_deficiency_coverage()` - 5 edges
10. `get_pantry()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `add_to_pantry()` --calls--> `get_food_name()`  [EXTRACTED]
  app/routers/pantry.py → app/data_utils.py
- `solve_deficiency_coverage()` --calls--> `get_food_name()`  [EXTRACTED]
  app/solvers/deficiency_coverage.py → app/data_utils.py
- `solve_high_protein()` --calls--> `get_food_name()`  [EXTRACTED]
  app/solvers/high_protein.py → app/data_utils.py
- `get_nutrient_columns()` --calls--> `get_available_nutrient_columns()`  [EXTRACTED]
  app/routers/optimization.py → app/solvers/deficiency_coverage.py
- `run_deficiency_coverage()` --calls--> `solve_deficiency_coverage()`  [EXTRACTED]
  app/routers/optimization.py → app/solvers/deficiency_coverage.py

## Import Cycles
- None detected.

## Communities (11 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.23
Nodes (13): DeficiencyCoverageRequest, HighProteinRequest, BaseModel, post, User inputs for the Deficiency-Aware MILP (Problem 2).      Fields     ------, Solve the Deficiency-Aware Food Selection MILP (Problem 2).      Implements exac, run_deficiency_coverage(), run_high_protein() (+5 more)

### Community 1 - "Community 1"
Cohesion: 0.27
Nodes (12): get_food_column(), get_food_name(), Any, DataFrame, row_to_dict(), serialize_value(), get_rows(), get (+4 more)

### Community 2 - "Community 2"
Cohesion: 0.21
Nodes (12): _find_column(), get_available_nutrient_columns(), _numeric(), Any, DataFrame, Deficiency-Aware Food Selection — Mixed-Integer Linear Programming (MILP) ======, Solve the Deficiency-Aware Food Selection MILP.      Parameters     ----------, Case-insensitive fuzzy column lookup — exact match first, then substring. (+4 more)

### Community 3 - "Community 3"
Cohesion: 0.40
Nodes (10): add_bulk_to_pantry(), add_to_pantry(), get_pantry_count(), PantryBulkRequest, PantryRowRequest, BaseModel, post, remove_from_pantry() (+2 more)

### Community 4 - "Community 4"
Cohesion: 0.25
Nodes (7): clear_pantry(), post, Endpoint to receive CSV files, process them with Pandas,     and return basic st, upload_data(), reset_pantry(), delete, UploadFile

### Community 5 - "Community 5"
Cohesion: 0.32
Nodes (7): get_columns(), get_distribution(), get_stats(), get, Returns a list of numerical columns available for descriptive statistics., Returns descriptive statistics for a specific column., Returns histogram data and basic stats for a specific column's distribution.

### Community 7 - "Community 7"
Cohesion: 0.67
Nodes (3): get_nutrient_columns(), get, Return the list of numeric nutrient columns available in the loaded dataset.

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_food_name()` connect `Community 1` to `Community 0`, `Community 2`, `Community 3`?**
  _High betweenness centrality (0.172) - this node is a cross-community bridge._
- **Why does `solve_deficiency_coverage()` connect `Community 2` to `Community 0`, `Community 1`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **Why does `solve_high_protein()` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._