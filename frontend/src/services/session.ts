/**
 * Browser-side session state.
 *
 * The backend is stateless (on Vercel each request may hit a different server),
 * so the browser remembers which dataset was uploaded and which rows are in the
 * pantry, and sends both with every request.
 */

let datasetId: string | null = null;
const pantry = new Set<number>();

export const getDatasetId = (): string | null => datasetId;

/** Called after a successful upload. A new dataset starts with an empty pantry. */
export const setDatasetId = (id: string | null): void => {
  datasetId = id;
  pantry.clear();
};

export const pantryIds = (): number[] => Array.from(pantry).sort((a, b) => a - b);
export const isInPantry = (rowId: number): boolean => pantry.has(rowId);
export const addPantryIds = (ids: number[]): void => ids.forEach((id) => pantry.add(id));
export const removePantryId = (id: number): void => {
  pantry.delete(id);
};
export const clearPantryIds = (): void => pantry.clear();
