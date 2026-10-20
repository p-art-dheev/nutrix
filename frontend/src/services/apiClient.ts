/**
 * Shared helpers for talking to the backend: building URLs and reading responses.
 * The per-page API calls live in datasetApi.ts, analysisApi.ts and optimizationApi.ts.
 */

import { getDatasetId } from './session';

// Empty = same origin: '/api/...' is served by Vercel in production and proxied
// to the local FastAPI server by Vite in development (see vite.config.ts).
export const API_BASE = import.meta.env.VITE_API_BASE ?? '';

/** Build an API URL that includes the current dataset ID (and any extra params). */
export const apiUrl = (path: string, params: Record<string, string | number> = {}): string => {
  const query = new URLSearchParams();
  const datasetId = getDatasetId();
  if (datasetId) query.set('datasetId', datasetId);
  Object.entries(params).forEach(([key, value]) => query.set(key, String(value)));
  const qs = query.toString();
  return `${API_BASE}${path}${qs ? `?${qs}` : ''}`;
};

/** Return the JSON body, or throw an Error with the backend's message. */
export async function handleResponse<T>(response: Response): Promise<T> {
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

export const getJson = async <T>(path: string, params: Record<string, string | number> = {}): Promise<T> =>
  handleResponse<T>(await fetch(apiUrl(path, params)));

export const postJson = async <T>(path: string, body: unknown): Promise<T> => {
  const response = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
};
