import React from 'react';
import BarChartComponent from './analytics/BarChartComponent';
import PieChartComponent from './analytics/PieChartComponent';
import LineChartComponent from './analytics/LineChartComponent';

const AnalyticsPage = () => {
  return (
    <div className="p-8 bg-gradient-to-b from-blue-50 via-white to-blue-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-center text-blue-700 drop-shadow-md">
        Urban Maintenance Analytics
      </h1>

      {/* Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
          <BarChartComponent />
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
          <PieChartComponent />
        </div>

        {/* Line Chart (full width) */}
        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 md:col-span-2">
          <LineChartComponent />
        </div>

      </div>
    </div>
  );
};

export default AnalyticsPage;
