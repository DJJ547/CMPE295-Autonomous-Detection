import React from "react";
import { Route, Routes } from "react-router-dom";
import './App.css';

import Test from "./pages/Test"

export default function App() {
  return (
    <div>
      <Routes>
        <Route path="/test" element={<Test />} />
      </Routes>
    </div>
  );
}
