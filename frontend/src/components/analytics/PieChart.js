import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import pieChartData from '../../mock/bar_chart_data.json';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

const PieChartComponent = () => (
  <div className="bg-white rounded shadow p-4">
    <h2 className="text-xl font-semibold mb-2">Vehicle Type Distribution</h2>
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie data={data.pieChartData} dataKey="value" nameKey="type" outerRadius={80}>
          {data.pieChartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

export default PieChartComponent;
