import React, { useEffect, useState } from 'react';
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
import { motion } from 'framer-motion';
import LoadingSpinner from '../common/loadspinner';

const LineChartComponent = () => {
  const [lineData, setLineData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/graphs/trends')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch line chart data');
        }
        return response.json();
      })
      .then(data => setLineData(data))
      .catch(error => setError(error.message));
  }, []);

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!lineData.length) {
    return <LoadingSpinner />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">Monthly Trend of Anomalies</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={lineData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="issues_detected" stroke="#8884d8" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default LineChartComponent;
