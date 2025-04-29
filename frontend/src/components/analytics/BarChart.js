import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';
import LoadingSpinner from '../common/LoadingSpinner';

const BarChartComponent = () => {
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/graphs/trends')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch bar chart data');
        }
        return response.json();
      })
      .then(data => setChartData(data))
      .catch(error => setError(error.message));
  }, []);

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!chartData.length) {
    return <LoadingSpinner />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">Monthly Urban Issues Detected</h2>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="issues_detected" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default BarChartComponent;
