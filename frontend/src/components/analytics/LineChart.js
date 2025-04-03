import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';

import data from '../../mock/line_chart_data.json';

const LineChartComponent = () => {
  if (!data || !Array.isArray(data)) {
    return <div className="text-red-500">Error: Line chart data is not loaded.</div>;
  }

  return (
    <div className="bg-white rounded shadow p-4">
      <h2 className="text-xl font-semibold mb-2">Anomalies Detected (Daily)</h2>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="anomalies" stroke="#f97316" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChartComponent;
