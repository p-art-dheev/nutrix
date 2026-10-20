/**
 * Optimize page: detected columns, Problem 1 (LP) and Problem 2 (MILP).
 * The pantry kept in the browser is sent with every run.
 */

import type {
  DeficiencyCoverageInput,
  DeficiencyCoverageResult,
  HighProteinInput,
  HighProteinResult,
  OptimizationColumns,
} from '../types/optimization';
import { getJson, postJson } from './apiClient';
import { pantryIds } from './session';

/** Detected Calories/Fat/Protein columns and the vitamin/mineral columns. */
export const fetchOptimizationColumns = (): Promise<OptimizationColumns> =>
  getJson<OptimizationColumns>('/api/optimization/columns');

/** Problem 1 — Optimal Protein Diet (LP). */
export const runHighProteinOptimization = (input: HighProteinInput): Promise<HighProteinResult> =>
  postJson<HighProteinResult>('/api/optimization/high-protein', { ...input, rowIds: pantryIds() });

/** Problem 2 — Deficiency-Aware Food Selection (MILP). */
export const runDeficiencyCoverageOptimization = (
  input: DeficiencyCoverageInput,
): Promise<DeficiencyCoverageResult> =>
  postJson<DeficiencyCoverageResult>('/api/optimization/deficiency-coverage', { ...input, rowIds: pantryIds() });
