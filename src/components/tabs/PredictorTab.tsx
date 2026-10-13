import React, { useState } from 'react';
import { HousingModelData, SampleInput } from '../../types/housing';
import { calculatePrediction, formatCurrency } from '../../utils/regressionEngine';
import { Sparkles, Home, Sliders, ArrowUpRight, ArrowDownRight, Layers, CheckCircle2 } from 'lucide-react';

interface PredictorTabProps {
  modelData: HousingModelData;
}

export const PredictorTab: React.FC<PredictorTabProps> = ({ modelData }) => {
  const { neighborhoods, continuous_features } = modelData.metadata;
  const samplePresets = modelData.sample_inputs;

  // State for user inputs
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>(samplePresets[0].neighborhood);
  const [sqft, setSqft] = useState<number>(samplePresets[0].sqft);
  const [bedrooms, setBedrooms] = useState<number>(samplePresets[0].bedrooms);
  const [bathrooms, setBathrooms] = useState<number>(samplePresets[0].bathrooms);
  const [lotSize, setLotSize] = useState<number>(samplePresets[0].lot_size);
  const [yearBuilt, setYearBuilt] = useState<number>(samplePresets[0].year_built);
  const [condition, setCondition] = useState<number>(samplePresets[0].condition);
  const [garageSpaces, setGarageSpaces] = useState<number>(samplePresets[0].garage_spaces);
  const [schoolRating, setSchoolRating] = useState<number>(samplePresets[0].school_rating);
  const [distanceDowntown, setDistanceDowntown] = useState<number>(samplePresets[0].distance_downtown);
  const [hasPool, setHasPool] = useState<number>(samplePresets[0].has_pool);

  // Active sample preset name
  const [activePresetName, setActivePresetName] = useState<string>(samplePresets[0].name);

  // Comparison snapshot state
  const [pinnedScenario, setPinnedScenario] = useState<{
    name: string;
    price: number;
    sqft: number;
    neighborhood: string;
  } | null>(null);

  // Load a preset
  const loadPreset = (preset: SampleInput) => {
    setActivePresetName(preset.name);
    setSelectedNeighborhood(preset.neighborhood);
    setSqft(preset.sqft);
    setBedrooms(preset.bedrooms);
    setBathrooms(preset.bathrooms);
    setLotSize(preset.lot_size);
    setYearBuilt(preset.year_built);
    setCondition(preset.condition);
    setGarageSpaces(preset.garage_spaces);
    setSchoolRating(preset.school_rating);
    setDistanceDowntown(preset.distance_downtown);
    setHasPool(preset.has_pool);
  };

  // Run real-time prediction
  const prediction = calculatePrediction(
    {
      neighborhood: selectedNeighborhood,
      sqft,
      bedrooms,
      bathrooms,
      lot_size: lotSize,
      year_built: yearBuilt,
      condition,
      garage_spaces: garageSpaces,
      school_rating: schoolRating,
      distance_downtown: distanceDowntown,
      has_pool: hasPool
    },
    modelData
  );

  const currentNeighborhoodObj = neighborhoods.find((n) => n.name === selectedNeighborhood);
  const neighborhoodAvgPrice = modelData.neighborhood_statistics[selectedNeighborhood]?.avg_price || 400000;
  const pctVsNeighAvg = Math.round(((prediction.predictedPrice - neighborhoodAvgPrice) / neighborhoodAvgPrice) * 100);

  const getConditionLabel = (val: number) => {
    if (val <= 3) return 'Distressed / Fixer';
    if (val <= 5) return 'Standard / Habitable';
    if (val <= 7) return 'Good / Modernized';
    if (val <= 9) return 'Excellent / Renovated';
    return 'Pristine / Luxury Showroom';
  };

  return (
    <div className="space-y-6">
      {/* Sample Archetypes Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Benchmark Sample Homes
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Click any archetype to load its feature values into the regression engine
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
          {samplePresets.map((preset) => {
            const isSelected = activePresetName === preset.name;
            return (
              <button
                key={preset.name}
                onClick={() => loadPreset(preset)}
                className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/50 shadow-xs ring-1 ring-sky-500'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {preset.name}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {preset.neighborhood.split(' ')[0]} · {preset.sqft} sq ft
                </div>
                <div className="text-xs font-mono font-medium text-sky-700 mt-1">
                  {formatCurrency(preset.predicted_price || 0)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Prediction Workspace: Left Controls, Right Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-semibold text-slate-900">
                Property Features & Location
              </h3>
            </div>
            <button
              onClick={() => {
                setActivePresetName('Custom Property');
                setSqft(2000);
                setBedrooms(3);
                setBathrooms(2);
                setLotSize(7500);
                setYearBuilt(2010);
                setCondition(7);
                setGarageSpaces(2);
                setSchoolRating(8);
                setDistanceDowntown(10);
                setHasPool(0);
              }}
              className="text-xs text-sky-600 hover:text-sky-800 font-medium cursor-pointer"
            >
              Reset to Defaults
            </button>
          </div>

          {/* Location Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Location & Neighborhood
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {neighborhoods.map((n) => {
                const isSelected = selectedNeighborhood === n.name;
                return (
                  <button
                    key={n.name}
                    type="button"
                    onClick={() => {
                      setSelectedNeighborhood(n.name);
                      setActivePresetName('Custom Property');
                    }}
                    className={`flex items-start gap-2.5 p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full mt-0.5 shrink-0"
                      style={{ backgroundColor: n.color }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {n.name}
                      </div>
                      <div className="text-[10px] text-slate-500 line-clamp-1">
                        {n.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size & Layout Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            {/* Sqft */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Living Area (Sq Ft)</span>
                <span className="font-mono font-medium text-slate-900">
                  {sqft.toLocaleString()} sq ft
                </span>
              </div>
              <input
                type="range"
                min="600"
                max="5000"
                step="50"
                value={sqft}
                onChange={(e) => {
                  setSqft(Number(e.target.value));
                  setActivePresetName('Custom Property');
                }}
                className="w-full accent-slate-900 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>600 sq ft</span>
                <span>2,500</span>
                <span>5,000 sq ft</span>
              </div>
            </div>

            {/* Lot Size */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Lot Size (Sq Ft)</span>
                <span className="font-mono font-medium text-slate-900">
                  {lotSize.toLocaleString()} sq ft
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="25000"
                step="500"
                value={lotSize}
                onChange={(e) => {
                  setLotSize(Number(e.target.value));
                  setActivePresetName('Custom Property');
                }}
                className="w-full accent-slate-900 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>1k sq ft</span>
                <span>12k</span>
                <span>25k sq ft</span>
              </div>
            </div>
          </div>

          {/* Bedrooms & Bathrooms */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bedrooms
              </label>
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setBedrooms(num);
                      setActivePresetName('Custom Property');
                    }}
                    className={`flex-1 py-1.5 text-xs font-mono font-medium transition-colors ${
                      bedrooms === num
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bathrooms
              </label>
              <select
                value={bathrooms}
                onChange={(e) => {
                  setBathrooms(Number(e.target.value));
                  setActivePresetName('Custom Property');
                }}
                className="w-full border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-mono font-medium bg-white text-slate-900 focus:outline-slate-900 cursor-pointer"
              >
                {[1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0].map((b) => (
                  <option key={b} value={b}>
                    {b.toFixed(1)} baths
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Garage Stalls
              </label>
              <select
                value={garageSpaces}
                onChange={(e) => {
                  setGarageSpaces(Number(e.target.value));
                  setActivePresetName('Custom Property');
                }}
                className="w-full border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-mono font-medium bg-white text-slate-900 focus:outline-slate-900 cursor-pointer"
              >
                <option value={0}>0 (Street)</option>
                <option value={1}>1 Car Garage</option>
                <option value={2}>2 Car Garage</option>
                <option value={3}>3 Car Garage</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Swimming Pool
              </label>
              <button
                type="button"
                onClick={() => {
                  setHasPool(hasPool === 1 ? 0 : 1);
                  setActivePresetName('Custom Property');
                }}
                className={`w-full py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  hasPool === 1
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {hasPool === 1 ? '✓ Private Pool' : 'No Pool'}
              </button>
            </div>
          </div>

          {/* Quality, Age & Commute */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            {/* Condition */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Condition ({condition}/10)</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={condition}
                onChange={(e) => {
                  setCondition(Number(e.target.value));
                  setActivePresetName('Custom Property');
                }}
                className="w-full accent-slate-900 cursor-pointer"
              />
              <div className="text-[10px] text-slate-500 truncate mt-0.5 font-medium">
                {getConditionLabel(condition)}
              </div>
            </div>

            {/* Year Built */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Year Built</span>
                <span className="font-mono font-medium text-slate-900">{yearBuilt}</span>
              </div>
              <input
                type="range"
                min="1940"
                max="2026"
                step="1"
                value={yearBuilt}
                onChange={(e) => {
                  setYearBuilt(Number(e.target.value));
                  setActivePresetName('Custom Property');
                }}
                className="w-full accent-slate-900 cursor-pointer"
              />
              <div className="text-[10px] text-slate-500 mt-0.5">
                Age: {Math.max(0, 2026 - yearBuilt)} years
              </div>
            </div>

            {/* Distance to Downtown */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Commute to CBD</span>
                <span className="font-mono font-medium text-slate-900">
                  {distanceDowntown} mi
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="0.5"
                value={distanceDowntown}
                onChange={(e) => {
                  setDistanceDowntown(Number(e.target.value));
                  setActivePresetName('Custom Property');
                }}
                className="w-full accent-slate-900 cursor-pointer"
              />
              <div className="text-[10px] text-slate-500 mt-0.5">
                School Rating: {schoolRating}/10
              </div>
            </div>
          </div>
        </div>

        {/* Output Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Price Card */}
          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>OLS Multiple Regression Prediction</span>
              <span className="font-mono text-sky-400">R² = {modelData.metrics.test.r2}</span>
            </div>

            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-white mt-1">
              {formatCurrency(prediction.predictedPrice)}
            </div>

            {/* 95% Prediction Interval */}
            <div className="mt-2 text-xs text-slate-300 flex items-center justify-between bg-slate-800/80 p-2 rounded-lg border border-slate-700">
              <span className="text-slate-400">95% Prediction Interval:</span>
              <span className="font-mono text-slate-200">
                {formatCurrency(prediction.intervalLow)} – {formatCurrency(prediction.intervalHigh)}
              </span>
            </div>

            {/* Key Sub-metrics */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Price / Living Sq Ft</span>
                <span className="font-mono font-semibold text-white">
                  ${prediction.pricePerSqft} / sq ft
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">vs {selectedNeighborhood.split(' ')[0]} Avg</span>
                <span className={`font-mono font-semibold flex items-center gap-0.5 ${pctVsNeighAvg >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {pctVsNeighAvg >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {pctVsNeighAvg >= 0 ? '+' : ''}{pctVsNeighAvg}%
                </span>
              </div>
            </div>

            {/* Snapshot compare button */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  setPinnedScenario({
                    name: activePresetName,
                    price: prediction.predictedPrice,
                    sqft,
                    neighborhood: selectedNeighborhood
                  })
                }
                className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                Pin as Scenario A to Compare
              </button>
              {pinnedScenario && (
                <button
                  type="button"
                  onClick={() => setPinnedScenario(null)}
                  className="text-xs text-slate-400 hover:text-rose-300"
                >
                  Clear Pin
                </button>
              )}
            </div>
          </div>

          {/* Side-by-side pinned comparison pill if active */}
          {pinnedScenario && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold text-sky-900">Pinned Scenario A: </span>
                <span className="text-sky-700">
                  {pinnedScenario.name} ({formatCurrency(pinnedScenario.price)})
                </span>
              </div>
              <div className="font-mono font-bold text-slate-900">
                Δ {formatCurrency(prediction.predictedPrice - pinnedScenario.price)}
              </div>
            </div>
          )}

          {/* Feature Value Sensitivity ("What-If" Upgrades) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2.5">
              Marginal Value Sensitivity (What-If?)
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500 block text-[11px]">+100 sq ft Expansion</span>
                <span className="font-mono font-semibold text-emerald-700">
                  +{formatCurrency(prediction.marginalDeltas.add100Sqft)}
                </span>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500 block text-[11px]">+1 Condition Level</span>
                <span className="font-mono font-semibold text-emerald-700">
                  +{formatCurrency(prediction.marginalDeltas.improveCondition1Pt)}
                </span>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500 block text-[11px]">+1 Full Bathroom</span>
                <span className="font-mono font-semibold text-emerald-700">
                  +{formatCurrency(prediction.marginalDeltas.addBathroom)}
                </span>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Install Swimming Pool</span>
                <span className="font-mono font-semibold text-emerald-700">
                  +{formatCurrency(prediction.marginalDeltas.addPool)}
                </span>
              </div>
            </div>
          </div>

          {/* Feature Contribution Waterfall / Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">
              Regression Dollar Attribution
            </h4>
            <p className="text-[11px] text-slate-500 mb-3">
              Additive component breakdown from the trained linear model
            </p>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {prediction.contributions.map((c, i) => (
                <div
                  key={`${c.feature}-${i}`}
                  className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0"
                >
                  <div className="truncate pr-2">
                    <span className="font-medium text-slate-800">{c.label}</span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {c.description}
                    </span>
                  </div>
                  <span
                    className={`font-mono font-semibold text-right shrink-0 ${
                      c.impact >= 0 ? 'text-slate-900' : 'text-rose-600'
                    }`}
                  >
                    {c.impact >= 0 ? '+' : ''}
                    {formatCurrency(c.impact)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
