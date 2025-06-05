import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { motion } from "framer-motion";

const BarChartComponent = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <p style={{ textAlign: "center", color: "#6b7280" }}>
        No data available.
      </p>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: "600",
          marginBottom: "1rem",
          color: "#374151",
        }}
      >
        Anomaly Detection Summary
      </h2>
      <div style={{ width: "100%", height: "250px" }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default BarChartComponent;

