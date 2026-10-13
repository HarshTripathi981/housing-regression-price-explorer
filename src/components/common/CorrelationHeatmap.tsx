import React, { useState } from 'react';

interface CorrelationHeatmapProps {
  matrix: Record<string, Record<string, number>>;
}

const FEATURE_LABELS: Record<string, string> = {
  sqft: 'Living Sq Ft',
  bedrooms: 'Bedrooms',
  bathrooms: 'Bathrooms',
  lot_size: 'Lot Size',
  age: 'Property Age',
  condition: 'Condition Rating',
  school_rating: 'School Rating',
  distance_downtown: 'Distance to CBD',
  price: 'Final Price'
};

export const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({ matrix }) => {
  const [selectedCell, setSelectedCell] = useState<{
    row: string;
    col: string;
    val: number;
  } | null>(null);

  const features = Object.keys(matrix);

  const getColor = (val: number) => {
    if (val === 1) return 'bg-emerald-600 text-white';
    if (val > 0.7) return 'bg-emerald-500 text-white';
    if (val > 0.4) return 'bg-emerald-300 text-emerald-950';
    if (val > 0.15) return 'bg-emerald-100 text-emerald-900';
    if (val >= -0.15 && val <= 0.15) return 'bg-slate-100 text-slate-700';
    if (val >= -0.4) return 'bg-rose-100 text-rose-900';
    if (val >= -0.7) return 'bg-rose-300 text-rose-950';
    return 'bg-rose-500 text-white';
  };

  const getInterpretation = (row: string, col: string, val: number) => {
    if (row === col) return 'Perfect self-correlation (1.00)';
    const rLabel = FEATURE_LABELS[row] || row;
    const cLabel = FEATURE_LABELS[col] || col;

    if (Math.abs(val) > 0.7) {
      return `Strong ${val > 0 ? 'positive' : 'negative'} relationship between ${rLabel} and ${cLabel}. Changes in one strongly track the other.`;
    } else if (Math.abs(val) > 0.35) {
      return `Moderate ${val > 0 ? 'positive' : 'negative'} correlation. Indicates meaningful predictive power in regression.`;
    } else {
      return `Weak or near-zero linear correlation between ${rLabel} and ${cLabel}.`;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            Pearson Correlation Matrix (r)
          </h4>
          <p className="text-xs text-slate-500">
            Measures bivariate linear dependency between housing attributes and sales price
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-rose-500 rounded-xs inline-block" /> -1.0
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-slate-100 rounded-xs inline-block border border-slate-200" /> 0.0
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-emerald-500 rounded-xs inline-block" /> +1.0
          </span>
        </div>
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="p-1.5 text-left font-medium text-slate-400"></th>
              {features.map((feat) => (
                <th
                  key={`th-${feat}`}
                  className="p-1.5 text-center font-medium text-slate-600 truncate max-w-[70px]"
                  title={FEATURE_LABELS[feat] || feat}
                >
                  <span className="block truncate">
                    {(FEATURE_LABELS[feat] || feat).split(' ')[0]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((rowFeat) => (
              <tr key={`tr-${rowFeat}`}>
                <td className="p-1.5 text-right font-medium text-slate-700 whitespace-nowrap pr-2">
                  {FEATURE_LABELS[rowFeat] || rowFeat}
                </td>
                {features.map((colFeat) => {
                  const val = matrix[rowFeat]?.[colFeat] ?? 0;
                  const isHighlighted =
                    selectedCell?.row === rowFeat && selectedCell?.col === colFeat;
                  return (
                    <td
                      key={`td-${rowFeat}-${colFeat}`}
                      onClick={() =>
                        setSelectedCell({ row: rowFeat, col: colFeat, val })
                      }
                      className="p-0.5"
                    >
                      <button
                        type="button"
                        className={`w-full h-8 flex items-center justify-center font-mono rounded transition-all cursor-pointer ${getColor(
                          val
                        )} ${
                          isHighlighted ? 'ring-2 ring-slate-900 scale-105 z-10' : ''
                        }`}
                        title={`${FEATURE_LABELS[rowFeat]} × ${FEATURE_LABELS[colFeat]}: ${val.toFixed(2)}`}
                      >
                        {val === 1 ? '1.0' : val.toFixed(2)}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected Cell Detail Callout */}
      {selectedCell ? (
        <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between gap-3">
          <div>
            <span className="font-semibold text-slate-900">
              {FEATURE_LABELS[selectedCell.row]} × {FEATURE_LABELS[selectedCell.col]}:
            </span>{' '}
            <span className="text-slate-600">
              {getInterpretation(selectedCell.row, selectedCell.col, selectedCell.val)}
            </span>
          </div>
          <span className="font-mono font-bold text-slate-900 px-2 py-0.5 bg-white border border-slate-200 rounded">
            r = {selectedCell.val > 0 ? '+' : ''}
            {selectedCell.val.toFixed(3)}
          </span>
        </div>
      ) : (
        <div className="mt-2 text-center text-xs text-slate-400">
          Click any matrix cell above to inspect the bivariate correlation analysis.
        </div>
      )}
    </div>
  );
};
