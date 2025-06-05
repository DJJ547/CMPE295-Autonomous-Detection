import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1"];

const PieChartComponent = ({ data }) => {
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
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="date"
            cx="50%"
            cy="50%"
            outerRadius={150}
            label
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
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
