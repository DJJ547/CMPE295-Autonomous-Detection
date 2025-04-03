import React from "react";
import Heatmap from "../components/Heatmap";

const Analytics = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "col",
        width: "100%",
        height: "100vh",
        gap: "20px",
      }}
    >
      <div
        style={{
          width: "80%",
          height: "100%",
          border: "1px solid #ccc",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <Heatmap />
      </div>

      <div style={{ width: "30%" }}>
        {/* graphs & charts */}
      </div>
    </div>
  );
};

export default Analytics;
