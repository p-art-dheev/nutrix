/**
 * Data page: upload a dataset, read its rows, manage the pantry.
 */

import type { DatasetRow, DatasetRowsResponse } from '../types/dataset';
import type { UploadData } from '../types/app';
import { API_BASE, getJson, handleResponse } from './apiClient';
import {
  addPantryIds,
  clearPantryIds,
  isInPantry,
  pantryIds,
  removePantryId,
  setDatasetId,
} from './session';

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
  const data = await getJson<Omit<DatasetRowsResponse, 'rows'> & { rows: Omit<DatasetRow, 'in_pantry'>[] }>(
    '/api/data/rows',
    { offset, limit },
  );
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
