import React from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";

//utilities
import ProtectedRoute from "./utils/ProtectedRoute";

//components
import PageLayout from "./components/pageLayout/PageLayout";

//pages
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Test from "./pages/Test";
import GoogleMap from "./pages/googleMap";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import HeatmapPage from "./pages/HeatmapPage";
import AnalyticsPage from './pages/ChartSection';
import TaskAssigningPage from "./pages/TaskAssigningPage";

export default function App() {
  return (
    <div>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<ProtectedRoute><PageLayout><Dashboard /></PageLayout></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><PageLayout><Analytics /></PageLayout></ProtectedRoute>} />
        <Route path="/test" element={<Test />} />
        <Route path="/googleMap" element={<GoogleMap />} />
        <Route path="/heatmap" element={<HeatmapPage />} />
        <Route path="/analyticsPage" element={<AnalyticsPage />} />
        <Route path="/tasks" element={<ProtectedRoute><PageLayout><TaskAssigningPage></TaskAssigningPage></PageLayout></ProtectedRoute>} />
      </Routes>
    </div>
  );
}
