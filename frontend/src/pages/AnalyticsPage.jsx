// AnalyticsPage.jsx
import React from 'react';
import BarChart from '../components/analytics/BarChart';
import PieChart from '../components/analytics/PieChart';
import LineChart from '../components/analytics/LineChart';

const AnalyticsPage = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold mb-4">Analytics Dashboard</h1>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <BarChart />
      <PieChart />
      <LineChart />
    </div>
  </div>
);

export default AnalyticsPage;
