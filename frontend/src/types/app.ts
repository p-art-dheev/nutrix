export type AppView = 'landing' | 'data' | 'analysis' | 'optimize';

export interface UploadData {
  files_processed: number;
  food_items: number;
  columns: number;
  rows_removed?: number; // rows dropped for impossible nutrient values
  // General cleaning done at upload (see backend/app/preprocessing.py)
  index_columns_dropped?: number;
  zero_rows_dropped?: number;
}

export type OptimizationProblem = 'high-protein' | 'nutrient-deficiency';
