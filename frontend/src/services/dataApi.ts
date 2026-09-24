import type { DatasetRowsResponse, PantryResponse } from '../types/dataset';
import type {
  HighProteinInput,
  HighProteinResult,
  DeficiencyCoverageInput,
  DeficiencyCoverageResult,
  OptimizationColumns,
} from '../types/optimization';

const API_BASE = 'http://127.0.0.1:8000';

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

export const fetchDatasetRows = async (offset = 0, limit = 0): Promise<DatasetRowsResponse> => {
  const params = new URLSearchParams({ offset: String(offset), limit: String(limit) });
  const response = await fetch(`${API_BASE}/api/data/rows?${params}`);
  return handleResponse<DatasetRowsResponse>(response);
};

export const fetchPantry = async (): Promise<PantryResponse> => {
  const response = await fetch(`${API_BASE}/api/pantry`);
  return handleResponse<PantryResponse>(response);
};

export const addToPantry = async (rowId: number): Promise<{ count: number }> => {
  const response = await fetch(`${API_BASE}/api/pantry/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ row_id: rowId }),
  });
  return handleResponse(response);
};

export const addBulkToPantry = async (rowIds: number[]): Promise<{ added: number; count: number }> => {
  const response = await fetch(`${API_BASE}/api/pantry/add-bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ row_ids: rowIds }),
  });
  return handleResponse(response);
};

export const removeFromPantry = async (rowId: number): Promise<{ count: number }> => {
  const response = await fetch(`${API_BASE}/api/pantry/remove`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ row_id: rowId }),
  });
  return handleResponse(response);
};

export const runHighProteinOptimization = async (
  input: HighProteinInput,
): Promise<HighProteinResult> => {
  const response = await fetch(`${API_BASE}/api/optimization/high-protein`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse<HighProteinResult>(response);
};

export const clearPantry = async (): Promise<void> => {
  const response = await fetch(`${API_BASE}/api/pantry`, { method: 'DELETE' });
  await handleResponse(response);
};

// ============================================================
// Problem 2 — Deficiency-Aware Food Selection
// ============================================================

/** Numeric columns of the loaded dataset + suggested Calories/Fat/Protein columns. */
export const fetchOptimizationColumns = async (): Promise<OptimizationColumns> => {
  const response = await fetch(`${API_BASE}/api/optimization/columns`);
  return handleResponse<OptimizationColumns>(response);
};

/** Run the Deficiency-Aware Food Selection MILP (Problem 2). */
export const runDeficiencyCoverageOptimization = async (
  input: DeficiencyCoverageInput,
): Promise<DeficiencyCoverageResult> => {
  const response = await fetch(`${API_BASE}/api/optimization/deficiency-coverage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse<DeficiencyCoverageResult>(response);
};
