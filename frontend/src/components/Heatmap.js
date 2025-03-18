import React, { useEffect, useState } from "react";
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import mockDataPoints from '../mock_data.json'; // Import the JSON data

const center = { lat: 37.7749, lng: -122.4194 }; // San Francisco

// Separate component to access the map instance
const HeatmapLayer = () => {
  const map = useMap();
  
  useEffect(() => {
    if (!map || !window.google || !window.google.maps.visualization) {
      console.log("Map or google visualization not loaded yet");
      return;
    }

    // Convert data points to Google Maps LatLng objects using the imported JSON
    const heatmapData = mockDataPoints.map(point => ({
      location: new window.google.maps.LatLng(point.lat, point.lng),
      weight: point.weight
    }));

    // Create the heatmap layer
    const heatmapLayer = new window.google.maps.visualization.HeatmapLayer({
      data: heatmapData,
      radius: 10, // Adjusted radius for better visualization
      opacity: 0.7  // Slightly increased opacity
    });

    heatmapLayer.setMap(map);

    return () => {
      // Clean up when component unmounts
      heatmapLayer.setMap(null);
    };
  }, [map]);

  return null; // This component doesn't render anything
};

const HeatmapComponent = () => {
  return (
    <APIProvider apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} libraries={["visualization"]}>
      <div style={{ width: "100%", height: "500px" }}>
        <Map
          defaultCenter={center}
          defaultZoom={13}
          mapId=""
          style={{ width: "100%", height: "100%" }}
        >
          <HeatmapLayer />
        </Map>
      </div>
    </APIProvider>
  );
};

export default HeatmapComponent;