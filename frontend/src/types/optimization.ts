export type GoalType = 'Weight Loss' | 'Maintenance' | 'Weight Gain'

export type ActivityLevel =
  | 'Sedentary'
  | 'Light'
  | 'Moderate'
  | 'Active'
  | 'Very Active'

export type OptimizationMethod = 'min-cost' | 'max-nutrition'

export interface NutritionTargets {
  calories: number
  protein: number
  carbohydrates: number
  fat: number
  fiber: number
}

/** Columns returned by GET /api/optimization/columns */
export interface OptimizationColumns {
  numeric_columns: string[]
  suggested: { calories: string | null; fat: string | null; protein: string | null }
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

export interface OptimizationInput {
  age: number
  weightKg: number
  heightCm: number
  goal: GoalType
  activityLevel: ActivityLevel
  dailyBudget: number
  targets: NutritionTargets
}

export interface MealPlanItem {
  food: string
  quantity: string
  calories: number
  protein: number
  carbohydrates: number
  fat: number
  fiber: number
  cost: number
}

export interface MealSection {
  meal: 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner'
  items: MealPlanItem[]
}

export interface OptimizationSummary {
  totalCost: number
  calories: number
  protein: number
  carbohydrates: number
  fat: number
  fiber: number
  nutritionScore: number
}

export interface TargetStatus {
  metric: string
  target: number
  actual: number
  unit: string
  withinRange: boolean
}

export interface OptimizationResult {
  id: string
  method: OptimizationMethod
  status: 'Optimal Solution Found' | 'Feasible Solution Found' | 'Infeasible'
  summary: OptimizationSummary
  targetStatus: TargetStatus[]
  meals: MealSection[]
  generatedAt: string
}

export interface OptimizationHistoryRow {
  id: string
  date: string
  method: string
  calories: number
  protein: number
  cost: number
  status: string
}

export interface OptimizationComparison {
  metric: string
  minimumCost: number
  maximumNutrition: number
  unit: string
}

export interface OptimizationProgressStep {
  label: string
  done: boolean
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
