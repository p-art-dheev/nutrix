import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addBulkToPantry, addToPantry } from '../../services/datasetApi';
import type { DatasetRow } from '../../types/dataset';
import './DatasetTable.css';

interface DatasetTableProps {
  rows: DatasetRow[];
  columns: string[];
  foodColumn: string;
  pantryIds: Set<number>;
  onAddToPantry: (ids: number[]) => void;
}

const formatCell = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return value.toLocaleString();
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return String(value);
};

interface TableRowProps {
  row: DatasetRow;
  displayColumns: string[];
  foodColumn: string;
  inPantry: boolean;
  selected: boolean;
  onToggle: (id: number) => void;
  onAdd: (id: number) => void;
}

const DatasetTableRow = memo(function DatasetTableRow({
  row,
  displayColumns,
  foodColumn,
  inPantry,
  selected,
  onToggle,
  onAdd,
}: TableRowProps) {
  const foodName = formatCell(row.values[foodColumn]);

  return (
    <tr className={`${inPantry ? 'in-pantry' : ''} ${selected ? 'selected' : ''}`.trim()}>
      <td className="col-select sticky-col-select">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(row.id)}
          disabled={inPantry}
          aria-label={`Select ${foodName}`}
        />
      </td>
      <td className="col-food sticky-col">
        <div className="food-cell">
          <button
            type="button"
            className={`btn-add-pantry${inPantry ? ' added' : ''}`}
            onClick={() => onAdd(row.id)}
            disabled={inPantry}
            title={inPantry ? 'Already in pantry' : 'Add to pantry'}
          >
            {inPantry ? '✓' : '+'}
          </button>
          <span className="food-name" title={foodName}>
            {foodName}
          </span>
        </div>
      </td>
      {displayColumns.map((col) => (
        <td key={col}>{formatCell(row.values[col])}</td>
      ))}
    </tr>
  );
});

export const DatasetTable: React.FC<DatasetTableProps> = ({
  rows,
  columns,
  foodColumn,
  pantryIds,
  onAddToPantry,
}) => {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [pendingAdd, setPendingAdd] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const displayColumns = useMemo(
    () => columns.filter((col) => col !== foodColumn),
    [columns, foodColumn],
  );

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const food = row.values[foodColumn];
      return food != null && String(food).toLowerCase().includes(q);
    });
  }, [rows, search, foodColumn]);

  const selectableIds = useMemo(
    () => filteredRows.filter((row) => !pantryIds.has(row.id)).map((row) => row.id),
    [filteredRows, pantryIds],
  );

  const allSelectableSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));
  const someSelectableSelected = selectableIds.some((id) => selectedIds.has(id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelectableSelected && !allSelectableSelected;
    }
  }, [someSelectableSelected, allSelectableSelected]);

  const pantryIdsRef = useRef(pantryIds);
  pantryIdsRef.current = pantryIds;

  const handleToggleRow = useCallback((rowId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }, []);

  const handleSelectAll = () => {
    if (allSelectableSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableIds));
    }
  };

  const handleAddOne = useCallback(
    (rowId: number) => {
      if (pantryIdsRef.current.has(rowId)) return;
      onAddToPantry([rowId]);
      setSelectedIds((prev) => {
        if (!prev.has(rowId)) return prev;
        const next = new Set(prev);
        next.delete(rowId);
        return next;
      });
      addToPantry(rowId).catch(() => undefined);
    },
    [onAddToPantry],
  );

  const handleAddSelected = async () => {
    const ids = Array.from(selectedIds).filter((id) => !pantryIds.has(id));
    if (ids.length === 0) return;

    onAddToPantry(ids);
    setSelectedIds(new Set());
    setPendingAdd(true);
    try {
      await addBulkToPantry(ids);
    } catch {
      // UI already updated; keep local pantry so the flow stays smooth
    } finally {
      setPendingAdd(false);
    }
  };

  return (
    <div className="dataset-table-wrapper">
      <div className="dataset-table-toolbar">
        <div className="dataset-table-meta">
          <span>{rows.length.toLocaleString()} food items</span>
          <span className="meta-dot">·</span>
          <span>{columns.length} columns</span>
          {search && (
            <>
              <span className="meta-dot">·</span>
              <span>{filteredRows.length} shown</span>
            </>
          )}
          {selectedIds.size > 0 && (
            <>
              <span className="meta-dot">·</span>
              <span>{selectedIds.size} selected</span>
            </>
          )}
        </div>
        <div className="dataset-toolbar-center">
          <input
            type="search"
            className="dataset-search"
            placeholder="Search food items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="dataset-toolbar-actions">
          {selectedIds.size > 0 && (
            <button
              type="button"
              className="toolbar-btn primary"
              onClick={handleAddSelected}
              disabled={pendingAdd}
            >
              {pendingAdd ? 'Adding…' : `Add selected (${selectedIds.size})`}
            </button>
          )}
        </div>
      </div>

      <div className="dataset-table-scroll">
        <table className="dataset-table">
          <thead>
            <tr>
              <th className="col-select sticky-col-select">
                <label className="select-all-label">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allSelectableSelected}
                    onChange={handleSelectAll}
                    disabled={selectableIds.length === 0}
                    title="Select all"
                  />
                  <span className="select-all-text">All</span>
                </label>
              </th>
              <th className="col-food sticky-col">{foodColumn}</th>
              {displayColumns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <DatasetTableRow
                key={row.id}
                row={row}
                displayColumns={displayColumns}
                foodColumn={foodColumn}
                inPantry={pantryIds.has(row.id)}
                selected={selectedIds.has(row.id)}
                onToggle={handleToggleRow}
                onAdd={handleAddOne}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
