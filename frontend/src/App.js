import React from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";

import PageLayout from "./components/pageLayout/PageLayout";
import Test from "./pages/Test";
import GoogleMap from "./pages/googleMap";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import HeatmapPage from "./pages/HeatmapPage";

export default function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<PageLayout><Dashboard /></PageLayout>} />
        <Route path="/analytics" element={<PageLayout><Analytics /></PageLayout>} />
        <Route path="/test" element={<Test />} />
        <Route path="/googleMap" element={<GoogleMap />} />
        <Route path="/heatmap" element={<HeatmapPage />} />
      </Routes>
    </div>
  );
}
