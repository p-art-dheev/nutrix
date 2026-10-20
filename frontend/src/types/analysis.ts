// Responses of the Analysis page endpoints (backend/app/analysis/)

export interface DescriptiveStatistics {
  count: number
  mean: number | null
  median: number | null
  std: number | null
  min: number | null
  q1: number | null
  q3: number | null
  max: number | null
}

export interface DistributionBin {
  range: string
  count: number
}

export interface DistributionResult {
  attribute: string
  statistics: { mean: number | null; median: number | null; std: number | null }
  distribution: DistributionBin[]
}

export interface CorrelationResult {
  x: string
  y: string
  pearson_r: number | null
  pair_count: number
  points: { x: number; y: number }[]
}
