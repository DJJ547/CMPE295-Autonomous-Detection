// Dashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/auth";
import { Card, Statistic } from "semantic-ui-react";

import LiveStreamWindow from "../components/LiveStreamWindow";
import InteractiveMap from "../components/interactiveMap";

const API_BASE = process.env.REACT_APP_LOCALHOST || "http://localhost:8000/";

const Dashboard = () => {
  const { user } = useAuth();
  const isStaff = user?.role === "admin";

  // ─── map & pick state ───────────────────────────────────
  const [carLat, setCarLat] = useState(null);
  const [carLng, setCarLng] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [coordSelect, setCoordSelect] = useState(false);
  const [startLat, setStartLatInput] = useState("");
  const [startLng, setStartLngInput] = useState("");
  const [endLat, setEndLatInput] = useState("");
  const [endLng, setEndLngInput] = useState("");

  // ─── stats state ────────────────────────────────────────
  const [stats, setStats] = useState({
    road_damage: 0,
    graffiti: 0,
    tent: 0,
  });

  // ─── fetchers ───────────────────────────────────────────
  const fetchMarkers = () =>
    axios
      .get(`${API_BASE}api/anomalies`)
      .then(res => setMarkers(res.data))
      .catch(e => console.error("Error fetching markers:", e));

  const fetchStats = () =>
    axios
      .get(`${API_BASE}api/anomalies/stats`)
      .then(res => {
        console.log("Fetched stats:", res.data);
        setStats(res.data);
      })
      .catch(e => console.error("Error fetching stats:", e));

  useEffect(() => {
    fetchMarkers();
    fetchStats();
    const iv = setInterval(() => {
      fetchMarkers();
      fetchStats();
    }, 5000);
    return () => clearInterval(iv);
  }, []);


  useEffect(() => {
    fetchMarkers();
    fetchStats();
    const iv = setInterval(() => {
      fetchMarkers();
      fetchStats();
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  // ─── delete handlers ────────────────────────────────────
  const handleDeleteEvent = async id => {
    try {
      await axios.delete(`${API_BASE}api/anomalies/${id}`);
      await fetchMarkers();
      await fetchStats();
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
  };

  const handleDeleteImage = async id => {
    try {
      await axios.delete(`${API_BASE}api/anomalies/images/${id}`);
      await fetchMarkers();
      await fetchStats();
    } catch (err) {
      console.error("Failed to delete image:", err);
    }
  };

  const handleDeleteMetadata = async id => {
    try {
      await axios.delete(`${API_BASE}api/anomalies/metadata/${id}`);
      await fetchMarkers();
      await fetchStats();
    } catch (err) {
      console.error("Failed to delete metadata:", err);
    }
  };

  return (
    <div style={{ display: "flex", gap: 20, height: "92vh" }}>
      <div
        style={{
          flex: 1,
          position: "relative",
          border: "1px solid #ccc",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {/* ── Overlayed Cards ── */}
        <Card.Group
          itemsPerRow={3}
          stackable
          centered
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1001,
            margin: 0,
            width: "auto",
          }}
        >
          <Card style={{ backgroundColor: "#db2828", color: "black" }}>
            <Card.Content textAlign="center" style={{ color: "black" }}>
              <Statistic size="tiny">
                <Statistic.Value style={{ color: "black" }}>
                  {stats.road_damage}
                </Statistic.Value>
                <Statistic.Label style={{ color: "black" }}>
                  Road Damage
                </Statistic.Label>
              </Statistic>
            </Card.Content>
          </Card>
          <Card style={{ backgroundColor: "#f2711c", color: "black" }}>
            <Card.Content textAlign="center" style={{ color: "black" }}>
              <Statistic size="tiny">
                <Statistic.Value style={{ color: "black" }}>
                  {stats.graffiti}
                </Statistic.Value>
                <Statistic.Label style={{ color: "black" }}>
                  Graffiti
                </Statistic.Label>
              </Statistic>
            </Card.Content>
          </Card>
          <Card style={{ backgroundColor: "#00b5ad", color: "black" }}>
            <Card.Content textAlign="center" style={{ color: "black" }}>
              <Statistic size="tiny">
                <Statistic.Value style={{ color: "black" }}>
                  {stats.tent}
                </Statistic.Value>
                <Statistic.Label style={{ color: "black" }}>
                  Tents
                </Statistic.Label>
              </Statistic>
            </Card.Content>
          </Card>
        </Card.Group>

        {/* ── Interactive Map ── */}
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
