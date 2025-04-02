import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import LiveStreamWindow from "../components/LiveStreamWindow";
// import Heatmap from "./HeatmapPage";
// import GoogleMapView from "./googleMap";

const Dashboard = () => {
  const [carLat, setCarLat] = useState(null);
  const [carLng, setCarLng] = useState(null);

  return (
    <div className="p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div>
        <LiveStreamWindow setCarLat={setCarLat} setCarLng={setCarLng} />
      </div>
    </div>
  );
};

export default Dashboard;
