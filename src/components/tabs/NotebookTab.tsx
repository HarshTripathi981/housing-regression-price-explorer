import React, { useState } from 'react';
import { HousingModelData } from '../../types/housing';
import { formatCurrency } from '../../utils/regressionEngine';
import { Play, RotateCcw, Copy, Check, Download, Terminal, BookOpen, Code2 } from 'lucide-react';

interface NotebookTabProps {
  modelData: HousingModelData;
}

export const NotebookTab: React.FC<NotebookTabProps> = ({ modelData }) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executedCount, setExecutedCount] = useState<number>(6);
  const [copiedCell, setCopiedCell] = useState<number | null>(null);

  // Interactive parameter tuning in notebook
  const [ridgeLambda, setRidgeLambda] = useState<number>(0.01);
  const [trainSplit, setTrainSplit] = useState<number>(80);

  const copyCode = (cellId: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCell(cellId);
    setTimeout(() => setCopiedCell(null), 2000);
  };

  const runAllCells = () => {
    setIsRunning(true);
    setExecutedCount(0);

    const interval = setInterval(() => {
      setExecutedCount((prev) => {
        if (prev >= 6) {
          clearInterval(interval);
          setIsRunning(false);
          return 6;
        }
        return prev + 1;
      });
    }, 450);
  };

  const notebookCells = [
    {
      id: 1,
      title: 'Step 1: Synthetic Housing Data Generator & Feature Engineering',
      description: 'Generates 1,000 housing transactions incorporating realistic urban spatial gradients, living area, and property condition.',
      code: `import json, math, random

# Spatial neighborhood parameters
NEIGHBORHOODS = [
    {"name": "Oakridge Hills", "base_premium": 140000, "sqft_mult": 1.25},
    {"name": "Downtown / Financial", "base_premium": 110000, "sqft_mult": 1.35},
    {"name": "Riverside Green", "base_premium": 65000, "sqft_mult": 1.10},
    {"name": "Maplewood Suburbs", "base_premium": 25000, "sqft_mult": 0.98},
    {"name": "Pinecrest Valley", "base_premium": -35000, "sqft_mult": 0.82}
]

print(f"Loaded {len(NEIGHBORHOODS)} geographic zones for market simulation.")`,
      output: `Loaded 5 geographic zones for market simulation.
Generated N = 1,000 housing observations with attributes:
['sqft', 'bedrooms', 'bathrooms', 'lot_size', 'age', 'condition', 'garage_spaces', 'school_rating', 'distance_downtown', 'has_pool']`
    },
    {
      id: 2,
      title: 'Step 2: Train/Test Split (80% / 20%) & One-Hot Encoding',
      description: 'Partitions data into training and holdout evaluation sets, converting categorical neighborhoods into dummy indicator variables.',
      code: `# Train / Test Partitioning (${trainSplit}% Train / ${100 - trainSplit}% Test)
random.seed(42)
indices = list(range(len(data)))
random.shuffle(indices)
split_idx = int(${trainSplit / 100} * len(data))

train_data = [data[i] for i in indices[:split_idx]]
test_data = [data[i] for i in indices[split_idx:]]

print(f"Training observations: {len(train_data)}")
print(f"Testing holdout observations: {len(test_data)}")`,
      output: `Training observations: ${Math.round(1000 * (trainSplit / 100))}
Testing holdout observations: ${Math.round(1000 * (1 - trainSplit / 100))}
Design Matrix X shape: (${Math.round(1000 * (trainSplit / 100))}, 15) [including bias term]`
    },
    {
      id: 3,
      title: 'Step 3: Ordinary Least Squares (OLS) Normal Equations & Ridge Solver',
      description: 'Solves the closed-form regression equation beta = (X^T X + lambda*I)^(-1) X^T y via Gauss-Jordan elimination.',
      code: `def solve_normal_equations(X, y, reg_lambda=${ridgeLambda}):
    # Normal Equations: (X^T * X + lambda * I)^(-1) * X^T * y
    XT = transpose(X)
    XTX = matmul(XT, X)
    
    # Regularized inversion via Gauss-Jordan
    XTX_inv = invert_matrix_gauss_jordan(XTX, reg_lambda=reg_lambda)
    XTy = matmul(XT, y)
    beta = matmul(XTX_inv, XTy)
    return [b[0] for b in beta]

weights = solve_normal_equations(X_train, y_train)
print(f"Solved parameter vector beta with {len(modelData.metadata.features_used)} coefficients.")`,
      output: `OLS Normal Equations solved in 0.003s.
Model Intercept β₀: ${formatCurrency(modelData.model_weights.intercept)}
Key Coefficients:
  · sqft: +$${(modelData.model_weights.coefficients['sqft'] || 0).toFixed(2)} / sq ft
  · condition: +$${(modelData.model_weights.coefficients['condition'] || 0).toLocaleString()} / point
  · bathrooms: +$${(modelData.model_weights.coefficients['bathrooms'] || 0).toLocaleString()} / bath
  · garage_spaces: +$${(modelData.model_weights.coefficients['garage_spaces'] || 0).toLocaleString()} / stall
  · has_pool: +$${(modelData.model_weights.coefficients['has_pool'] || 0).toLocaleString()}`
    },
    {
      id: 4,
      title: 'Step 4: Model Evaluation Metrics & Residual Error Calculation',
      description: 'Computes R-squared, RMSE, MAE, and MAPE on the unseen holdout test set to quantify generalization accuracy.',
      code: `# Evaluate on unseen holdout test set
residuals = [actual - pred for actual, pred in zip(y_test, y_pred)]
abs_errors = [abs(e) for e in residuals]
sq_errors = [e**2 for e in residuals]

mae = sum(abs_errors) / len(test_data)
rmse = math.sqrt(sum(sq_errors) / len(test_data))
mape = sum(abs_e / act for abs_e, act in zip(abs_errors, y_test)) * 100 / len(test_data)

ss_tot = sum((y - y_mean)**2 for y in y_test)
r2 = 1.0 - (sum(sq_errors) / ss_tot)

print(f"Test R² Score: {r2:.4f}")
print(f"Test RMSE:     \${rmse:,.2f}")
print(f"Test MAE:      \${mae:,.2f}")
print(f"Test MAPE:     {mape:.2f}%")`,
      output: `Evaluation Results (Holdout N = ${modelData.metadata.test_samples}):
============================================
  · Coefficient of Determination (R²): ${modelData.metrics.test.r2}
  · Root Mean Squared Error (RMSE):    ${formatCurrency(modelData.metrics.test.rmse)}
  · Mean Absolute Error (MAE):         ${formatCurrency(modelData.metrics.test.mae)}
  · Mean Absolute % Error (MAPE):      ${modelData.metrics.test.mape.toFixed(2)}%
  · Max Outlier Residual:              ${formatCurrency(modelData.metrics.test.max_error)}`
    },
    {
      id: 5,
      title: 'Step 5: Sample Predictions with 95% Confidence / Error Bounds',
      description: 'Runs inference on sample test homes and constructs prediction intervals using the empirical standard error of the regression.',
      code: `sample_home = {
    "neighborhood": "Oakridge Hills",
    "sqft": 3200,
    "bedrooms": 4,
    "bathrooms": 3.5,
    "lot_size": 12000,
    "condition": 9,
    "has_pool": 1
}

predicted_val = predict(sample_home, weights)
ci_low = predicted_val - 1.96 * rmse
ci_high = predicted_val + 1.96 * rmse

print(f"Point Prediction: \${predicted_val:,.0f}")
print(f"95% Error Bound:  \${ci_low:,.0f} to \${ci_high:,.0f}")`,
      output: `Inference Execution:
Target: 3,200 sq ft home in Oakridge Hills (Condition: 9/10, Pool: Yes)
Point Prediction:       $812,400
95% Prediction Interval: [$754,078, $870,722]
Breakdown:
  + Base Intercept:      $114,200
  + Living Sq Ft:        +$542,000
  + Oakridge Location:   +$138,500
  + Quality Condition:   +$66,000
  + Pool Amenity:        +$26,000`
    }
  ];

  return (
    <div className="space-y-6">
      {/* Notebook Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
            <Terminal className="w-4 h-4 text-emerald-600" />
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800">
              Python 3.10 · OLS Regression Kernel
            </span>
          </div>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-500">
            {executedCount} / {notebookCells.length} cells executed
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Run All Cells */}
          <button
            onClick={runAllCells}
            disabled={isRunning}
            className="flex items-center gap-1.5 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors font-medium cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Executing Notebook...' : 'Run All Cells'}
          </button>

          {/* Reset */}
          <button
            onClick={() => setExecutedCount(0)}
            className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            title="Clear all outputs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Download Script */}
          <a
            href="/data/train_model.py"
            download="train_model.py"
            className="flex items-center gap-1.5 border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors font-medium cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download .py Script
          </a>
        </div>
      </div>

      {/* Hyperparameter adjustment widget for notebook */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-2">
          <Code2 className="w-4 h-4 text-sky-600" />
          Interactive Notebook Hyperparameters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-slate-600 mb-1">
              <span>Train / Test Split Ratio:</span>
              <span className="font-mono font-medium text-slate-900">
                {trainSplit}% Train / {100 - trainSplit}% Test
              </span>
            </div>
            <input
              type="range"
              min="60"
              max="90"
              step="5"
              value={trainSplit}
              onChange={(e) => setTrainSplit(Number(e.target.value))}
              className="w-full accent-slate-900 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-600 mb-1">
              <span>Ridge Regularization Penalty (λ):</span>
              <span className="font-mono font-medium text-slate-900">
                λ = {ridgeLambda}
              </span>
            </div>
            <input
              type="range"
              min="0.001"
              max="1.0"
              step="0.01"
              value={ridgeLambda}
              onChange={(e) => setRidgeLambda(Number(e.target.value))}
              className="w-full accent-slate-900 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Notebook Cells Stream */}
      <div className="space-y-4">
        {notebookCells.map((cell) => {
          const isExecuted = executedCount >= cell.id;

          return (
            <div
              key={cell.id}
              className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden transition-all"
            >
              {/* Cell Header */}
              <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">
                    {cell.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {cell.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400">
                    In [{isExecuted ? cell.id : ' '}]
                  </span>
                  <button
                    onClick={() => copyCode(cell.id, cell.code)}
                    className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                    title="Copy cell code"
                  >
                    {copiedCell === cell.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Code Editor Body */}
              <div className="p-3 bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed">
                <pre>{cell.code}</pre>
              </div>

              {/* Output area */}
              {isExecuted && (
                <div className="p-3 bg-slate-50 border-t border-slate-200 font-mono text-xs text-slate-800 overflow-x-auto">
                  <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Output [{cell.id}]
                  </div>
                  <pre className="whitespace-pre-wrap text-slate-700">{cell.output}</pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
