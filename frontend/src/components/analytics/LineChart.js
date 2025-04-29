import React, { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import LoadingSpinner from '../common/LoadingSpinner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

const PieChartComponent = () => {
  const [pieData, setPieData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/graphs/trends')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch pie chart data');
        }
        return response.json();
      })
      .then(data => {
        const formatted = [
          { name: 'Graffiti', value: data.graffiti },
          { name: 'Road Damage', value: data.road_damage },
          { name: 'Encampment', value: data.encampment }
        ];
        setPieData(formatted);
      })
      .catch(error => setError(error.message));
  }, []);

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!pieData.length) {
    return <LoadingSpinner />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">Anomaly Type Distribution</h2>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default PieChartComponent;
