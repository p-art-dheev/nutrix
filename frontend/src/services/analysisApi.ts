/**
 * Analysis page: descriptive statistics, distribution and correlation.
 */

import type { CorrelationResult, DescriptiveStatistics, DistributionResult } from '../types/analysis';
import { getJson } from './apiClient';

/** Numeric columns that can be analysed. */
export const fetchAnalysisColumns = async (): Promise<string[]> =>
  (await getJson<{ columns: string[] }>('/api/data/columns')).columns;

/** Count, mean, median, std dev, min, Q1, Q3, max of one column. */
export const fetchDescriptiveStats = async (column: string): Promise<DescriptiveStatistics> =>
  (await getJson<{ statistics: DescriptiveStatistics }>(`/api/data/stats/${encodeURIComponent(column)}`)).statistics;

/** Histogram of one column with `bins` equal-width bins. */
export const fetchDistribution = (column: string, bins: number): Promise<DistributionResult> =>
  getJson<DistributionResult>(`/api/data/distribution/${encodeURIComponent(column)}`, { bins });

/** Pearson correlation between two columns, plus scatter points. */
export const fetchCorrelation = (x: string, y: string): Promise<CorrelationResult> =>
  getJson<CorrelationResult>('/api/data/correlation', { x, y });
