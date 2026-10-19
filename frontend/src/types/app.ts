export type AppView = 'landing' | 'data' | 'analysis' | 'optimize';

export interface UploadData {
  files_processed: number;
  food_items: number;
  columns: number;
  rows_removed?: number; // rows dropped for impossible nutrient values
}

export type OptimizationProblem = 'high-protein' | 'nutrient-deficiency';
