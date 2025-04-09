import React, { useState, useEffect } from "react";
import { Button } from "@mui/material";
import InteractiveMap from "../components/interactiveMap";


export default function GoogleMap() {
  const [markers, setMarkers] = useState([]);

   // Function to fetch markers from the backend
  const fetchMarkers = () => {
    fetch("http://localhost:8000/api/markers")  // Replace with your backend URL
      .then((response) => response.json())
      .then((data) => {
        setMarkers(data);
      })
      .catch((error) => {
        console.error("Error fetching markers:", error);
      });
  };

  useEffect(() => {
    // Fetch markers immediately on mount
    fetchMarkers();

    // Set up polling: Fetch markers every 5 seconds (5000 ms)
    const intervalId = setInterval(fetchMarkers, 5000);

    // Cleanup: Clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [])


  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Google Map</h1>
      <div style={{ width: "80%", height: "500px", margin: "0 auto", border: "1px solid #ccc", borderRadius: "8px", overflow: "hidden" }}>
        <InteractiveMap markers = {markers}/>
      </div>
    </div>
  );
}