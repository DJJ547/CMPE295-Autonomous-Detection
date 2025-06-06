import React, { useState } from "react";
import Heatmap from "../components/Heatmap";
import ChatWindow from "../components/ChatWindow";
import ChartSection from "./ChartSection";

const Analytics = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "92vh",
        gap: "20px",
        position: "relative", // so floating button positions properly
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
            height: "100%",
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

      {/* Floating Chat Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          fontSize: "24px",
          cursor: "pointer",
          boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
          zIndex: 1000,
        }}
        title="Open Chat"
      >
        💬
      </button>

      {/* Chat Window */}
      {isChatOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "80px",
            right: "20px",
            width: "350px",
            height: "400px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            borderRadius: "10px",
            overflow: "hidden",
            zIndex: 999,
            backgroundColor: "white",
          }}
        >
          <ChatWindow />
        </div>
      )}
    </div>
  );
};

export default Analytics;
