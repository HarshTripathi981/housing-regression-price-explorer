/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import housingModelJson from './data/housingModelData.json';
import { HousingModelData } from './types/housing';
import { Header } from './components/Header';
import { PredictorTab } from './components/tabs/PredictorTab';
import { ExplorationTab } from './components/tabs/ExplorationTab';
import { ModelEvaluationTab } from './components/tabs/ModelEvaluationTab';
import { NotebookTab } from './components/tabs/NotebookTab';

const modelData = housingModelJson as unknown as HousingModelData;

export default function App() {
  const [activeTab, setActiveTab] = useState<'predictor' | 'exploration' | 'evaluation' | 'notebook'>('predictor');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        modelData={modelData}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'predictor' && <PredictorTab modelData={modelData} />}
        {activeTab === 'exploration' && <ExplorationTab modelData={modelData} />}
        {activeTab === 'evaluation' && <ModelEvaluationTab modelData={modelData} />}
        {activeTab === 'notebook' && <NotebookTab modelData={modelData} />}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>Housing Market Regression & Prediction Lab</span>
            <span aria-hidden="true">·</span>
            <span>Trained with Python OLS / Ridge Normal Equations</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>N = 1,000 Transactions</span>
            <span>Test RMSE: ±${Math.round(modelData.metrics.test.rmse).toLocaleString()}</span>
            <span>R²: {modelData.metrics.test.r2}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
