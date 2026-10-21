export type AppView = 'landing' | 'data' | 'analysis' | 'optimize';

export interface UploadData {
  files_processed: number;
  food_items: number;
  columns: number;
  rows_removed?: number; // rows dropped for impossible nutrient values
  // Cleaning done at upload (see backend/app/preprocessing/)
  index_columns_dropped?: number;
  zero_rows_dropped?: number;
  not_per_100g_rows_dropped?: number; // more than 900 kcal or 100 g of macros
}

export type OptimizationProblem = 'high-protein' | 'nutrient-deficiency';
