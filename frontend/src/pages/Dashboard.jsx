import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/auth";

import LiveStreamWindow from "../components/LiveStreamWindow";
import InteractiveMap from "../components/interactiveMap";

const Dashboard = () => {
  const { user } = useAuth();
  const isStaff = user?.role === "admin";

  const [carLat, setCarLat] = useState(null);
  const [carLng, setCarLng] = useState(null);
  const [markers, setMarkers] = useState([]);

  // ✅ Coordinate selection mode toggle
  const [coordSelect, setCoordSelect] = useState(false);

  // ✅ State for selected coordinates (optional if you want to display them in UI)
  const [startLat, setStartLatInput] = useState("");
  const [startLng, setStartLngInput] = useState("");
  const [endLat, setEndLatInput] = useState("");
  const [endLng, setEndLngInput] = useState("");

  // ✅ Fetch markers from backend
  const fetchMarkers = () => {
    fetch("http://localhost:8000/api/anomalies")
      .then((response) => response.json())
      .then((data) => setMarkers(data))
      .catch((error) => console.error("Error fetching markers:", error));
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
        height: "92vh",
        gap: "20px",
      }}
    >
      {/* ✅ MAIN MAP */}
      <div
        style={{
          width: "80%",
          height: "100%",
          border: "1px solid #ccc",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <InteractiveMap
          carLat={carLat}
          carLng={carLng}
          markers={markers}
          coordSelect={coordSelect}
          setStartLatInput={setStartLatInput}
          setStartLngInput={setStartLngInput}
          setEndLatInput={setEndLatInput}
          setEndLngInput={setEndLngInput}
        />
      </div>

      {/* ✅ SIDEBAR */}
      <div style={{ width: "30%", display: "flex", flexDirection: "column", gap: "20px" }}>
        <LiveStreamWindow
          setCarLat={setCarLat}
          setCarLng={setCarLng}
          coordSelect={coordSelect}
          setCoordSelect={setCoordSelect}
          startLatInput={startLat}
          setStartLatInput={setStartLatInput}
          startLngInput={startLng}
          setStartLngInput={setStartLngInput}
          endLatInput={endLat}
          setEndLatInput={setEndLatInput}
          endLngInput={endLng}
          setEndLngInput={setEndLngInput}
        />
      </div>
    </div>
  );
};

export default Dashboard;
