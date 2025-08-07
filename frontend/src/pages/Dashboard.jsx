// Dashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/auth";

import LiveStreamWindow from "../components/LiveStreamWindow";
import InteractiveMap    from "../components/interactiveMap";

const API_BASE = process.env.REACT_APP_LOCALHOST || "http://localhost:8000/";

const Dashboard = () => {
  const { user } = useAuth();
  const isStaff = user?.role === "admin";

  const [carLat, setCarLat]       = useState(null);
  const [carLng, setCarLng]       = useState(null);
  const [markers, setMarkers]     = useState([]);
  const [coordSelect, setCoordSelect] = useState(false);
  const [startLat, setStartLatInput]  = useState("");
  const [startLng, setStartLngInput]  = useState("");
  const [endLat, setEndLatInput]      = useState("");
  const [endLng, setEndLngInput]      = useState("");

  // Fetch all anomalies
  const fetchMarkers = () => {
    axios
      .get(`${API_BASE}api/anomalies`)
      .then((res) => setMarkers(res.data))
      .catch((err) => console.error("Error fetching markers:", err));
  };

  useEffect(() => {
    fetchMarkers();
    const iv = setInterval(fetchMarkers, 5000);
    return () => clearInterval(iv);
  }, []);

  // ─── New handlers ───────────────────────────────────────────────────────────

  const handleDeleteEvent = async (eventId) => {
    try {
      await axios.delete(`${API_BASE}api/anomalies/${eventId}`);
      // refresh map and close any popup if needed
      fetchMarkers();
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      await axios.delete(`${API_BASE}api/anomalies/images/${imageId}`);
      // After deleting an image, refresh markers so the popup updates
      fetchMarkers();
    } catch (err) {
      console.error("Failed to delete image:", err);
    }
  };

  const handleDeleteMetadata = async (metadataId) => {
    try {
      await axios.delete(`${API_BASE}api/anomalies/metadata/${metadataId}`);
      fetchMarkers();
    } catch (err) {
      console.error("Failed to delete metadata:", err);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", gap: 20, height: "92vh" }}>
      <div style={{ flex: 1, border: "1px solid #ccc", borderRadius: 8, overflow: "hidden" }}>
        <InteractiveMap
          carLat={carLat}
          carLng={carLng}
          markers={markers}
          coordSelect={coordSelect}
          setStartLatInput={setStartLatInput}
          setStartLngInput={setStartLngInput}
          setEndLatInput={setEndLatInput}
          setEndLngInput={setEndLngInput}
          onDeleteEvent={handleDeleteEvent}
          onDeleteImage={handleDeleteImage}
          onDeleteMetadata={handleDeleteMetadata}
          isStaff={isStaff}
        />
      </div>

      <div style={{ width: 350 }}>
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
