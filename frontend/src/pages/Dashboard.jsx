import React, { useState, useEffect } from "react";
import LiveStreamWindow from "../components/LiveStreamWindow";
import InteractiveMap from "../components/interactiveMap";

const Dashboard = () => {
  const [carLat, setCarLat] = useState(null);
  const [carLng, setCarLng] = useState(null);

  const [markers, setMarkers] = useState([]);

  // Function to fetch markers from the backend
  const fetchMarkers = () => {
    fetch("http://localhost:8000/api/markers")
      .then((response) => response.json())
      .then((data) => {
        setMarkers(data);
      })
      .catch((error) => {
        console.error("Error fetching markers:", error);
      });
  };

  useEffect(() => {
    fetchMarkers();
    const intervalId = setInterval(fetchMarkers, 5000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
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
        <InteractiveMap carLat={carLat} carLng={carLng} markers={markers} />
      </div>

      <div style={{ width: "30%" }}>
        <LiveStreamWindow setCarLat={setCarLat} setCarLng={setCarLng} />
      </div>
    </div>
  );
};

export default Dashboard;
