/**
 * The optimization problems offered on the Optimize page: their description,
 * the form fields and starting values, and shared messages.
 */

import type { OptimizationProblem } from '../../types/app';
import type { DeficiencyCoverageInput, HighProteinLimits } from '../../types/optimization';

// ─────────────────────────────────────────────
// Problem catalogue (cards + details panel)
// ─────────────────────────────────────────────

export interface ProblemOption {
  id: OptimizationProblem;
  title: string;
  description: string;
  objective: string;
  constraints: string[];
}

export const PROBLEMS: ProblemOption[] = [
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
      'qᵢ ≥ q_min · xᵢ  (minimum portion)',
      'xᵢ ∈ {0,1},  qᵢ ≥ 0,  0 ≤ yⱼ ≤ 1',
    ],
  },
];

// ─────────────────────────────────────────────
// Problem 1 — High-Protein form
// ─────────────────────────────────────────────

/** Raw text of each input, so an empty box stays empty. */
export type HighProteinFormValues = Record<keyof HighProteinLimits, string>;

export const EMPTY_HIGH_PROTEIN: HighProteinFormValues = {
  calorieMax: '',
  fatMax: '',
  proteinMin: '',
  quantityMax: '',
};

export const HIGH_PROTEIN_FIELDS: {
  key: keyof HighProteinLimits;
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
// Problem 2 — Deficiency Coverage form
// ─────────────────────────────────────────────

export type DeficiencyFormValues = Omit<DeficiencyCoverageInput, 'caloriesColumn'>;

export const EMPTY_DEFICIENCY: DeficiencyFormValues = {
  nutrient: '',
  requiredDosage: 0,
  calorieMax: 0,
  varietyMin: 2,
  varietyMax: 10,
  minPortion: 10,
};

// ─────────────────────────────────────────────
// Column mapping (shared by both problems)
// ─────────────────────────────────────────────

// Which dataset column holds each value the models need.
// Detected automatically from the column names; not editable by the user.
export type ColumnMapping = { calories: string; fat: string; protein: string };
export const EMPTY_MAPPING: ColumnMapping = { calories: '', fat: '', protein: '' };

export const missingColumnsError = (roles: string[]) =>
  `This dataset has no recognizable ${roles.join(', ')} column ` +
  `(expected names such as "Calories" / "Caloric Value", "Fat", "Protein").`;

// ─────────────────────────────────────────────
// Result messages
// ─────────────────────────────────────────────

export const skippedNote = (count: number) =>
  count > 0 ? ` ${count} row${count === 1 ? ' was' : 's were'} skipped because of missing or invalid values.` : '';
