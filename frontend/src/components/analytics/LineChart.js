import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const LineChartComponent = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <p style={{ textAlign: "center", color: "#6b7280" }}>
        No data available.
      </p>
    );
  }

  return (
    <div style={{ width: "100%", height: "400px" }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="count" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChartComponent;
