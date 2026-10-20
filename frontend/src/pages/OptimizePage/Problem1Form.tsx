import React from 'react';
import type { HighProteinInput, HighProteinLimits } from '../../types/optimization';
import { HIGH_PROTEIN_FIELDS, missingColumnsError } from './problems';
import type { ColumnMapping, HighProteinFormValues } from './problems';

interface Problem1FormProps {
  values: HighProteinFormValues;
  onChange: (values: HighProteinFormValues) => void;
  mapping: ColumnMapping;
  columnsLoading: boolean;
  solving: boolean;
  error: string | null;
  onError: (message: string | null) => void;
  onSubmit: (input: HighProteinInput) => void;
}

/** Problem 1 — Optimal Protein Diet (LP): limits Cmax, Fmax, Pmin, Qmax. */
export const Problem1Form: React.FC<Problem1FormProps> = ({
  values,
  onChange,
  mapping,
  columnsLoading,
  solving,
  error,
  onError,
  onSubmit,
}) => {
  const handleChange = (key: keyof HighProteinLimits, value: string) => {
    onChange({ ...values, [key]: value });
    onError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const missing = (['calories', 'fat', 'protein'] as const).filter((role) => !mapping[role]);
    if (missing.length > 0) {
      onError(missingColumnsError(missing));
      return;
    }
    const limits: Partial<HighProteinLimits> = {};
    for (const field of HIGH_PROTEIN_FIELDS) {
      const raw = values[field.key].trim();
      const parsed = Number(raw);
      if (!raw || Number.isNaN(parsed) || parsed <= 0) {
        onError(`Enter a valid positive value for ${field.symbol} (${field.label}).`);
        return;
      }
      limits[field.key] = parsed;
    }
    onSubmit({
      ...(limits as HighProteinLimits),
      caloriesColumn: mapping.calories,
      fatColumn: mapping.fat,
      proteinColumn: mapping.protein,
    });
  };

  return (
    <form className="opt-form" onSubmit={handleSubmit}>
      <h3 className="opt-form-title">User Input</h3>
      <div className="opt-form-grid">
        {HIGH_PROTEIN_FIELDS.map((field) => (
          <label key={field.key} className="opt-field">
            <span className="opt-field-label">
              {field.label} ({field.unit})
              <span className="opt-field-symbol">{field.symbol}</span>
            </span>
            <input
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              placeholder={`Enter ${field.symbol}`}
              value={values[field.key]}
              onChange={(e) => handleChange(field.key, e.target.value)}
            />
          </label>
        ))}
      </div>
      {error && <p className="opt-form-error">{error}</p>}
      <button type="submit" className="btn-primary" disabled={solving || columnsLoading}>
        {solving ? 'Solving…' : 'Run Optimization'}
      </button>
    </form>
  );
};
