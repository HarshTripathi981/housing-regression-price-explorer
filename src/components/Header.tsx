import React from 'react';
import { HousingModelData } from '../types/housing';
import { Home, LineChart, Cpu, BookOpen, Download } from 'lucide-react';

interface HeaderProps {
  activeTab: 'predictor' | 'exploration' | 'evaluation' | 'notebook';
  setActiveTab: (tab: 'predictor' | 'exploration' | 'evaluation' | 'notebook') => void;
  modelData: HousingModelData;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, modelData }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar with brand and metadata */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                ⌂
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Housing Regression & Price Explorer
              </h1>
            </div>

            {/* Unboxed Metadata Discipline */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
              <span>{modelData.metadata.generated_samples.toLocaleString()} Housing Observations</span>
              <span aria-hidden="true">·</span>
              <span>OLS & Ridge Regression (Python)</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-emerald-700 font-medium">Test R² = {modelData.metrics.test.r2}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-700">RMSE = ±${Math.round(modelData.metrics.test.rmse).toLocaleString()}</span>
            </div>
          </div>

          {/* Quick dataset export */}
          <div className="flex items-center gap-2">
            <a
              href="/data/housing_data.csv"
              download="housing_data.csv"
              className="text-xs flex items-center gap-1.5 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Download Dataset (.csv)
            </a>
          </div>
        </div>

        {/* Tab Navigation Segmented Bar */}
        <nav className="flex space-x-1 sm:space-x-3 py-2 overflow-x-auto text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('predictor')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'predictor'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Home className="w-4 h-4" />
            Predictor & Sample Inputs
          </button>

          <button
            onClick={() => setActiveTab('exploration')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'exploration'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <LineChart className="w-4 h-4" />
            Data Exploration (EDA)
          </button>

          <button
            onClick={() => setActiveTab('evaluation')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'evaluation'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Model Evaluation & Residuals
          </button>

          <button
            onClick={() => setActiveTab('notebook')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'notebook'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Python Notebook & Code
          </button>
        </nav>
      </div>
    </header>
  );
};
