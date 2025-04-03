import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import data from '../../mock/pie_chart_data.json'; // Ensure this is a valid array

const COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

const PieChartComponent = () => {
  if (!data || !Array.isArray(data)) {
    return <div className="text-red-500">Error: Pie chart data is not loaded.</div>;
  }

  return (
    <div className="bg-white rounded shadow p-4">
      <h2 className="text-xl font-semibold mb-2">Vehicle Type Distribution</h2>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="type" outerRadius={80}>
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChartComponent;
