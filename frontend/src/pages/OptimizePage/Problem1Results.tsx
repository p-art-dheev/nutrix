import React from 'react';
import type { HighProteinResult } from '../../types/optimization';
import { QuantityChart } from './QuantityChart';
import { skippedNote } from './problems';

/** Problem 1 output: totals against the limits, quantity chart and food table. */
export const Problem1Results: React.FC<{ result: HighProteinResult }> = ({ result }) => (
  <div className="opt-result surface-card">
    <div className="opt-result-header">
      <h2>Model Output</h2>
      <span className={`opt-status ${result.status === 'Optimal' ? 'ok' : 'warn'}`}>{result.status}</span>
    </div>
    <p className="opt-result-message">
      {result.message} Using {result.food_count} food{result.food_count === 1 ? '' : 's'} from the {result.source}.
      {skippedNote(result.skipped_count)}
    </p>

    <div className="opt-totals">
      <div className="opt-total">
        <span>Total calories</span>
        <strong>{result.totals.calories.toLocaleString()} kcal</strong>
        <em>≤ {result.limits.calorie_max.toLocaleString()} Cmax</em>
      </div>
      <div className="opt-total">
        <span>Total protein</span>
        <strong>{result.totals.protein.toLocaleString()} g</strong>
        <em>≥ {result.limits.protein_min.toLocaleString()} Pmin</em>
      </div>
      <div className="opt-total">
        <span>Total fat</span>
        <strong>{result.totals.fat.toLocaleString()} g</strong>
        <em>≤ {result.limits.fat_max.toLocaleString()} Fmax</em>
      </div>
      <div className="opt-total">
        <span>Total quantity</span>
        <strong>{result.totals.quantity.toLocaleString()} g</strong>
        <em>≤ {result.limits.quantity_max.toLocaleString()} Qmax</em>
      </div>
    </div>

    {result.foods.length > 0 && <QuantityChart foods={result.foods} />}

    {result.foods.length > 0 && (
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
            {result.foods.map((food) => (
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
);
