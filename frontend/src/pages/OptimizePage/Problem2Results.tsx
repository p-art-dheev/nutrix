import React from 'react';
import type { DeficiencyCoverageResult } from '../../types/optimization';
import { QuantityChart } from './QuantityChart';
import { skippedNote } from './problems';

/** Problem 2 output: coverage %, totals, quantity chart and the selected foods. */
export const Problem2Results: React.FC<{ result: DeficiencyCoverageResult }> = ({ result }) => (
  <div className="opt-result surface-card dc-result">
    <div className="opt-result-header">
      <h2>Model Output</h2>
      <span className={`opt-status ${result.status === 'Optimal' ? 'ok' : 'warn'}`}>{result.status}</span>
    </div>
    <p className="opt-result-message">
      {result.message} Using {result.food_count} food{result.food_count === 1 ? '' : 's'} from the {result.source}.
      {skippedNote(result.skipped_count)}
    </p>

    {result.status === 'Optimal' && (
      <>
        {/* Coverage headline */}
        <div className="dc-coverage-hero">
          <div className="dc-coverage-label">
            <span>Deficiency Coverage</span>
            <strong className="dc-coverage-pct">{result.totals.deficiency_coverage_pct.toFixed(1)}%</strong>
          </div>
          <p className="dc-coverage-sub">
            Objective Z = yⱼ = <strong>{result.totals.deficiency_coverage_fraction.toFixed(4)}</strong>
          </p>
        </div>

        <div className="opt-totals opt-totals--dc">
          <div className="opt-total">
            <span>Total calories</span>
            <strong>{result.totals.calories.toLocaleString()} kcal</strong>
            <em>≤ {result.limits.calorie_max.toLocaleString()} Cmax</em>
          </div>
          <div className="opt-total">
            <span>{result.limits.nutrient} obtained</span>
            <strong>{result.totals.nutrient_obtained.toFixed(4)}</strong>
            <em>of {result.totals.required_dosage} required (D)</em>
          </div>
          <div className="opt-total">
            <span>Foods selected (xᵢ=1)</span>
            <strong>{result.totals.food_count_selected}</strong>
            <em>Vmin {result.limits.variety_min} – Vmax {result.limits.variety_max}</em>
          </div>
          <div className="opt-total">
            <span>Foods allocated (qᵢ&gt;0)</span>
            <strong>{result.totals.food_count_with_quantity}</strong>
            <em>Non-zero quantity</em>
          </div>
        </div>

        {result.foods.length > 0 && <QuantityChart foods={result.foods} />}

        {result.foods.length > 0 && (
          <div className="opt-result-table-wrap">
            <table className="opt-result-table">
              <thead>
                <tr>
                  <th>Food</th>
                  <th>xᵢ</th>
                  <th>Quantity qᵢ (g)</th>
                  <th>Calories (kcal)</th>
                  <th>{result.limits.nutrient} obtained</th>
                  <th>{result.limits.nutrient} / 100 g</th>
                </tr>
              </thead>
              <tbody>
                {result.foods.map((food) => (
                  <tr key={food.id}>
                    <td>{food.food}</td>
                    <td>
                      <span className="dc-xi-badge">{food.selected ? '1' : '0'}</span>
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
);
