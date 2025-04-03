import React from "react";
import Heatmap from "../components/Heatmap";
import BarChart from "../components/analytics/BarChart";
import PieChart from "../components/analytics/PieChart";
import LineChart from "../components/analytics/LineChart";

const Analytics = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column", // ✅ fix: stack vertically
        width: "100%",
        height: "100vh",
        gap: "20px",
      }}
    >
      {/* Top: Heatmap section */}
      <div
        style={{
          width: "100%",
          height: "50%",
          border: "1px solid #ccc",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <Heatmap />
      </div>

      {/* Bottom: Charts section */}
      <div
        style={{
          flexGrow: 1,
          padding: "1.5rem",
          overflow: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            width: "100%",
            height: "100%", // optional: to stretch height evenly
          }}
        >
          <div style={{ flex: 1 }}>
            <BarChart />
          </div>
          <div style={{ flex: 1 }}>
            <PieChart />
          </div>
          <div style={{ flex: 1 }}>
            <LineChart />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
