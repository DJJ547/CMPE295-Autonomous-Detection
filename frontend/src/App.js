import React from "react";
import { Route, Routes } from "react-router-dom";
import './App.css';

import Test from "./pages/Test"
import TestStream from "./pages/TestStream"
import GoogleMap from "./pages/googleMap";
import Dashboard from "./pages/Dashboard";
import HeatmapPage from "./pages/HeatmapPage";

export default function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/test" element={<Test />} />
        <Route path="/testStream" element={<TestStream />} />
        <Route path="/googleMap" element={<GoogleMap />} />
        <Route path="/heatmap" element={<HeatmapPage />} />
      </Routes>
    </div>
  );
}