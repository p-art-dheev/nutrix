import React from 'react';
import type { DeficiencyCoverageInput } from '../../types/optimization';
import { missingColumnsError } from './problems';
import type { ColumnMapping, DeficiencyFormValues } from './problems';

interface Problem2FormProps {
  values: DeficiencyFormValues;
  onChange: (values: DeficiencyFormValues) => void;
  mapping: ColumnMapping;
  nutrientColumns: string[];   // vitamins and minerals only
  columnsLoading: boolean;
  solving: boolean;
  error: string | null;
  onError: (message: string | null) => void;
  onSubmit: (input: DeficiencyCoverageInput) => void;
}

/** Problem 2 — Deficiency-Aware Food Selection (MILP): nutrient j, D, Cmax, Vmin, Vmax, q_min. */
export const Problem2Form: React.FC<Problem2FormProps> = ({
  values,
  onChange,
  mapping,
  nutrientColumns,
  columnsLoading,
  solving,
  error,
  onError,
  onSubmit,
}) => {
  const handleChange = <K extends keyof DeficiencyFormValues>(key: K, value: DeficiencyFormValues[K]) => {
    onChange({ ...values, [key]: value });
    onError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapping.calories) {
      onError(missingColumnsError(['calories']));
      return;
    }
    if (!values.nutrient) {
      onError('Please select a nutrient.');
      return;
    }
    if (values.requiredDosage <= 0) {
      onError('Required dosage D must be greater than 0.');
      return;
    }
    if (values.calorieMax <= 0) {
      onError('Calorie limit Cmax must be greater than 0.');
      return;
    }
    if (values.varietyMin < 1) {
      onError('Vmin must be at least 1.');
      return;
    }
    if (values.varietyMax < values.varietyMin) {
      onError(`Vmax (${values.varietyMax}) must be ≥ Vmin (${values.varietyMin}).`);
      return;
    }
    if (values.minPortion < 0) {
      onError('Minimum portion cannot be negative.');
      return;
    }
    onSubmit({ ...values, caloriesColumn: mapping.calories });
  };

  return (
    <form className="opt-form" onSubmit={handleSubmit}>
      <h3 className="opt-form-title">User Input</h3>

      {columnsLoading ? (
        <p className="opt-form-loading">Loading dataset columns…</p>
      ) : (
        <div className="opt-form-grid opt-form-grid--dc">
          {/* Nutrient selector (j) */}
          <label className="opt-field opt-field--full">
            <span className="opt-field-label">
              Deficient nutrient
              <span className="opt-field-symbol">j</span>
            </span>
            <select
              value={values.nutrient}
              onChange={(e) => handleChange('nutrient', e.target.value)}
              className="opt-select"
            >
              {nutrientColumns.length === 0 && (
                <option value="">No vitamin or mineral columns found</option>
              )}
              {nutrientColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </label>

          {/* Required dosage (D) */}
          <label className="opt-field">
            <span className="opt-field-label">
              Required dosage (dataset units)
              <span className="opt-field-symbol">D</span>
            </span>
            <input
              type="number"
              min="0.0001"
              step="any"
              placeholder="e.g. 18 for Iron (mg)"
              value={values.requiredDosage || ''}
              onChange={(e) => handleChange('requiredDosage', Number(e.target.value))}
            />
          </label>

          {/* Calorie max (Cmax) */}
          <label className="opt-field">
            <span className="opt-field-label">
              Max calorie capacity (kcal)
              <span className="opt-field-symbol">Cmax</span>
            </span>
            <input
              type="number"
              min="1"
              step="any"
              placeholder="e.g. 2000"
              value={values.calorieMax || ''}
              onChange={(e) => handleChange('calorieMax', Number(e.target.value))}
            />
          </label>

          {/* Variety min (Vmin) */}
          <label className="opt-field">
            <span className="opt-field-label">
              Min food variety
              <span className="opt-field-symbol">Vmin</span>
            </span>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 2"
              value={values.varietyMin}
              onChange={(e) => handleChange('varietyMin', parseInt(e.target.value, 10) || 1)}
            />
          </label>

          {/* Variety max (Vmax) */}
          <label className="opt-field">
            <span className="opt-field-label">
              Max food variety
              <span className="opt-field-symbol">Vmax</span>
            </span>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 10"
              value={values.varietyMax}
              onChange={(e) => handleChange('varietyMax', parseInt(e.target.value, 10) || 1)}
            />
          </label>

          {/* Minimum portion (q_min) */}
          <label className="opt-field">
            <span className="opt-field-label">
              Min portion per selected food (g)
              <span className="opt-field-symbol">q_min</span>
            </span>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 10"
              value={values.minPortion}
              onChange={(e) => handleChange('minPortion', Number(e.target.value))}
            />
          </label>
        </div>
      )}

      {error && <p className="opt-form-error">{error}</p>}
      <button type="submit" className="btn-primary" disabled={solving || columnsLoading}>
        {solving ? 'Solving…' : 'Run Optimization'}
      </button>
    </form>
  );
};
