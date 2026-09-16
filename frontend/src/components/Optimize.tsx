import React, { useState, useEffect } from 'react';
import type { OptimizationProblem } from '../types/app';
import type {
  HighProteinInput,
  HighProteinResult,
  DeficiencyCoverageInput,
  DeficiencyCoverageResult,
} from '../types/optimization';
import {
  runHighProteinOptimization,
  fetchNutrientColumns,
  runDeficiencyCoverageOptimization,
} from '../services/dataApi';
import './Optimize.css';

// ─────────────────────────────────────────────
// Problem catalogue
// ─────────────────────────────────────────────

interface ProblemOption {
  id: OptimizationProblem;
  title: string;
  description: string;
  objective: string;
  constraints: string[];
}

const PROBLEMS: ProblemOption[] = [
  {
    id: 'high-protein',
    title: 'High-Protein Diet',
    description:
      'Maximize total protein from pantry foods while staying within calorie, fat, and quantity limits.',
    objective: 'Maximize total protein (g)',
    constraints: ['Calories ≤ Cmax', 'Fat ≤ Fmax', 'Protein ≥ Pmin', 'Total quantity ≤ Qmax'],
  },
  {
    id: 'nutrient-deficiency',
    title: 'Deficiency Coverage',
    description:
      'Select the optimal mix of foods and quantities to maximally cover a chosen nutritional deficiency without exceeding your calorie limit (MILP).',
    objective: 'Maximize deficiency coverage fraction yⱼ ∈ [0, 1]',
    constraints: [
      'Calories ≤ Cmax',
      'yⱼ · D ≤ Σ (Nᵢⱼ / 100) · qᵢ',
      'Vmin ≤ Σ xᵢ ≤ Vmax',
      'qᵢ ≤ Mᵢ · xᵢ  (big-M linking)',
      'xᵢ ∈ {0,1},  qᵢ ≥ 0,  0 ≤ yⱼ ≤ 1',
    ],
  },
];

// ─────────────────────────────────────────────
// Problem 1 — High-Protein form config
// ─────────────────────────────────────────────

const EMPTY_HIGH_PROTEIN: Record<keyof HighProteinInput, string> = {
  calorieMax: '',
  fatMax: '',
  proteinMin: '',
  quantityMax: '',
};

const HIGH_PROTEIN_FIELDS: {
  key: keyof HighProteinInput;
  label: string;
  symbol: string;
  unit: string;
}[] = [
  { key: 'calorieMax', label: 'Maximum daily calorie limit', symbol: 'Cmax', unit: 'kcal' },
  { key: 'fatMax', label: 'Maximum daily fat limit', symbol: 'Fmax', unit: 'g' },
  { key: 'proteinMin', label: 'Minimum required protein', symbol: 'Pmin', unit: 'g' },
  { key: 'quantityMax', label: 'Maximum total food quantity', symbol: 'Qmax', unit: 'g' },
];

// ─────────────────────────────────────────────
// Problem 2 — Deficiency Coverage form config
// ─────────────────────────────────────────────

const EMPTY_DEFICIENCY: Omit<DeficiencyCoverageInput, 'nutrient'> & { nutrient: string } = {
  nutrient: '',
  requiredDosage: 0,
  calorieMax: 0,
  varietyMin: 2,
  varietyMax: 10,
};

// ─────────────────────────────────────────────
// Helper: Coverage bar
// ─────────────────────────────────────────────

const CoverageBar: React.FC<{ pct: number }> = ({ pct }) => {
  const clamped = Math.min(100, Math.max(0, pct));
  const color =
    clamped >= 80 ? 'var(--success)' : clamped >= 40 ? 'var(--warning)' : 'var(--error)';
  return (
    <div className="coverage-bar-wrap">
      <div className="coverage-bar-track">
        <div
          className="coverage-bar-fill"
          style={{ width: `${clamped}%`, background: color }}
        />
      </div>
      <span className="coverage-bar-label" style={{ color }}>
        {clamped.toFixed(1)}%
      </span>
    </div>
  );
};

// ─────────────────────────────────────────────
// Component props
// ─────────────────────────────────────────────

interface OptimizeProps {
  hasData: boolean;
  onNavigateToData: () => void;
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export const Optimize: React.FC<OptimizeProps> = ({ hasData, onNavigateToData }) => {
  const [selectedProblem, setSelectedProblem] = useState<OptimizationProblem | null>(null);

  // Problem 1 state
  const [highProteinForm, setHighProteinForm] = useState(EMPTY_HIGH_PROTEIN);
  const [hpResult, setHpResult] = useState<HighProteinResult | null>(null);

  // Problem 2 state
  const [dcForm, setDcForm] = useState(EMPTY_DEFICIENCY);
  const [dcResult, setDcResult] = useState<DeficiencyCoverageResult | null>(null);
  const [availableNutrients, setAvailableNutrients] = useState<string[]>([]);
  const [nutrientsLoading, setNutrientsLoading] = useState(false);

  // Shared UI state
  const [formError, setFormError] = useState<string | null>(null);
  const [solving, setSolving] = useState(false);

  const activeProblem = PROBLEMS.find((p) => p.id === selectedProblem);

  // ── Fetch nutrient columns when problem 2 is selected ──
  useEffect(() => {
    if (selectedProblem === 'nutrient-deficiency' && hasData && availableNutrients.length === 0) {
      setNutrientsLoading(true);
      fetchNutrientColumns()
        .then((cols) => {
          setAvailableNutrients(cols);
          if (cols.length > 0 && !dcForm.nutrient) {
            setDcForm((prev) => ({ ...prev, nutrient: cols[0] }));
          }
        })
        .catch(() => setFormError('Could not load nutrient columns from the dataset.'))
        .finally(() => setNutrientsLoading(false));
    }
  }, [selectedProblem, hasData]);

  const handleSelectProblem = (id: OptimizationProblem) => {
    setSelectedProblem(id);
    setFormError(null);
    setHpResult(null);
    setDcResult(null);
  };

  // ── Problem 1 handlers ──
  const handleHighProteinChange = (key: keyof HighProteinInput, value: string) => {
    setHighProteinForm((prev) => ({ ...prev, [key]: value }));
    setFormError(null);
  };

  const handleHighProteinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const values: Partial<HighProteinInput> = {};
    for (const field of HIGH_PROTEIN_FIELDS) {
      const raw = highProteinForm[field.key].trim();
      const parsed = Number(raw);
      if (!raw || Number.isNaN(parsed) || parsed <= 0) {
        setFormError(`Enter a valid positive value for ${field.symbol} (${field.label}).`);
        return;
      }
      values[field.key] = parsed;
    }
    setFormError(null);
    setSolving(true);
    setHpResult(null);
    try {
      const data = await runHighProteinOptimization(values as HighProteinInput);
      setHpResult(data);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Optimization failed.');
    } finally {
      setSolving(false);
    }
  };

  // ── Problem 2 handlers ──
  const handleDcChange = <K extends keyof typeof dcForm>(key: K, value: typeof dcForm[K]) => {
    setDcForm((prev) => ({ ...prev, [key]: value }));
    setFormError(null);
  };

  const handleDcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dcForm.nutrient) {
      setFormError('Please select a nutrient.');
      return;
    }
    if (dcForm.requiredDosage <= 0) {
      setFormError('Required dosage D must be greater than 0.');
      return;
    }
    if (dcForm.calorieMax <= 0) {
      setFormError('Calorie limit Cmax must be greater than 0.');
      return;
    }
    if (dcForm.varietyMin < 1) {
      setFormError('Vmin must be at least 1.');
      return;
    }
    if (dcForm.varietyMax < dcForm.varietyMin) {
      setFormError(`Vmax (${dcForm.varietyMax}) must be ≥ Vmin (${dcForm.varietyMin}).`);
      return;
    }
    setFormError(null);
    setSolving(true);
    setDcResult(null);
    try {
      const data = await runDeficiencyCoverageOptimization({
        nutrient: dcForm.nutrient,
        requiredDosage: dcForm.requiredDosage,
        calorieMax: dcForm.calorieMax,
        varietyMin: dcForm.varietyMin,
        varietyMax: dcForm.varietyMax,
      });
      setDcResult(data);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Optimization failed.');
    } finally {
      setSolving(false);
    }
  };

  // ─────────────────────────────────────────────
  // No dataset loaded guard
  // ─────────────────────────────────────────────
  if (!hasData) {
    return (
      <div className="optimize-page">
        <div className="optimize-header">
          <h1>Optimization</h1>
          <p>Select an optimization problem to generate an optimal meal plan.</p>
        </div>
        <div className="optimize-empty surface-card">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M3 5V19A9 3 0 0 0 21 19V5" />
              <path d="M3 12A9 3 0 0 0 21 12" />
            </svg>
          </div>
          <h2>No dataset loaded</h2>
          <p>Upload your nutrition data first before running an optimization.</p>
          <button className="btn-primary" onClick={onNavigateToData}>
            Go to Data
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────
  return (
    <div className="optimize-page">
      <div className="optimize-header">
        <h1>Optimization</h1>
        <p>Select an optimization problem to generate an optimal meal plan from your dataset.</p>
      </div>

      {/* Problem selection cards */}
      <div className="problem-grid">
        {PROBLEMS.map((problem) => (
          <button
            key={problem.id}
            type="button"
            className={`problem-card surface-card ${selectedProblem === problem.id ? 'selected' : ''}`}
            onClick={() => handleSelectProblem(problem.id)}
          >
            <div className="problem-card-header">
              <div className="problem-icon">
                {problem.id === 'high-protein' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6.5 6.5h11" />
                    <path d="M6.5 17.5h11" />
                    <path d="M6.5 12h11" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                )}
              </div>
              <span className="problem-select-indicator">
                {selectedProblem === problem.id ? 'Selected' : 'Select'}
              </span>
            </div>
            <h3>{problem.title}</h3>
            <p className="problem-description">{problem.description}</p>
          </button>
        ))}
      </div>

      {/* Problem details + form */}
      {activeProblem && (
        <div className="problem-details surface-card">
          <h2>{activeProblem.title} Optimization</h2>
          <div className="details-grid">
            <div className="detail-block">
              <span className="detail-label">Objective</span>
              <span className="detail-value">{activeProblem.objective}</span>
            </div>
            <div className="detail-block">
              <span className="detail-label">Constraints</span>
              <ul className="constraint-list">
                {activeProblem.constraints.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── Problem 1 form ── */}
          {selectedProblem === 'high-protein' && (
            <form className="opt-form" onSubmit={handleHighProteinSubmit}>
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
                      value={highProteinForm[field.key]}
                      onChange={(e) => handleHighProteinChange(field.key, e.target.value)}
                    />
                  </label>
                ))}
              </div>
              {formError && <p className="opt-form-error">{formError}</p>}
              <button type="submit" className="btn-primary" disabled={solving}>
                {solving ? 'Solving…' : 'Run Optimization'}
              </button>
            </form>
          )}

          {/* ── Problem 2 form ── */}
          {selectedProblem === 'nutrient-deficiency' && (
            <form className="opt-form" onSubmit={handleDcSubmit}>
              <h3 className="opt-form-title">User Input</h3>

              {nutrientsLoading ? (
                <p className="opt-form-loading">Loading nutrient columns…</p>
              ) : (
                <div className="opt-form-grid opt-form-grid--dc">
                  {/* Nutrient selector (j) */}
                  <label className="opt-field opt-field--full">
                    <span className="opt-field-label">
                      Deficient nutrient
                      <span className="opt-field-symbol">j</span>
                    </span>
                    <select
                      value={dcForm.nutrient}
                      onChange={(e) => handleDcChange('nutrient', e.target.value)}
                      className="opt-select"
                    >
                      {availableNutrients.length === 0 && (
                        <option value="">No columns available</option>
                      )}
                      {availableNutrients.map((col) => (
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
                      value={dcForm.requiredDosage || ''}
                      onChange={(e) => handleDcChange('requiredDosage', Number(e.target.value))}
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
                      value={dcForm.calorieMax || ''}
                      onChange={(e) => handleDcChange('calorieMax', Number(e.target.value))}
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
                      value={dcForm.varietyMin}
                      onChange={(e) => handleDcChange('varietyMin', parseInt(e.target.value, 10) || 1)}
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
                      value={dcForm.varietyMax}
                      onChange={(e) => handleDcChange('varietyMax', parseInt(e.target.value, 10) || 1)}
                    />
                  </label>
                </div>
              )}

              {formError && <p className="opt-form-error">{formError}</p>}
              <button type="submit" className="btn-primary" disabled={solving || nutrientsLoading}>
                {solving ? 'Solving…' : 'Run Optimization'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ── Problem 1 results ── */}
      {hpResult && selectedProblem === 'high-protein' && (
        <div className="opt-result surface-card">
          <div className="opt-result-header">
            <h2>Model Output</h2>
            <span className={`opt-status ${hpResult.status === 'Optimal' ? 'ok' : 'warn'}`}>
              {hpResult.status}
            </span>
          </div>
          <p className="opt-result-message">
            {hpResult.message} Using {hpResult.food_count} food{hpResult.food_count === 1 ? '' : 's'} from the {hpResult.source}.
          </p>

          <div className="opt-totals">
            <div className="opt-total">
              <span>Total calories</span>
              <strong>{hpResult.totals.calories.toLocaleString()} kcal</strong>
              <em>≤ {hpResult.limits.calorie_max.toLocaleString()} Cmax</em>
            </div>
            <div className="opt-total">
              <span>Total protein</span>
              <strong>{hpResult.totals.protein.toLocaleString()} g</strong>
              <em>≥ {hpResult.limits.protein_min.toLocaleString()} Pmin</em>
            </div>
            <div className="opt-total">
              <span>Total fat</span>
              <strong>{hpResult.totals.fat.toLocaleString()} g</strong>
              <em>≤ {hpResult.limits.fat_max.toLocaleString()} Fmax</em>
            </div>
            <div className="opt-total">
              <span>Total quantity</span>
              <strong>{hpResult.totals.quantity.toLocaleString()} g</strong>
              <em>≤ {hpResult.limits.quantity_max.toLocaleString()} Qmax</em>
            </div>
          </div>

          {hpResult.foods.length > 0 && (
            <div className="opt-result-table-wrap">
              <table className="opt-result-table">
                <thead>
                  <tr>
                    <th>Food</th>
                    <th>Quantity qᵢ (g)</th>
                    <th>Calories (kcal)</th>
                    <th>Protein (g)</th>
                    <th>Fat (g)</th>
                  </tr>
                </thead>
                <tbody>
                  {hpResult.foods.map((food) => (
                    <tr key={food.id}>
                      <td>{food.food}</td>
                      <td>{food.quantity.toLocaleString()}</td>
                      <td>{food.calories.toLocaleString()}</td>
                      <td>{food.protein.toLocaleString()}</td>
                      <td>{food.fat.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Problem 2 results ── */}
      {dcResult && selectedProblem === 'nutrient-deficiency' && (
        <div className="opt-result surface-card dc-result">
          <div className="opt-result-header">
            <h2>Model Output</h2>
            <span className={`opt-status ${dcResult.status === 'Optimal' ? 'ok' : 'warn'}`}>
              {dcResult.status}
            </span>
          </div>
          <p className="opt-result-message">
            {dcResult.message} Using {dcResult.food_count} food{dcResult.food_count === 1 ? '' : 's'} from the {dcResult.source}.
          </p>

          {/* Coverage headline */}
          {dcResult.status === 'Optimal' && (
            <>
              <div className="dc-coverage-hero">
                <div className="dc-coverage-label">
                  <span>Deficiency Coverage</span>
                  <strong className="dc-coverage-pct">
                    {dcResult.totals.deficiency_coverage_pct.toFixed(1)}%
                  </strong>
                </div>
                <CoverageBar pct={dcResult.totals.deficiency_coverage_pct} />
                <p className="dc-coverage-sub">
                  yⱼ = {dcResult.totals.deficiency_coverage_fraction.toFixed(4)} &nbsp;|&nbsp;
                  Nutrient obtained: <strong>{dcResult.totals.nutrient_obtained.toFixed(4)}</strong> units &nbsp;|&nbsp;
                  Required (D): <strong>{dcResult.totals.required_dosage}</strong> units
                </p>
              </div>

              <div className="opt-totals opt-totals--dc">
                <div className="opt-total">
                  <span>Total calories</span>
                  <strong>{dcResult.totals.calories.toLocaleString()} kcal</strong>
                  <em>≤ {dcResult.limits.calorie_max.toLocaleString()} Cmax</em>
                </div>
                <div className="opt-total">
                  <span>{dcResult.limits.nutrient} obtained</span>
                  <strong>{dcResult.totals.nutrient_obtained.toFixed(4)}</strong>
                  <em>of {dcResult.totals.required_dosage} required (D)</em>
                </div>
                <div className="opt-total">
                  <span>Foods selected (xᵢ=1)</span>
                  <strong>{dcResult.totals.food_count_selected}</strong>
                  <em>Vmin {dcResult.limits.variety_min} – Vmax {dcResult.limits.variety_max}</em>
                </div>
                <div className="opt-total">
                  <span>Foods allocated (qᵢ&gt;0)</span>
                  <strong>{dcResult.totals.food_count_with_quantity}</strong>
                  <em>Non-zero quantity</em>
                </div>
                <div className="opt-total">
                  <span>Coverage yⱼ</span>
                  <strong>{dcResult.totals.deficiency_coverage_pct.toFixed(2)}%</strong>
                  <em>Objective value</em>
                </div>
              </div>

              {dcResult.foods.length > 0 && (
                <div className="opt-result-table-wrap">
                  <table className="opt-result-table">
                    <thead>
                      <tr>
                        <th>Food</th>
                        <th>xᵢ</th>
                        <th>Quantity qᵢ (g)</th>
                        <th>Calories (kcal)</th>
                        <th>{dcResult.limits.nutrient} obtained</th>
                        <th>{dcResult.limits.nutrient} / 100 g</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dcResult.foods.map((food) => (
                        <tr key={food.id}>
                          <td>{food.food}</td>
                          <td>
                            <span className="dc-xi-badge">
                              {food.selected ? '1' : '0'}
                            </span>
                          </td>
                          <td>{food.quantity.toLocaleString()}</td>
                          <td>{food.calories.toLocaleString()}</td>
                          <td>{food.nutrient_obtained.toFixed(4)}</td>
                          <td>{food.nutrient_per_100g.toFixed(4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
