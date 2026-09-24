import type { DatasetRow, DatasetRowsResponse } from '../types/dataset';
import type { UploadData } from '../types/app';
import type {
  HighProteinInput,
  HighProteinResult,
  DeficiencyCoverageInput,
  DeficiencyCoverageResult,
  OptimizationColumns,
} from '../types/optimization';
import {
  addPantryIds,
  clearPantryIds,
  getDatasetId,
  isInPantry,
  pantryIds,
  removePantryId,
  setDatasetId,
} from './session';

// Empty = same origin: '/api/...' is served by Vercel in production and proxied
// to the local FastAPI server by Vite in development (see vite.config.ts).
const API_BASE = import.meta.env.VITE_API_BASE ?? '';

/** Build an API URL that includes the current dataset ID (and any extra params). */
export const apiUrl = (path: string, params: Record<string, string | number> = {}): string => {
  const query = new URLSearchParams();
  const datasetId = getDatasetId();
  if (datasetId) query.set('datasetId', datasetId);
  Object.entries(params).forEach(([key, value]) => query.set(key, String(value)));
  const qs = query.toString();
  return `${API_BASE}${path}${qs ? `?${qs}` : ''}`;
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Request failed' }));
    const detail = err.detail;
    const message = Array.isArray(detail)
      ? detail.map((item: { msg?: string }) => item.msg || JSON.stringify(item)).join(', ')
      : detail || 'Request failed';
    throw new Error(message);
  }
  return response.json();
}

const postJson = async <T>(path: string, body: unknown): Promise<T> => {
  const response = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
};

// ============================================================
// Dataset
// ============================================================

/** Upload CSV files; remembers the returned dataset ID for later requests. */
export const uploadDataset = async (files: File[]): Promise<UploadData> => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const response = await fetch(`${API_BASE}/api/data/upload`, { method: 'POST', body: formData });
  const data = await handleResponse<UploadData & { dataset_id: string }>(response);
  setDatasetId(data.dataset_id);
  return data;
};

export const fetchDatasetRows = async (offset = 0, limit = 0): Promise<DatasetRowsResponse> => {
  const response = await fetch(apiUrl('/api/data/rows', { offset, limit }));
  const data = await handleResponse<Omit<DatasetRowsResponse, 'rows'> & { rows: Omit<DatasetRow, 'in_pantry'>[] }>(response);
  return { ...data, rows: data.rows.map((row) => ({ ...row, in_pantry: isInPantry(row.id) })) };
};

// ============================================================
// Pantry (kept in the browser, sent with each optimization)
// ============================================================

export const addToPantry = async (rowId: number): Promise<{ count: number }> => {
  addPantryIds([rowId]);
  return { count: pantryIds().length };
};

export const addBulkToPantry = async (rowIds: number[]): Promise<{ added: number; count: number }> => {
  addPantryIds(rowIds);
  return { added: rowIds.length, count: pantryIds().length };
};

export const removeFromPantry = async (rowId: number): Promise<{ count: number }> => {
  removePantryId(rowId);
  return { count: pantryIds().length };
};

export const clearPantry = async (): Promise<void> => {
  clearPantryIds();
};

// ============================================================
// Optimization
// ============================================================

/** Numeric columns of the loaded dataset + suggested Calories/Fat/Protein columns. */
export const fetchOptimizationColumns = async (): Promise<OptimizationColumns> => {
  const response = await fetch(apiUrl('/api/optimization/columns'));
  return handleResponse<OptimizationColumns>(response);
};

/** Problem 1 — Optimal Protein Diet (LP). */
export const runHighProteinOptimization = (input: HighProteinInput): Promise<HighProteinResult> =>
  postJson<HighProteinResult>('/api/optimization/high-protein', { ...input, rowIds: pantryIds() });

/** Problem 2 — Deficiency-Aware Food Selection (MILP). */
export const runDeficiencyCoverageOptimization = (
  input: DeficiencyCoverageInput,
): Promise<DeficiencyCoverageResult> =>
  postJson<DeficiencyCoverageResult>('/api/optimization/deficiency-coverage', { ...input, rowIds: pantryIds() });
