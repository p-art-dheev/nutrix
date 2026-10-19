import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FileUpload } from './FileUpload';
import { DatasetTable } from './DatasetTable';
import { PantryModal } from './PantryModal';
import { fetchDatasetRows } from '../services/dataApi';
import type { UploadData } from '../types/app';
import type { DatasetRow } from '../types/dataset';
import './DataPage.css';

interface DataPageProps {
  uploadData: UploadData | null;
  onUploadSuccess: (data: UploadData) => void;
  onReset: () => void;
  onNavigateToAnalysis: () => void;
  onNavigateToOptimize: () => void;
}

export const DataPage: React.FC<DataPageProps> = ({
  uploadData,
  onUploadSuccess,
  onReset,
  onNavigateToAnalysis,
  onNavigateToOptimize,
}) => {
  const hasData = uploadData !== null;
  const [rows, setRows] = useState<DatasetRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [foodColumn, setFoodColumn] = useState('food');
  const [pantryIds, setPantryIds] = useState<Set<number>>(new Set());
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);
  const [pantryOpen, setPantryOpen] = useState(false);

  useEffect(() => {
    if (!hasData) {
      setRows([]);
      setColumns([]);
      setPantryIds(new Set());
      return;
    }

    let cancelled = false;
    setTableLoading(true);
    setTableError(null);

    fetchDatasetRows(0, 0)
      .then((data) => {
        if (cancelled) return;
        setColumns(data.columns);
        setFoodColumn(data.food_column);
        setRows(data.rows);
        setPantryIds(new Set(data.rows.filter((row) => row.in_pantry).map((row) => row.id)));
      })
      .catch((err) => {
        if (!cancelled) {
          setTableError(err instanceof Error ? err.message : 'Failed to load dataset');
        }
      })
      .finally(() => {
        if (!cancelled) setTableLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasData, uploadData?.food_items]);

  const handleAddToPantry = useCallback((ids: number[]) => {
    setPantryIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const handleRemoveFromPantry = useCallback((ids: number[]) => {
    setPantryIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  const pantryItems = useMemo(
    () =>
      rows
        .filter((row) => pantryIds.has(row.id))
        .map((row) => ({
          id: row.id,
          food: row.values[foodColumn] != null ? String(row.values[foodColumn]) : null,
        })),
    [rows, pantryIds, foodColumn],
  );

  return (
    <div className={`data-page${hasData ? ' data-page--loaded' : ''}`}>
      {!hasData && (
        <div className="data-page-header">
          <h1>Dataset</h1>
          <p>Upload your food nutrition data for analysis and optimization.</p>
        </div>
      )}

      {hasData ? (
        <div className="data-loaded-layout">
          <header className="data-loaded-header">
            <div className="data-loaded-title">
              <span className="data-loaded-check" aria-hidden="true">✓</span>
              <div>
                <h1>Dataset loaded</h1>
                <p>
                  {uploadData.food_items.toLocaleString()} items · {uploadData.columns} columns ·{' '}
                  {uploadData.files_processed} file{uploadData.files_processed !== 1 ? 's' : ''}
                  {!!uploadData.rows_removed &&
                    ` · ${uploadData.rows_removed} row${uploadData.rows_removed !== 1 ? 's' : ''} with impossible values removed`}
                </p>
              </div>
            </div>
            <div className="data-loaded-actions">
              <button
                type="button"
                className="data-btn pantry-btn"
                onClick={() => setPantryOpen(true)}
              >
                Pantry
                <span className="pantry-badge">{pantryIds.size}</span>
              </button>
              <button type="button" className="data-btn outline" onClick={onNavigateToAnalysis}>
                View Analysis
              </button>
              <button type="button" className="data-btn primary" onClick={onNavigateToOptimize}>
                Optimize
              </button>
              <button type="button" className="data-btn outline" onClick={onReset}>
                Upload New
              </button>
            </div>
          </header>

          <div className="data-loaded-body">
            {tableLoading ? (
              <div className="dataset-table-status">Loading dataset…</div>
            ) : tableError ? (
              <div className="dataset-table-status error">{tableError}</div>
            ) : (
              <DatasetTable
                rows={rows}
                columns={columns}
                foodColumn={foodColumn}
                pantryIds={pantryIds}
                onAddToPantry={handleAddToPantry}
              />
            )}
          </div>

          <PantryModal
            isOpen={pantryOpen}
            onClose={() => setPantryOpen(false)}
            items={pantryItems}
            onRemove={handleRemoveFromPantry}
          />
        </div>
      ) : (
        <div className="data-page-content surface-card">
          <FileUpload onUploadSuccess={onUploadSuccess} onContinue={onNavigateToAnalysis} />
        </div>
      )}
    </div>
  );
};
