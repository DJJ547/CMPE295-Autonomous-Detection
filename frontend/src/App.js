import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import './App.css';

import Test from "./pages/Test"
import GoogleMap from "./pages/googleMap";
import Dashboard from "./pages/Dashboard";
import HeatmapPage from "./pages/HeatmapPage";
import AnalyticsPage from './pages/AnalyticsPage';

export default function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/test" element={<Test />} />
        <Route path="/googleMap" element={<GoogleMap />} />
        <Route path="/heatmap" element={<HeatmapPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Routes>
    </div>
  );
}