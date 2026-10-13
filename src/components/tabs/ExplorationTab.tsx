import React, { useState, useMemo } from 'react';
import { HousingModelData, HouseRecord } from '../../types/housing';
import { ScatterPlot } from '../common/ScatterPlot';
import { CorrelationHeatmap } from '../common/CorrelationHeatmap';
import { formatCurrency } from '../../utils/regressionEngine';
import { ArrowUpDown, Download, Search, MapPin, Maximize2, Building2 } from 'lucide-react';

interface ExplorationTabProps {
  modelData: HousingModelData;
}

export const ExplorationTab: React.FC<ExplorationTabProps> = ({ modelData }) => {
  const { neighborhoods } = modelData.metadata;
  const rawData = modelData.raw_data_sample;
  const neighStats = modelData.neighborhood_statistics;

  // Scatter plot controls
  const [selectedXFeat, setSelectedXFeat] = useState<keyof HouseRecord>('sqft');
  const [selectedYFeat, setSelectedYFeat] = useState<keyof HouseRecord>('price');

  // Table filtering and sorting
  const [tableSearch, setTableSearch] = useState<string>('');
  const [tableNeighborhood, setTableNeighborhood] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof HouseRecord>('price');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const pageSize = 12;

  // Filtered & Sorted Table Records
  const tableRecords = useMemo(() => {
    let result = [...rawData];

    if (tableNeighborhood !== 'all') {
      result = result.filter((r) => r.neighborhood === tableNeighborhood);
    }

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      result = result.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.neighborhood.toLowerCase().includes(q) ||
          r.sqft.toString().includes(q) ||
          r.price.toString().includes(q)
      );
    }

    result.sort((a, b) => {
      const valA = Number(a[sortField]);
      const valB = Number(b[sortField]);
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  }, [rawData, tableNeighborhood, tableSearch, sortField, sortDirection]);

  const totalPages = Math.ceil(tableRecords.length / pageSize) || 1;
  const paginatedRecords = tableRecords.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (field: keyof HouseRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const featureOptions: Array<{ key: keyof HouseRecord; label: string }> = [
    { key: 'sqft', label: 'Living Area (Sq Ft)' },
    { key: 'lot_size', label: 'Lot Size (Sq Ft)' },
    { key: 'condition', label: 'Condition Score (1-10)' },
    { key: 'age', label: 'Property Age (Years)' },
    { key: 'school_rating', label: 'School Rating (1-10)' },
    { key: 'distance_downtown', label: 'Distance to CBD (Miles)' },
    { key: 'bathrooms', label: 'Number of Bathrooms' },
    { key: 'bedrooms', label: 'Number of Bedrooms' }
  ];

  return (
    <div className="space-y-6">
      {/* Section 1: Feature vs Price Relationships (Scatter Plot) */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Feature vs. Price Relationships
            </h3>
            <p className="text-xs text-slate-500">
              Visualize bivariate distributions and examine how size, quality, and location influence pricing
            </p>
          </div>

          {/* Axis controls */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">X-Axis:</span>
            <select
              value={selectedXFeat}
              onChange={(e) => setSelectedXFeat(e.target.value as keyof HouseRecord)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-900 font-medium focus:outline-slate-900 cursor-pointer"
            >
              {featureOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>

            <span className="text-slate-500 font-medium ml-2">Y-Axis:</span>
            <select
              value={selectedYFeat}
              onChange={(e) => setSelectedYFeat(e.target.value as keyof HouseRecord)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-900 font-medium focus:outline-slate-900 cursor-pointer"
            >
              <option value="price">Total Price ($)</option>
              <option value="price_per_sqft">Price / Sq Ft ($/sqft)</option>
            </select>
          </div>
        </div>

        <ScatterPlot
          data={rawData}
          neighborhoods={neighborhoods}
          xKey={selectedXFeat}
          yKey={selectedYFeat}
          xLabel={featureOptions.find((f) => f.key === selectedXFeat)?.label || selectedXFeat}
          yLabel={selectedYFeat === 'price' ? 'Total Selling Price ($)' : 'Price per Living Sq Ft ($/sqft)'}
          isCurrencyY={true}
        />
      </div>

      {/* Section 2: Location & Neighborhood Comparisons */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-sky-600" />
              Location & Spatial Price Drivers
            </h3>
            <p className="text-xs text-slate-500">
              Location creates baseline premiums and modulates the marginal value per square foot
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {neighborhoods.map((n) => {
            const stats = neighStats[n.name] || {
              avg_price: 0,
              median_price: 0,
              avg_sqft: 0,
              avg_price_per_sqft: 0,
              count: 0
            };
            return (
              <div
                key={n.name}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: n.color }}
                    />
                    <span className="text-xs font-semibold text-slate-900 truncate">
                      {n.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-2 mb-2">
                    {n.description}
                  </p>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-200/60 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-[11px]">Avg Price:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {formatCurrency(stats.avg_price)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-[11px]">Avg $/sqft:</span>
                    <span className="font-mono font-medium text-sky-700">
                      ${stats.avg_price_per_sqft}/sqft
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-[11px]">Avg Size:</span>
                    <span className="font-mono text-slate-700">
                      {stats.avg_sqft.toLocaleString()} sq ft
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Pearson Correlation Matrix */}
      <div>
        <CorrelationHeatmap matrix={modelData.correlation_matrix} />
      </div>

      {/* Section 4: Filterable Housing Data Records Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-700" />
              Housing Dataset Records
            </h3>
            <p className="text-xs text-slate-500">
              Explore individual housing observations, attributes, and valuations
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search ID, price, size..."
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-slate-900 w-44"
              />
            </div>

            {/* Neighborhood filter */}
            <select
              value={tableNeighborhood}
              onChange={(e) => {
                setTableNeighborhood(e.target.value);
                setPage(1);
              }}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-900 focus:outline-slate-900 cursor-pointer"
            >
              <option value="all">All Neighborhoods</option>
              {neighborhoods.map((n) => (
                <option key={n.name} value={n.name}>
                  {n.name}
                </option>
              ))}
            </select>

            {/* Download CSV */}
            <a
              href="/data/housing_data.csv"
              download="housing_data.csv"
              className="text-xs flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV
            </a>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-medium">
                <th
                  onClick={() => toggleSort('id')}
                  className="py-2 px-3 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    ID <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('neighborhood')}
                  className="py-2 px-3 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    Neighborhood <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('sqft')}
                  className="py-2 px-3 cursor-pointer hover:text-slate-900 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    Living Sq Ft <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('bedrooms')}
                  className="py-2 px-3 cursor-pointer hover:text-slate-900 text-center"
                >
                  Bed / Bath
                </th>
                <th
                  onClick={() => toggleSort('year_built')}
                  className="py-2 px-3 cursor-pointer hover:text-slate-900 text-center"
                >
                  Built
                </th>
                <th
                  onClick={() => toggleSort('condition')}
                  className="py-2 px-3 cursor-pointer hover:text-slate-900 text-center"
                >
                  Condition
                </th>
                <th
                  onClick={() => toggleSort('price_per_sqft')}
                  className="py-2 px-3 cursor-pointer hover:text-slate-900 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    $/Sq Ft <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('price')}
                  className="py-2 px-3 cursor-pointer hover:text-slate-900 text-right"
                >
                  <div className="flex items-center justify-end gap-1 font-semibold text-slate-900">
                    Sales Price <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-slate-500 font-medium">
                    {r.id}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-900">
                    {r.neighborhood}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-right text-slate-700">
                    {r.sqft.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-600">
                    {r.bedrooms}b / {r.bathrooms}ba
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                    {r.year_built}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-mono text-slate-800 font-medium">
                      {r.condition}/10
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-right text-slate-600">
                    ${r.price_per_sqft}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-right text-slate-900">
                    {formatCurrency(r.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Showing {(page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, tableRecords.length)} of {tableRecords.length} records
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <span className="font-mono text-slate-700">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
