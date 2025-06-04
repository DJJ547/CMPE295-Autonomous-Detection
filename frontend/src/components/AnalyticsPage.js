import React, { useState, useEffect } from 'react';
import BarChartComponent from './analytics/BarChartComponent';
import LineChartComponent from './analytics/LineChartComponent';
import PieChartComponent from './analytics/PieChartComponent';

const GRAPH_TYPES = ['Bar', 'Line', 'Pie'];
const DATA_TYPES = ['graffiti', 'tent', 'road damage'];

const AnalyticsPage = () => {
  const [graphType, setGraphType] = useState('Bar');
  const [dataType, setDataType] = useState('graffiti');
  const [chartData, setChartData] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    const queryParams = new URLSearchParams({
      type: dataType,
      ...(dateRange.start && { start: dateRange.start }),
      ...(dateRange.end && { end: dateRange.end }),
    });

    fetch(`/api/chart-data?${queryParams.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Error fetching chart data');
        return res.json();
      })
      .then((data) => {
        setChartData(data);
        setError(null);
      })
      .catch((err) => {
        setChartData([]);
        setError(err.message);
      });
  }, [dataType, dateRange, graphType]);

  const renderChart = () => {
    if (!chartData.length) {
      return <p className="text-center text-gray-500">No data available for selected parameters.</p>;
    }

    switch (graphType) {
      case 'Bar': return <BarChartComponent data={chartData} />;
      case 'Line': return <LineChartComponent data={chartData} />;
      case 'Pie': return <PieChartComponent data={chartData} />;
      default: return null;
    }
  };

  return (
    <div className="p-8 bg-gradient-to-b from-blue-50 via-white to-blue-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-center text-blue-700 drop-shadow-md">
        Urban Maintenance Analytics
      </h1>

      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Chart Type</label>
          <select
            value={graphType}
            onChange={(e) => setGraphType(e.target.value)}
            className="border rounded-lg px-3 py-2 w-40 bg-white shadow-sm focus:ring focus:border-blue-500"
          >
            {GRAPH_TYPES.map(type => <option key={type}>{type}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Anomaly Type</label>
          <select
            value={dataType}
            onChange={(e) => setDataType(e.target.value)}
            className="border rounded-lg px-3 py-2 w-40 bg-white shadow-sm focus:ring focus:border-blue-500"
          >
            {DATA_TYPES.map(type => <option key={type}>{type}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            className="border rounded-lg px-3 py-2 w-40 shadow-sm"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            className="border rounded-lg px-3 py-2 w-40 shadow-sm"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
          />
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
        {error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : (
          renderChart()
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
