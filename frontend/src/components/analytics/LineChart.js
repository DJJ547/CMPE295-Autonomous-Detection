import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import data from '../../mock_data.json';

const LineChartComponent = () => (
  <div className="bg-white rounded shadow p-4">
    <h2 className="text-xl font-semibold mb-2">Anomalies Detected (Daily)</h2>
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data.lineChartData}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="anomalies" stroke="#f97316" />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default LineChartComponent;
