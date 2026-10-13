import React, { useState, useMemo } from 'react';
import { HouseRecord, Neighborhood } from '../../types/housing';
import { formatCurrency } from '../../utils/regressionEngine';

interface ScatterPlotProps {
  data: HouseRecord[];
  neighborhoods: Neighborhood[];
  xKey: keyof HouseRecord;
  yKey: keyof HouseRecord;
  xLabel: string;
  yLabel: string;
  isCurrencyY?: boolean;
  isCurrencyX?: boolean;
}

export const ScatterPlot: React.FC<ScatterPlotProps> = ({
  data,
  neighborhoods,
  xKey,
  yKey,
  xLabel,
  yLabel,
  isCurrencyY = true,
  isCurrencyX = false
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<HouseRecord | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');

  const filteredData = useMemo(() => {
    if (selectedNeighborhood === 'all') return data;
    return data.filter((d) => d.neighborhood === selectedNeighborhood);
  }, [data, selectedNeighborhood]);

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    neighborhoods.forEach((n) => {
      map[n.name] = n.color;
    });
    return map;
  }, [neighborhoods]);

  // Compute ranges
  const { minX, maxX, minY, maxY, slope, intercept } = useMemo(() => {
    if (filteredData.length === 0) {
      return { minX: 0, maxX: 100, minY: 0, maxY: 100, slope: 0, intercept: 0 };
    }
    const xVals = filteredData.map((d) => Number(d[xKey]));
    const yVals = filteredData.map((d) => Number(d[yKey]));

    const rawMinX = Math.min(...xVals);
    const rawMaxX = Math.max(...xVals);
    const rawMinY = Math.min(...yVals);
    const rawMaxY = Math.max(...yVals);

    const padX = (rawMaxX - rawMinX) * 0.05 || 1;
    const padY = (rawMaxY - rawMinY) * 0.05 || 1;

    // Linear regression fit for trendline: y = m*x + b
    const n = filteredData.length;
    const sumX = xVals.reduce((a, b) => a + b, 0);
    const sumY = yVals.reduce((a, b) => a + b, 0);
    const sumXY = xVals.reduce((acc, x, i) => acc + x * yVals[i], 0);
    const sumXX = xVals.reduce((acc, x) => acc + x * x, 0);

    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
    const b = (sumY - m * sumX) / n;

    return {
      minX: Math.max(0, rawMinX - padX),
      maxX: rawMaxX + padX,
      minY: Math.max(0, rawMinY - padY),
      maxY: rawMaxY + padY,
      slope: m,
      intercept: b
    };
  }, [filteredData, xKey, yKey]);

  // SVG dimensions
  const width = 640;
  const height = 360;
  const padding = { top: 20, right: 30, bottom: 50, left: 70 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const scaleX = (val: number) => {
    return padding.left + ((val - minX) / (maxX - minX || 1)) * plotWidth;
  };

  const scaleY = (val: number) => {
    return padding.top + plotHeight - ((val - minY) / (maxY - minY || 1)) * plotHeight;
  };

  // Trendline endpoints
  const trendX1 = minX;
  const trendY1 = slope * trendX1 + intercept;
  const trendX2 = maxX;
  const trendY2 = slope * trendX2 + intercept;

  // X ticks
  const xTicks = useMemo(() => {
    const ticks = [];
    const step = (maxX - minX) / 5;
    for (let i = 0; i <= 5; i++) {
      ticks.push(minX + i * step);
    }
    return ticks;
  }, [minX, maxX]);

  // Y ticks
  const yTicks = useMemo(() => {
    const ticks = [];
    const step = (maxY - minY) / 5;
    for (let i = 0; i <= 5; i++) {
      ticks.push(minY + i * step);
    }
    return ticks;
  }, [minY, maxY]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            {xLabel} vs {yLabel}
          </h4>
          <p className="text-xs text-slate-500">
            Showing {filteredData.length} records · Trend slope: {slope > 0 ? '+' : ''}
            {slope.toFixed(2)} per unit
          </p>
        </div>

        {/* Neighborhood Filter tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
          <button
            onClick={() => setSelectedNeighborhood('all')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              selectedNeighborhood === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Locations
          </button>
          {neighborhoods.map((n) => (
            <button
              key={n.name}
              onClick={() => setSelectedNeighborhood(n.name)}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                selectedNeighborhood === n.name
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span
                className="inline-block w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: n.color }}
              />
              {n.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full aspect-[16/9]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full select-none"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Grid lines */}
          {yTicks.map((tick, i) => {
            const yPos = scaleY(tick);
            return (
              <g key={`y-grid-${i}`}>
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
                  {isCurrencyY ? `$${Math.round(tick / 1000)}k` : Math.round(tick)}
                </text>
              </g>
            );
          })}

          {xTicks.map((tick, i) => {
            const xPos = scaleX(tick);
            return (
              <g key={`x-grid-${i}`}>
                <line
                  x1={xPos}
                  y1={padding.top}
                  x2={xPos}
                  y2={height - padding.bottom}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={xPos}
                  y={height - padding.bottom + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#64748b"
                  fontFamily="monospace"
                >
                  {isCurrencyX ? `$${Math.round(tick)}` : Math.round(tick).toLocaleString()}
                </text>
              </g>
            );
          })}

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

          {/* Axis Labels */}
          <text
            x={padding.left + plotWidth / 2}
            y={height - 12}
            textAnchor="middle"
            fontSize="11"
            fontWeight="500"
            fill="#475569"
          >
            {xLabel}
          </text>
          <text
            x={-height / 2}
            y={18}
            transform="rotate(-90)"
            textAnchor="middle"
            fontSize="11"
            fontWeight="500"
            fill="#475569"
          >
            {yLabel}
          </text>

          {/* Regression Trendline */}
          <line
            x1={scaleX(trendX1)}
            y1={scaleY(trendY1)}
            x2={scaleX(trendX2)}
            y2={scaleY(trendY2)}
            stroke="#0f172a"
            strokeWidth="2"
            strokeDasharray="4 3"
            opacity="0.75"
          />

          {/* Scatter Points */}
          {filteredData.map((d) => {
            const cx = scaleX(Number(d[xKey]));
            const cy = scaleY(Number(d[yKey]));
            const isHovered = hoveredPoint?.id === d.id;
            const ptColor = colorMap[d.neighborhood] || '#64748b';

            return (
              <circle
                key={d.id}
                cx={cx}
                cy={cy}
                r={isHovered ? 6 : 3.5}
                fill={ptColor}
                opacity={isHovered ? 1 : 0.65}
                stroke={isHovered ? '#0f172a' : '#ffffff'}
                strokeWidth={isHovered ? 2 : 0.75}
                className="transition-all duration-150 cursor-pointer"
                onMouseEnter={() => setHoveredPoint(d)}
              />
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-900 text-white rounded-lg p-2.5 text-xs shadow-xl border border-slate-700"
            style={{
              left: `${Math.min(scaleX(Number(hoveredPoint[xKey])) / (width / 100), 75)}%`,
              top: `${Math.max(10, (scaleY(Number(hoveredPoint[yKey])) / (height / 100)) - 25)}%`
            }}
          >
            <div className="font-semibold text-white flex items-center justify-between gap-3 mb-1">
              <span>{hoveredPoint.neighborhood}</span>
              <span className="text-emerald-400 font-mono">
                {formatCurrency(hoveredPoint.price)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-slate-300">
              <span>Living Area:</span>
              <span className="font-mono text-right">{hoveredPoint.sqft} sq ft</span>
              <span>Bed/Bath:</span>
              <span className="font-mono text-right">
                {hoveredPoint.bedrooms}b / {hoveredPoint.bathrooms}ba
              </span>
              <span>Built / Age:</span>
              <span className="font-mono text-right">{hoveredPoint.year_built} ({hoveredPoint.age}y)</span>
              <span>Condition:</span>
              <span className="font-mono text-right">{hoveredPoint.condition}/10</span>
              <span>Price/sqft:</span>
              <span className="font-mono text-right">${hoveredPoint.price_per_sqft}</span>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 border-t-2 border-dashed border-slate-900" />
          <span>Fitted OLS Trendline</span>
        </div>
        {neighborhoods.map((n) => (
          <div key={n.name} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: n.color }}
            />
            <span>{n.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
