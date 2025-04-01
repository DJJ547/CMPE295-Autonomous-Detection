import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import barData from '../../mock/bar_chart_data.json';


const BarChartComponent = () => (
  <div className="bg-white rounded shadow p-4">
    <h2 className="text-xl font-semibold mb-2">Vehicle Count per Month</h2>
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data.barData}>
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="vehicles" fill="#4f46e5" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default BarChartComponent;
