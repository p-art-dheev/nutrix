import React, { useState } from 'react';
import type { OptimizationProblem } from '../../types/app';
import type {
  DeficiencyCoverageInput,
  DeficiencyCoverageResult,
  HighProteinInput,
  HighProteinResult,
  OptimizationColumns,
} from '../../types/optimization';
import {
  fetchOptimizationColumns,
  runDeficiencyCoverageOptimization,
  runHighProteinOptimization,
} from '../../services/optimizationApi';
import { EMPTY_DEFICIENCY, EMPTY_HIGH_PROTEIN, EMPTY_MAPPING, PROBLEMS } from './problems';
import type { ColumnMapping } from './problems';
import { Problem1Form } from './Problem1Form';
import { Problem1Results } from './Problem1Results';
import { Problem2Form } from './Problem2Form';
import { Problem2Results } from './Problem2Results';
import './OptimizePage.css';

interface OptimizePageProps {
  hasData: boolean;
  onNavigateToData: () => void;
}

/**
 * Optimize page: pick a problem, fill in its form, run it and show the result.
 * Forms validate their own input; this page calls the API and keeps the state.
 */
export const OptimizePage: React.FC<OptimizePageProps> = ({ hasData, onNavigateToData }) => {
  const [selectedProblem, setSelectedProblem] = useState<OptimizationProblem | null>(null);

  // Problem 1 state
  const [highProteinForm, setHighProteinForm] = useState(EMPTY_HIGH_PROTEIN);
  const [hpResult, setHpResult] = useState<HighProteinResult | null>(null);

  // Problem 2 state
  const [dcForm, setDcForm] = useState(EMPTY_DEFICIENCY);
  const [dcResult, setDcResult] = useState<DeficiencyCoverageResult | null>(null);

  // Column mapping (shared by both problems, auto-detected)
  const [columns, setColumns] = useState<OptimizationColumns | null>(null);
  const [columnsLoading, setColumnsLoading] = useState(false);
  const [mapping, setMapping] = useState<ColumnMapping>(EMPTY_MAPPING);

  // Shared UI state
  const [formError, setFormError] = useState<string | null>(null);
  const [solving, setSolving] = useState(false);

  const activeProblem = PROBLEMS.find((p) => p.id === selectedProblem);

  // ── Load dataset columns (and detected mapping) the first time a problem is picked ──
  const loadColumns = () => {
    setColumnsLoading(true);
    fetchOptimizationColumns()
      .then((data) => {
        setColumns(data);
        setMapping({
          calories: data.suggested.calories ?? '',
          fat: data.suggested.fat ?? '',
          protein: data.suggested.protein ?? '',
        });
        // Default to iron (the most common deficiency) when the dataset has it
        const defaultNutrient =
          data.nutrient_columns.find((col) => col.toLowerCase().startsWith('iron')) ?? data.nutrient_columns[0] ?? '';
        setDcForm((prev) => ({ ...prev, nutrient: prev.nutrient || defaultNutrient }));
      })
      .catch(() => setFormError('Could not load columns from the dataset.'))
      .finally(() => setColumnsLoading(false));
  };

  const handleSelectProblem = (id: OptimizationProblem) => {
    setSelectedProblem(id);
    setFormError(null);
    setHpResult(null);
    setDcResult(null);
    if (!columns && !columnsLoading) loadColumns();
  };

  // ── Run a problem: call the API, keep the result or show the error ──
  const runProblem1 = async (input: HighProteinInput) => {
    setFormError(null);
    setSolving(true);
    setHpResult(null);
    try {
      setHpResult(await runHighProteinOptimization(input));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Optimization failed.');
    } finally {
      setSolving(false);
    }
  };

  const runProblem2 = async (input: DeficiencyCoverageInput) => {
    setFormError(null);
    setSolving(true);
    setDcResult(null);
    try {
      setDcResult(await runDeficiencyCoverageOptimization(input));
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

          {selectedProblem === 'high-protein' && (
            <Problem1Form
              values={highProteinForm}
              onChange={setHighProteinForm}
              mapping={mapping}
              columnsLoading={columnsLoading}
              solving={solving}
              error={formError}
              onError={setFormError}
              onSubmit={runProblem1}
            />
          )}

          {selectedProblem === 'nutrient-deficiency' && (
            <Problem2Form
              values={dcForm}
              onChange={setDcForm}
              mapping={mapping}
              nutrientColumns={columns?.nutrient_columns ?? []}
              columnsLoading={columnsLoading}
              solving={solving}
              error={formError}
              onError={setFormError}
              onSubmit={runProblem2}
            />
          )}
        </div>
      )}

      {hpResult && selectedProblem === 'high-protein' && <Problem1Results result={hpResult} />}
      {dcResult && selectedProblem === 'nutrient-deficiency' && <Problem2Results result={dcResult} />}
    </div>
  );
};
