/** Columns returned by GET /api/optimization/columns */
export interface OptimizationColumns {
  numeric_columns: string[]
  suggested: { calories: string | null; fat: string | null; protein: string | null }
  nutrient_columns: string[]  // vitamin and mineral columns (Problem 2 choices)
}

export interface HighProteinLimits {
  calorieMax: number
  fatMax: number
  proteinMin: number
  quantityMax: number
}

export interface HighProteinInput extends HighProteinLimits {
  caloriesColumn: string
  fatColumn: string
  proteinColumn: string
}

export interface HighProteinFoodResult {
  id: number
  food: string
  quantity: number
  calories: number
  protein: number
  fat: number
}

export interface HighProteinResult {
  status: string
  message: string
  foods: HighProteinFoodResult[]
  totals: {
    calories: number
    protein: number
    fat: number
    quantity: number
    objective_protein: number
  }
  limits: {
    calorie_max: number
    fat_max: number
    protein_min: number
    quantity_max: number
  }
  food_count: number
  skipped_count: number     // rows ignored because of missing/invalid values
  source: 'dataset' | 'pantry'
}

// ============================================================
// Problem 2 — Deficiency-Aware Food Selection (MILP)
// ============================================================

export interface DeficiencyCoverageInput {
  nutrient: string          // exact column name (j)
  requiredDosage: number    // D — required amount in dataset units
  calorieMax: number        // Cmax — maximum total calories
  varietyMin: number        // Vmin — minimum distinct foods
  varietyMax: number        // Vmax — maximum distinct foods
  minPortion: number        // q_min — grams every selected food must get
  caloriesColumn: string    // column holding Cᵢ
}

export interface DeficiencyCoverageFoodItem {
  id: number
  food: string
  selected: boolean         // xᵢ = 1
  quantity: number          // qᵢ in grams
  calories: number          // total calories from this food
  nutrient_obtained: number // Nᵢⱼ/100 × qᵢ
  calories_per_100g: number // Cᵢ
  nutrient_per_100g: number // Nᵢⱼ
}

export interface DeficiencyCoverageResult {
  status: string
  message: string
  foods: DeficiencyCoverageFoodItem[]
  totals: {
    calories: number
    nutrient_obtained: number
    required_dosage: number
    deficiency_coverage_fraction: number  // yⱼ ∈ [0,1]
    deficiency_coverage_pct: number       // yⱼ × 100
    food_count_selected: number           // foods with xᵢ = 1 (satisfies Vmin)
    food_count_with_quantity: number      // foods with xᵢ = 1 AND qᵢ > 0
  }
  limits: {
    calorie_max: number
    required_dosage: number
    variety_min: number
    variety_max: number
    min_portion: number
    nutrient: string
  }
  food_count: number
  skipped_count: number
  source: 'dataset' | 'pantry'
}
