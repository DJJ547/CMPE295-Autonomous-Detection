import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import LiveStreamWindow from "../components/LiveStreamWindow";
// import Heatmap from "./HeatmapPage";
import InteractiveMap from "../components/interactiveMap";

const Dashboard = () => {
  const [carLat, setCarLat] = useState(null);
  const [carLng, setCarLng] = useState(null);

  const [markers, setMarkers] = useState([]);

  // Function to fetch markers from the backend
  const fetchMarkers = () => {
    fetch("http://localhost:8000/api/markers") // Replace with your backend URL
      .then((response) => response.json())
      .then((data) => {
        setMarkers(data);
      })
      .catch((error) => {
        console.error("Error fetching markers:", error);
      });
  };

  useEffect(() => {
    // Fetch markers immediately on mount
    fetchMarkers();

    // Set up polling: Fetch markers every 5 seconds (5000 ms)
    const intervalId = setInterval(fetchMarkers, 5000);

    // Cleanup: Clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Dashboard</h1>

      {/* Flex row container for side-by-side layout */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          height: "100vh",
          gap: "20px",
        }}
      >
        {/* Left side: Google Map */}

        <div
          style={{
            width: "100%",
            height: "100%",
            border: "1px solid #ccc",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <InteractiveMap carLat={carLat} carLng={carLng} markers={markers} />
        </div>

        {/* Right side: Live Stream */}
        <div style={{ width: "30%" }}>
          <LiveStreamWindow setCarLat={setCarLat} setCarLng={setCarLng} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
