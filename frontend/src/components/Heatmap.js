// frontend/src/components/Heatmap.js
import React, { useEffect, useState, useCallback } from "react";
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';

const center = { lat: 37.7749, lng: -122.4194 }; // San Francisco

const HeatmapLayer = ({ data }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !window.google || !window.google.maps.visualization) {
      console.log("Map or google visualization not loaded yet");
      return;
    }

    if (!data || data.length === 0) {
      // Clear heatmap if no data
      const currentHeatmapLayer = map.dataHeatmapLayer;
      if (currentHeatmapLayer) {
        currentHeatmapLayer.setMap(null);
        map.dataHeatmapLayer = null;
      }
      return;
    }

    const heatmapData = data.map(point => ({
      location: new window.google.maps.LatLng(point.lat, point.lng),
      weight: point.weight
    }));

    // Clear previous heatmap layer if it exists
    const currentHeatmapLayer = map.dataHeatmapLayer;
    if (currentHeatmapLayer) {
      currentHeatmapLayer.setMap(null);
    }

    const newHeatmapLayer = new window.google.maps.visualization.HeatmapLayer({
      data: heatmapData,
      radius: 10,
      opacity: 0.7
    });

    newHeatmapLayer.setMap(map);
    map.dataHeatmapLayer = newHeatmapLayer; // Store reference to the current layer

    return () => {
      // Clean up when component unmounts or data/map changes
      if (map.dataHeatmapLayer) {
        map.dataHeatmapLayer.setMap(null);
        map.dataHeatmapLayer = null;
      }
    };
  }, [map, data]);

  return null;
};

const HeatmapComponent = () => {
  const [allHeatmapData, setAllHeatmapData] = useState([]);
  const [filteredHeatmapData, setFilteredHeatmapData] = useState([]);
  const [selectedType, setSelectedType] = useState('all');

  const fetchAllHeatmapData = useCallback(async () => {
    // Using environment variable for the base URL
    const baseUrl = process.env.REACT_APP_LOCALHOST || 'http://127.0.0.1:8000'; // Fallback if not set
    const url = `${baseUrl}/api/heatmap/data`; // Your adjusted endpoint

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAllHeatmapData(data);
      console.log("Fetched all heatmap data:", data);
    } catch (error) {
      console.error("Error fetching heatmap data:", error);
      setAllHeatmapData([]);
    }
  }, []);

  useEffect(() => {
    fetchAllHeatmapData();
  }, [fetchAllHeatmapData]);

  useEffect(() => {
    if (selectedType === 'all') {
      setFilteredHeatmapData(allHeatmapData);
    } else {
      const filtered = allHeatmapData.filter(point => point.type === selectedType);
      setFilteredHeatmapData(filtered);
    }
  }, [allHeatmapData, selectedType]);

  const handleTypeChange = (event) => {
    setSelectedType(event.target.value);
  };

return (
  <APIProvider apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} libraries={["visualization"]}>
    <div style={{ position: "relative", width: "100%", height: "92vh" }}>
      {/* Dropdown overlay */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          backgroundColor: "white",
          padding: "8px",
          borderRadius: "4px",
          zIndex: 10,
        }}
      >
        <label htmlFor="detection-type-select">Select Detection Type: </label>
        <select id="detection-type-select" value={selectedType} onChange={handleTypeChange}>
          <option value="all">All</option>
          <option value="graffiti">Graffiti</option>
          <option value="road damage">Road Damage</option>
          <option value="tent">Tent</option>
        </select>
      </div>

      {/* Map underneath */}
      <Map
              defaultCenter={center}
              defaultZoom={14}
              gestureHandling={"greedy"}
              disableDefaultUI={true}
              options={{
                styles: [
                  // Hide all POIs (restaurants, shops, etc.)
                  {
                    featureType: "poi",
                    elementType: "all",
                    stylers: [{ visibility: "off" }]
                  },
                  // Hide transit (bus, train, subway lines/stations)
                  {
                    featureType: "transit",
                    elementType: "all",
                    stylers: [{ visibility: "off" }]
                  }
                ]
              }}
            >
        <HeatmapLayer data={filteredHeatmapData} />
      </Map>
    </div>
  </APIProvider>
);
};

export default HeatmapComponent;