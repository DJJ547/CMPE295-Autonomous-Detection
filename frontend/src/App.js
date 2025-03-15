import React from "react";
import { Route, Routes } from "react-router-dom";
import './App.css';

import Test from "./pages/Test"
import GoogleMap from "./pages/googleMap";

export default function App() {
  return (
    <div>
      <Routes>
        <Route path="/test" element={<Test />} />
        <Route path="/googleMap" element={<GoogleMap />} />
      </Routes>
    </div>
  );
}
