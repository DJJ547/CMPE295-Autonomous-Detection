import React from "react";
import Heatmap from "../components/Heatmap";
import ChatWindow from "../components/ChatWindow";
import ChartSection from "./ChartSection";

const Analytics = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column", // ✅ fix: stack vertically
        width: "100%",
        height: "92vh",
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
          overflow: "auto",
          display: "flex",
          gap: "1.5rem",
        flexDirection: "row",
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
        <ChatWindow/>
        </div>
        
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            width: "100%",
            height: "100%", // optional: to stretch height evenly

          }}
        >
          <ChartSection />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
