import React, { useState, useEffect } from "react";
import { Button } from "@mui/material";
import InteractiveMap from "../components/interactiveMap";


export default function GoogleMap() {

  useEffect(() => {
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Google Map</h1>
      <div style={{ width: "80%", height: "500px", margin: "0 auto", border: "1px solid #ccc", borderRadius: "8px", overflow: "hidden" }}>
        <InteractiveMap/>
      </div>
    </div>
  );
}