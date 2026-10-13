import React, { useState, useMemo } from 'react';
import { TestEvalRecord, ResidualBin } from '../../types/housing';
import { formatCurrency } from '../../utils/regressionEngine';

interface ResidualPlotProps {
  testRecords: TestEvalRecord[];
  residualHistogram: ResidualBin[];
  rmse: number;
}

export const ResidualPlot: React.FC<ResidualPlotProps> = ({
  testRecords,
  residualHistogram,
  rmse
}) => {
  const [activeTab, setActiveTab] = useState<'actual_vs_pred' | 'residuals' | 'histogram'>('actual_vs_pred');
  const [hoveredPoint, setHoveredPoint] = useState<TestEvalRecord | null>(null);

  // Bounds for Actual vs Predicted
  const boundsActualPred = useMemo(() => {
    const actuals = testRecords.map((r) => r.actual_price);
    const preds = testRecords.map((r) => r.predicted_price);
    const minVal = Math.min(...actuals, ...preds);
    const maxVal = Math.max(...actuals, ...preds);
    const pad = (maxVal - minVal) * 0.05;
    return {
      min: Math.max(0, minVal - pad),
      max: maxVal + pad
    };
  }, [testRecords]);

  // Bounds for Residuals vs Fitted
  const boundsResiduals = useMemo(() => {
    const preds = testRecords.map((r) => r.predicted_price);
    const res = testRecords.map((r) => r.residual);
    const minPred = Math.min(...preds);
    const maxPred = Math.max(...preds);
    const maxAbsRes = Math.max(...res.map((r) => Math.abs(r)));
    const padX = (maxPred - minPred) * 0.05;
    const padY = maxAbsRes * 1.15;
    return {
      minX: Math.max(0, minPred - padX),
      maxX: maxPred + padX,
      minY: -padY,
      maxY: padY
    };
  }, [testRecords]);

  // Max histogram count
  const maxHistCount = useMemo(() => {
    return Math.max(...residualHistogram.map((h) => h.count), 1);
  }, [residualHistogram]);

  const width = 620;
  const height = 340;
  const padding = { top: 25, right: 25, bottom: 45, left: 75 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            Regression Error Diagnostics & Residuals
          </h4>
          <p className="text-xs text-slate-500">
            Validation on N={testRecords.length} hold-out test set · RMSE: ±{formatCurrency(rmse)}
          </p>
        </div>

        {/* Diagnostic Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('actual_vs_pred')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeTab === 'actual_vs_pred'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Actual vs Predicted
          </button>
          <button
            onClick={() => setActiveTab('residuals')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeTab === 'residuals'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Residuals vs Fitted
          </button>
          <button
            onClick={() => setActiveTab('histogram')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeTab === 'histogram'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Error Distribution
          </button>
        </div>
      </div>

      {/* View 1: Actual vs Predicted */}
      {activeTab === 'actual_vs_pred' && (
        <div className="relative w-full aspect-[16/9]">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full select-none"
            onMouseLeave={() => setHoveredPoint(null)}
          >
            {/* Grid & Ticks */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const val = boundsActualPred.min + pct * (boundsActualPred.max - boundsActualPred.min);
              const yPos = padding.top + plotHeight - pct * plotHeight;
              const xPos = padding.left + pct * plotWidth;
              return (
                <g key={`grid-${i}`}>
                  <line
                    x1={padding.left}
                    y1={yPos}
                    x2={width - padding.right}
                    y2={yPos}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                  <line
                    x1={xPos}
                    y1={padding.top}
                    x2={xPos}
                    y2={height - padding.bottom}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={yPos + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#64748b"
                    fontFamily="monospace"
                  >
                    ${Math.round(val / 1000)}k
                  </text>
                  <text
                    x={xPos}
                    y={height - padding.bottom + 16}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#64748b"
                    fontFamily="monospace"
                  >
                    ${Math.round(val / 1000)}k
                  </text>
                </g>
              );
            })}

            {/* Ideal y = x line */}
            <line
              x1={padding.left}
              y1={padding.top + plotHeight}
              x2={padding.left + plotWidth}
              y2={padding.top}
              stroke="#0ea5e9"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* Axes */}
            <line
              x1={padding.left}
              y1={height - padding.bottom}
              x2={width - padding.right}
              y2={height - padding.bottom}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={height - padding.bottom}
              stroke="#cbd5e1"
              strokeWidth="1"
            />

            {/* Labels */}
            <text
              x={padding.left + plotWidth / 2}
              y={height - 10}
              textAnchor="middle"
              fontSize="11"
              fontWeight="500"
              fill="#475569"
            >
              Ground Truth Actual Price ($)
            </text>
            <text
              x={-height / 2}
              y={16}
              transform="rotate(-90)"
              textAnchor="middle"
              fontSize="11"
              fontWeight="500"
              fill="#475569"
            >
              Model Predicted Price ($)
            </text>

            {/* Data points */}
            {testRecords.map((r) => {
              const cx =
                padding.left +
                ((r.actual_price - boundsActualPred.min) /
                  (boundsActualPred.max - boundsActualPred.min || 1)) *
                  plotWidth;
              const cy =
                padding.top +
                plotHeight -
                ((r.predicted_price - boundsActualPred.min) /
                  (boundsActualPred.max - boundsActualPred.min || 1)) *
                  plotHeight;
              const isHovered = hoveredPoint?.id === r.id;

              return (
                <circle
                  key={r.id}
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 3.5}
                  fill={Math.abs(r.residual) > 2 * rmse ? '#f43f5e' : '#3b82f6'}
                  opacity={isHovered ? 1 : 0.65}
                  stroke={isHovered ? '#0f172a' : '#ffffff'}
                  strokeWidth={isHovered ? 2 : 0.75}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredPoint(r)}
                />
              );
            })}
          </svg>

          {/* Hover card */}
          {hoveredPoint && (
            <div className="absolute top-2 right-4 bg-slate-900 text-white rounded-lg p-2.5 text-xs shadow-lg border border-slate-700 pointer-events-none">
              <div className="font-semibold text-sky-400 mb-1">{hoveredPoint.neighborhood}</div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                <span className="text-slate-400">Actual:</span>
                <span className="font-mono text-right">{formatCurrency(hoveredPoint.actual_price)}</span>
                <span className="text-slate-400">Predicted:</span>
                <span className="font-mono text-right">{formatCurrency(hoveredPoint.predicted_price)}</span>
                <span className="text-slate-400">Residual:</span>
                <span className={`font-mono text-right ${hoveredPoint.residual >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {hoveredPoint.residual >= 0 ? '+' : ''}{formatCurrency(hoveredPoint.residual)}
                </span>
                <span className="text-slate-400">Abs Error:</span>
                <span className="font-mono text-right">{hoveredPoint.pct_error.toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View 2: Residuals vs Fitted */}
      {activeTab === 'residuals' && (
        <div className="relative w-full aspect-[16/9]">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full select-none"
            onMouseLeave={() => setHoveredPoint(null)}
          >
            {/* Zero baseline */}
            <line
              x1={padding.left}
              y1={padding.top + plotHeight / 2}
              x2={width - padding.right}
              y2={padding.top + plotHeight / 2}
              stroke="#0f172a"
              strokeWidth="1.5"
            />

            {/* ±1 RMSE band */}
            <line
              x1={padding.left}
              y1={
                padding.top +
                plotHeight -
                ((rmse - boundsResiduals.minY) /
                  (boundsResiduals.maxY - boundsResiduals.minY || 1)) *
                  plotHeight
              }
              x2={width - padding.right}
              y2={
                padding.top +
                plotHeight -
                ((rmse - boundsResiduals.minY) /
                  (boundsResiduals.maxY - boundsResiduals.minY || 1)) *
                  plotHeight
              }
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <line
              x1={padding.left}
              y1={
                padding.top +
                plotHeight -
                ((-rmse - boundsResiduals.minY) /
                  (boundsResiduals.maxY - boundsResiduals.minY || 1)) *
                  plotHeight
              }
              x2={width - padding.right}
              y2={
                padding.top +
                plotHeight -
                ((-rmse - boundsResiduals.minY) /
                  (boundsResiduals.maxY - boundsResiduals.minY || 1)) *
                  plotHeight
              }
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="3 3"
            />

            {/* Labels */}
            <text
              x={width - padding.right - 5}
              y={
                padding.top +
                plotHeight -
                ((rmse - boundsResiduals.minY) /
                  (boundsResiduals.maxY - boundsResiduals.minY || 1)) *
                  plotHeight - 4
              }
              textAnchor="end"
              fontSize="9"
              fill="#64748b"
              fontFamily="monospace"
            >
              +1 RMSE (+${Math.round(rmse / 1000)}k)
            </text>
            <text
              x={width - padding.right - 5}
              y={
                padding.top +
                plotHeight -
                ((-rmse - boundsResiduals.minY) /
                  (boundsResiduals.maxY - boundsResiduals.minY || 1)) *
                  plotHeight + 11
              }
              textAnchor="end"
              fontSize="9"
              fill="#64748b"
              fontFamily="monospace"
            >
              -1 RMSE (-${Math.round(rmse / 1000)}k)
            </text>

            {/* Axes */}
            <line
              x1={padding.left}
              y1={height - padding.bottom}
              x2={width - padding.right}
              y2={height - padding.bottom}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={height - padding.bottom}
              stroke="#cbd5e1"
              strokeWidth="1"
            />

            <text
              x={padding.left + plotWidth / 2}
              y={height - 10}
              textAnchor="middle"
              fontSize="11"
              fontWeight="500"
              fill="#475569"
            >
              Fitted (Predicted) Price ($)
            </text>
            <text
              x={-height / 2}
              y={16}
              transform="rotate(-90)"
              textAnchor="middle"
              fontSize="11"
              fontWeight="500"
              fill="#475569"
            >
              Residual (Actual - Predicted) ($)
            </text>

            {/* Points */}
            {testRecords.map((r) => {
              const cx =
                padding.left +
                ((r.predicted_price - boundsResiduals.minX) /
                  (boundsResiduals.maxX - boundsResiduals.minX || 1)) *
                  plotWidth;
              const cy =
                padding.top +
                plotHeight -
                ((r.residual - boundsResiduals.minY) /
                  (boundsResiduals.maxY - boundsResiduals.minY || 1)) *
                  plotHeight;
              const isHovered = hoveredPoint?.id === r.id;

              return (
                <circle
                  key={r.id}
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 3.5}
                  fill={r.residual >= 0 ? '#10b981' : '#f43f5e'}
                  opacity={isHovered ? 1 : 0.65}
                  stroke={isHovered ? '#0f172a' : '#ffffff'}
                  strokeWidth={isHovered ? 2 : 0.75}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredPoint(r)}
                />
              );
            })}
          </svg>
        </div>
      )}

      {/* View 3: Error Histogram */}
      {activeTab === 'histogram' && (
        <div className="relative w-full aspect-[16/9]">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none">
            {/* Grid */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const yPos = padding.top + plotHeight - pct * plotHeight;
              return (
                <g key={`hist-grid-${i}`}>
                  <line
                    x1={padding.left}
                    y1={yPos}
                    x2={width - padding.right}
                    y2={yPos}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={yPos + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#64748b"
                    fontFamily="monospace"
                  >
                    {Math.round(pct * maxHistCount)}
                  </text>
                </g>
              );
            })}

            {/* Bins */}
            {residualHistogram.map((bin, i) => {
              const binW = plotWidth / residualHistogram.length;
              const binX = padding.left + i * binW;
              const barH = (bin.count / maxHistCount) * plotHeight;
              const barY = padding.top + plotHeight - barH;
              const isZeroCrossing = bin.low <= 0 && bin.high >= 0;

              return (
                <g key={`bin-${i}`}>
                  <rect
                    x={binX + 2}
                    y={barY}
                    width={Math.max(2, binW - 4)}
                    height={barH}
                    fill={isZeroCrossing ? '#3b82f6' : '#64748b'}
                    opacity={0.8}
                    rx="2"
                    className="hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <title>
                      {bin.low >= 0 ? '+' : ''}${Math.round(bin.low / 1000)}k to {bin.high >= 0 ? '+' : ''}${Math.round(bin.high / 1000)}k: {bin.count} houses
                    </title>
                  </rect>
                  <text
                    x={binX + binW / 2}
                    y={barY - 4}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#475569"
                    fontFamily="monospace"
                  >
                    {bin.count > 0 ? bin.count : ''}
                  </text>
                  {i % 3 === 0 && (
                    <text
                      x={binX + binW / 2}
                      y={height - padding.bottom + 16}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#64748b"
                      fontFamily="monospace"
                    >
                      ${Math.round(bin.bin_center / 1000)}k
                    </text>
                  )}
                </g>
              );
            })}

            {/* Axis */}
            <line
              x1={padding.left}
              y1={height - padding.bottom}
              x2={width - padding.right}
              y2={height - padding.bottom}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
            <text
              x={padding.left + plotWidth / 2}
              y={height - 10}
              textAnchor="middle"
              fontSize="11"
              fontWeight="500"
              fill="#475569"
            >
              Residual Error ($ Actual - Predicted)
            </text>
            <text
              x={-height / 2}
              y={20}
              transform="rotate(-90)"
              textAnchor="middle"
              fontSize="11"
              fontWeight="500"
              fill="#475569"
            >
              Frequency (Count)
            </text>
          </svg>
        </div>
      )}

      {/* Footer diagnostic summary */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
          {activeTab === 'actual_vs_pred' && 'Dashed blue line represents 1:1 perfect prediction parity (y = x).'}
          {activeTab === 'residuals' && 'Residuals centered symmetrically around 0 indicate unbiased homoscedastic errors.'}
          {activeTab === 'histogram' && 'Bell-shaped normal distribution confirms standard regression error assumptions.'}
        </span>
        <span className="font-mono text-slate-700">
          Mean Error ≈ $0 · Test RMSE = ${Math.round(rmse).toLocaleString()}
        </span>
      </div>
    </div>
  );
};
