export interface Neighborhood {
  name: string;
  description: string;
  base_premium: number;
  sqft_multiplier: number;
  school_base: number;
  dist_downtown_avg: number;
  lot_multiplier: number;
  color: string;
}

export interface HouseRecord {
  id: string;
  neighborhood: string;
  sqft: number;
  bedrooms: number;
  bathrooms: number;
  lot_size: number;
  year_built: number;
  age: number;
  condition: number;
  garage_spaces: number;
  school_rating: number;
  distance_downtown: number;
  has_pool: number;
  price: number;
  price_per_sqft: number;
}

export interface ModelMetrics {
  test: {
    r2: number;
    rmse: number;
    mae: number;
    mape: number;
    max_error: number;
  };
  train: {
    r2: number;
    rmse: number;
    mae: number;
  };
}

export interface FeatureImportance {
  feature: string;
  raw_coefficient: number;
  standardized_beta: number;
  abs_impact: number;
}

export interface StatSummary {
  count: number;
  mean: number;
  std: number;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
}

export interface NeighborhoodStat {
  count: number;
  avg_price: number;
  median_price: number;
  avg_sqft: number;
  avg_price_per_sqft: number;
  min_price: number;
  max_price: number;
}

export interface ResidualBin {
  bin_center: number;
  low: number;
  high: number;
  count: number;
}

export interface TestEvalRecord {
  id: string;
  neighborhood: string;
  sqft: number;
  bedrooms: number;
  bathrooms: number;
  actual_price: number;
  predicted_price: number;
  residual: number;
  abs_error: number;
  pct_error: number;
}

export interface SampleInput {
  name: string;
  neighborhood: string;
  sqft: number;
  bedrooms: number;
  bathrooms: number;
  lot_size: number;
  year_built: number;
  age: number;
  condition: number;
  garage_spaces: number;
  school_rating: number;
  distance_downtown: number;
  has_pool: number;
  narrative: string;
  predicted_price?: number;
  price_interval_low?: number;
  price_interval_high?: number;
  contributions?: Array<{
    feature: string;
    impact: number;
  }>;
}

export interface HousingModelData {
  metadata: {
    title: string;
    generated_samples: number;
    train_samples: number;
    test_samples: number;
    train_ratio: number;
    method: string;
    features_used: string[];
    continuous_features: string[];
    neighborhoods: Neighborhood[];
  };
  metrics: ModelMetrics;
  model_weights: {
    intercept: number;
    coefficients: Record<string, number>;
    dummy_neighborhoods: string[];
    reference_neighborhood: string;
  };
  feature_importance: FeatureImportance[];
  summary_statistics: Record<string, StatSummary>;
  neighborhood_statistics: Record<string, NeighborhoodStat>;
  correlation_matrix: Record<string, Record<string, number>>;
  residual_histogram: ResidualBin[];
  test_eval_records: TestEvalRecord[];
  sample_inputs: SampleInput[];
  raw_data_sample: HouseRecord[];
}
