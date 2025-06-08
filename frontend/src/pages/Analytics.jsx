import React from "react";
import Heatmap from "../components/Heatmap";
import ChatWindow from "../components/ChatWindow";
import ChartSection from "./ChartSection";

const Analytics = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "92vh",
        gap: "20px",
      }}
    >
      {/* Top: Heatmap and ChatWindow side by side */}
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "50%", // Top half
          gap: "1.5rem",
        }}
      >
        {/* Heatmap: 2/3 width */}
        <div
          style={{
            width: "66.66%",
            height: "100%",
            border: "1px solid #ccc",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <Heatmap />
        </div>

        {/* ChatWindow: 1/3 width */}
        <div
          style={{
            width: "33.33%",
            height: "100%",
            border: "1px solid #ccc",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <ChatWindow />
        </div>
      </div>

      {/* Bottom: ChartSection full width */}
      <div
        style={{
          width: "100%",
          height: "50%", // Bottom half
          border: "1px solid #ccc",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <ChartSection />
      </div>
    </div>
  );
};


export default Analytics;