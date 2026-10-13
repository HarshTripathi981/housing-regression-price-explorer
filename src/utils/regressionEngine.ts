import { HousingModelData, HouseRecord, SampleInput } from '../types/housing';

export interface PredictionResult {
  predictedPrice: number;
  intervalLow: number;
  intervalHigh: number;
  pricePerSqft: number;
  contributions: Array<{
    feature: string;
    label: string;
    impact: number;
    description: string;
  }>;
  marginalDeltas: {
    add100Sqft: number;
    addBedroom: number;
    addBathroom: number;
    improveCondition1Pt: number;
    addPool: number;
    addGarage: number;
  };
}

export function calculatePrediction(
  input: {
    neighborhood: string;
    sqft: number;
    bedrooms: number;
    bathrooms: number;
    lot_size: number;
    year_built: number;
    condition: number;
    garage_spaces: number;
    school_rating: number;
    distance_downtown: number;
    has_pool: number;
  },
  modelData: HousingModelData
): PredictionResult {
  const { intercept, coefficients, dummy_neighborhoods } = modelData.model_weights;
  const rmse = modelData.metrics.test.rmse;
  const age = Math.max(0, 2026 - input.year_built);

  // Contributions breakdown
  const contributions: PredictionResult['contributions'] = [];

  // Base intercept
  contributions.push({
    feature: 'intercept',
    label: 'Base Market Intercept',
    impact: intercept,
    description: 'Starting constant across market before individual home features'
  });

  // Sqft
  const sqftImpact = (coefficients['sqft'] || 0) * input.sqft;
  contributions.push({
    feature: 'sqft',
    label: `Living Area (${input.sqft.toLocaleString()} sq ft)`,
    impact: Math.round(sqftImpact),
    description: `$${(coefficients['sqft'] || 0).toFixed(2)}/sq ft of interior living space`
  });

  // Neighborhood Premium
  let neighborhoodImpact = 0;
  let neighborhoodDesc = 'Base reference zone (Pinecrest Valley)';
  if (dummy_neighborhoods.includes(input.neighborhood)) {
    const key = `neigh_${input.neighborhood}`;
    neighborhoodImpact = (coefficients[key] || 0) * 1.0;
    neighborhoodDesc = `Location differential relative to baseline`;
  }
  contributions.push({
    feature: 'neighborhood',
    label: `Location: ${input.neighborhood}`,
    impact: Math.round(neighborhoodImpact),
    description: neighborhoodDesc
  });

  // Condition
  const conditionImpact = (coefficients['condition'] || 0) * input.condition;
  contributions.push({
    feature: 'condition',
    label: `Condition Rating (${input.condition}/10)`,
    impact: Math.round(conditionImpact),
    description: `$${(coefficients['condition'] || 0).toLocaleString()} per rating level`
  });

  // Bathrooms
  const bathImpact = (coefficients['bathrooms'] || 0) * input.bathrooms;
  contributions.push({
    feature: 'bathrooms',
    label: `Bathrooms (${input.bathrooms})`,
    impact: Math.round(bathImpact),
    description: `$${(coefficients['bathrooms'] || 0).toLocaleString()} per bathroom fixture`
  });

  // Bedrooms
  const bedImpact = (coefficients['bedrooms'] || 0) * input.bedrooms;
  contributions.push({
    feature: 'bedrooms',
    label: `Bedrooms (${input.bedrooms})`,
    impact: Math.round(bedImpact),
    description: `$${(coefficients['bedrooms'] || 0).toLocaleString()} per bedroom`
  });

  // Lot Size
  const lotImpact = (coefficients['lot_size'] || 0) * input.lot_size;
  contributions.push({
    feature: 'lot_size',
    label: `Lot Size (${input.lot_size.toLocaleString()} sq ft)`,
    impact: Math.round(lotImpact),
    description: `$${(coefficients['lot_size'] || 0).toFixed(2)} per lot sq ft`
  });

  // Age / Depreciation
  const ageImpact = (coefficients['age'] || 0) * age;
  contributions.push({
    feature: 'age',
    label: `Property Age (${age} yrs, built ${input.year_built})`,
    impact: Math.round(ageImpact),
    description: `Depreciation adjustment over time`
  });

  // School Rating
  const schoolImpact = (coefficients['school_rating'] || 0) * input.school_rating;
  contributions.push({
    feature: 'school_rating',
    label: `School District (${input.school_rating}/10)`,
    impact: Math.round(schoolImpact),
    description: `$${(coefficients['school_rating'] || 0).toLocaleString()} per school score point`
  });

  // Distance Downtown
  const distImpact = (coefficients['distance_downtown'] || 0) * input.distance_downtown;
  contributions.push({
    feature: 'distance_downtown',
    label: `Commute Distance (${input.distance_downtown} mi)`,
    impact: Math.round(distImpact),
    description: `Transit & commute discount for city center distance`
  });

  // Garage
  const garageImpact = (coefficients['garage_spaces'] || 0) * input.garage_spaces;
  contributions.push({
    feature: 'garage_spaces',
    label: `Garage (${input.garage_spaces} stall${input.garage_spaces === 1 ? '' : 's'})`,
    impact: Math.round(garageImpact),
    description: `$${(coefficients['garage_spaces'] || 0).toLocaleString()} per covered garage stall`
  });

  // Pool
  const poolImpact = (coefficients['has_pool'] || 0) * input.has_pool;
  if (input.has_pool > 0) {
    contributions.push({
      feature: 'has_pool',
      label: `Private Swimming Pool`,
      impact: Math.round(poolImpact),
      description: `In-ground pool amenity value`
    });
  }

  // Total predicted price
  const totalRaw = contributions.reduce((acc, c) => acc + c.impact, 0);
  const predictedPrice = Math.max(90000, Math.round(totalRaw / 100) * 100);
  const intervalLow = Math.max(80000, Math.round(predictedPrice - 1.96 * rmse));
  const intervalHigh = Math.round(predictedPrice + 1.96 * rmse);
  const pricePerSqft = Math.round(predictedPrice / Math.max(1, input.sqft));

  // Marginal deltas
  const marginalDeltas = {
    add100Sqft: Math.round((coefficients['sqft'] || 160) * 100),
    addBedroom: Math.round(coefficients['bedrooms'] || 12000),
    addBathroom: Math.round(coefficients['bathrooms'] || 17000),
    improveCondition1Pt: Math.round(coefficients['condition'] || 16000),
    addPool: Math.round(coefficients['has_pool'] || 25000),
    addGarage: Math.round(coefficients['garage_spaces'] || 13500)
  };

  return {
    predictedPrice,
    intervalLow,
    intervalHigh,
    pricePerSqft,
    contributions,
    marginalDeltas
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatNumber(val: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(val);
}
