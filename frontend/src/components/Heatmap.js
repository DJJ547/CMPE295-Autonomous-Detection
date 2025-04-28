import React, { useEffect, useState } from "react";
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import axios from 'axios';

const center = { lat: 37.7749, lng: -122.4194 }; // San Francisco

// Separate component to access the map instance
const HeatmapLayer = ({ anomalyData }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map || !window.google || !window.google.maps.visualization || !anomalyData?.length) {
      console.log("Map or google visualization not loaded yet, or no anomaly data");
      return;
    }

    // Convert data points to Google Maps LatLng objects using the API data
    const heatmapData = anomalyData.map(point => ({
      location: new window.google.maps.LatLng(point.lat, point.lng),
      weight: point.weight || 1
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
  }, [map, anomalyData]);

  return null; // This component doesn't render anything
};

const HeatmapComponent = () => {
  const [anomalyData, setAnomalyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  useEffect(() => {
    const fetchAnomalyData = async () => {
      try {
        setLoading(true);
        const endpoint = selectedType 
          ? `${process.env.REACT_APP_LOCALHOST}api/heatmap/anomalies/by-type/${selectedType}`
          : `${process.env.REACT_APP_LOCALHOST}api/heatmap/anomalies`;
        
        const response = await axios.get(endpoint);
        
        if (response.data.success) {
          setAnomalyData(response.data.data);
        } else {
          setError("Failed to load anomaly data");
        }
      } catch (err) {
        console.error("Error fetching anomaly data:", err);
        setError(`Failed to fetch data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAnomalyData();
  }, [selectedType]);

  const handleTypeChange = (e) => {
    setSelectedType(e.target.value === "all" ? null : e.target.value);
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <div style={{ padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "4px", marginBottom: "10px" }}>
        <select 
          onChange={handleTypeChange} 
          value={selectedType || "all"}
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ced4da" }}
        >
          <option value="all">All Anomalies</option>
          <option value="graffiti">Graffiti</option>
          <option value="tent">Tent</option>
          <option value="road_damage">Road Damage</option>
        </select>
        
        {loading && <span style={{ marginLeft: "15px" }}>Loading...</span>}
        {error && <span style={{ marginLeft: "15px", color: "red" }}>{error}</span>}
      </div>
      
      <APIProvider apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} libraries={["visualization"]}>
        <div style={{ width: "100%", height: "calc(100% - 50px)" }}>
          <Map
            defaultCenter={center}
            defaultZoom={13}
            mapId=""
            style={{ width: "100%", height: "100%" }}
          >
            <HeatmapLayer anomalyData={anomalyData} />
          </Map>
        </div>
      </APIProvider>
    </div>
  );
};

export default HeatmapComponent;