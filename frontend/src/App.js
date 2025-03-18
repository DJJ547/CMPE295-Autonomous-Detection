import React from "react";
import { Route, Routes } from "react-router-dom";
import './App.css';

import Test from "./pages/Test"
import GoogleMap from "./pages/googleMap";
import HeatmapPage from "./pages/HeatmapPage";

export default function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<GoogleMap />} />
        <Route path="/test" element={<Test />} />
        <Route path="/googleMap" element={<GoogleMap />} />
        <Route path="/heatmap" element={<HeatmapPage />} />
      </Routes>
    </div>
  );
}