import React, { useState } from 'react';
import { HousingModelData, FeatureImportance, TestEvalRecord } from '../../types/housing';
import { ResidualPlot } from '../common/ResidualPlot';
import { formatCurrency } from '../../utils/regressionEngine';
import { CheckCircle2, TrendingUp, AlertTriangle, ShieldCheck, BarChart3, Filter } from 'lucide-react';

interface ModelEvaluationTabProps {
  modelData: HousingModelData;
}

export const ModelEvaluationTab: React.FC<ModelEvaluationTabProps> = ({ modelData }) => {
  const { metrics, feature_importance, test_eval_records, model_weights } = modelData;
  const [testFilter, setTestFilter] = useState<'all' | 'over' | 'under'>('all');
  const [selectedFeature, setSelectedFeature] = useState<FeatureImportance | null>(null);

  const filteredTestRecords = test_eval_records.filter((r) => {
    if (testFilter === 'over') return r.residual < -5000; // Predicted > Actual
    if (testFilter === 'under') return r.residual > 5000; // Actual > Predicted
    return true;
  });

  return (
    <div className="space-y-6">
      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* R² Score */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">R² Determination</span>
            <span className="text-emerald-600 font-mono text-[11px]">Train: {metrics.train.r2}</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {metrics.test.r2}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Explains <span className="font-semibold text-slate-700">98.2%</span> of total price variance on unseen test homes
          </p>
        </div>

        {/* RMSE */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Test RMSE</span>
            <span className="text-slate-400 font-mono text-[11px]">Root Mean Sq</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            ±{formatCurrency(metrics.test.rmse)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Standard deviation of prediction residuals (penalizes large outlier misses)
          </p>
        </div>

        {/* MAE */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Test MAE</span>
            <span className="text-slate-400 font-mono text-[11px]">Mean Abs Error</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {formatCurrency(metrics.test.mae)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Average dollar distance between prediction and actual sale price
          </p>
        </div>

        {/* MAPE */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">MAPE</span>
            <span className="text-slate-400 font-mono text-[11px]">Mean Abs % Err</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700">
            {metrics.test.mape.toFixed(2)}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Typical relative percentage error across all price price bands
          </p>
        </div>

        {/* Max Absolute Error */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Max Outlier Residual</span>
            <span className="text-rose-500 font-mono text-[11px]">Worst Case</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {formatCurrency(metrics.test.max_error)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Single largest deviation found in the 200 holdout test set observations
          </p>
        </div>
      </div>

      {/* Residual Diagnostics Visualizer */}
      <ResidualPlot
        testRecords={test_eval_records}
        residualHistogram={modelData.residual_histogram}
        rmse={metrics.test.rmse}
      />

      {/* Feature Importance & Standardized Coefficients */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-sky-600" />
              Standardized Feature Importance (Beta Weights)
            </h3>
            <p className="text-xs text-slate-500">
              Coefficients normalized by feature standard deviation: β* = β × (σ_x / σ_y). Ranks true economic magnitude.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Intercept β₀ = {formatCurrency(model_weights.intercept)}
          </span>
        </div>

        <div className="space-y-2.5">
          {feature_importance.map((item, idx) => {
            const maxImpact = feature_importance[0].abs_impact || 1;
            const pctBar = (item.abs_impact / maxImpact) * 100;
            const isPositive = item.standardized_beta >= 0;

            return (
              <div
                key={item.feature}
                onClick={() => setSelectedFeature(item)}
                className="group p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400 w-4 text-right">
                      {idx + 1}.
                    </span>
                    <span className="font-semibold text-slate-800">
                      {item.feature.replace('neigh_', 'Location: ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-slate-500">
                      Raw: {item.raw_coefficient > 0 ? '+' : ''}
                      {item.raw_coefficient.toLocaleString()}
                    </span>
                    <span
                      className={`font-semibold ${
                        isPositive ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      β* = {isPositive ? '+' : ''}
                      {item.standardized_beta}
                    </span>
                  </div>
                </div>

                {/* Bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isPositive ? 'bg-sky-500' : 'bg-rose-400'
                    }`}
                    style={{ width: `${Math.max(4, pctBar)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Test Sample Residual Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-slate-700" />
              Holdout Test Predictions & Residual Error Audit
            </h3>
            <p className="text-xs text-slate-500">
              Examining actual vs predicted valuations across individual test set records
            </p>
          </div>

          {/* Residual filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setTestFilter('all')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                testFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Test Records ({test_eval_records.length})
            </button>
            <button
              onClick={() => setTestFilter('over')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                testFilter === 'over'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Over-Predicted (Pred &gt; Act)
            </button>
            <button
              onClick={() => setTestFilter('under')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                testFilter === 'under'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Under-Predicted (Act &gt; Pred)
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 bg-white border-b border-slate-200 text-slate-600 font-medium z-10">
              <tr>
                <th className="py-2 px-3">House ID</th>
                <th className="py-2 px-3">Neighborhood</th>
                <th className="py-2 px-3 text-right">Living Sq Ft</th>
                <th className="py-2 px-3 text-right">Actual Price</th>
                <th className="py-2 px-3 text-right">Predicted Price</th>
                <th className="py-2 px-3 text-right">Residual Error</th>
                <th className="py-2 px-3 text-right">Abs % Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTestRecords.slice(0, 30).map((r) => {
                const isUnder = r.residual > 0;
                return (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 font-mono text-slate-500">{r.id}</td>
                    <td className="py-2 px-3 font-medium text-slate-900">{r.neighborhood}</td>
                    <td className="py-2 px-3 font-mono text-right text-slate-700">
                      {r.sqft.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 font-mono text-right font-medium text-slate-900">
                      {formatCurrency(r.actual_price)}
                    </td>
                    <td className="py-2 px-3 font-mono text-right text-slate-700">
                      {formatCurrency(r.predicted_price)}
                    </td>
                    <td
                      className={`py-2 px-3 font-mono text-right font-semibold ${
                        isUnder ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {r.residual >= 0 ? '+' : ''}
                      {formatCurrency(r.residual)}
                    </td>
                    <td className="py-2 px-3 font-mono text-right text-slate-600">
                      {r.pct_error.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
