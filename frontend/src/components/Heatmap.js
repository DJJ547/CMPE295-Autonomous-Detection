import React, { useEffect, useState } from "react";
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import mockDataPoints from '../mock_data.json'; // Import the JSON data
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';

// Add type property to each data point if it doesn't exist
const dataPointsWithTypes = mockDataPoints.map(point => ({
  ...point,
  // If no type property exists, assign types based on weight for demonstration
  type: point.type || (point.weight >= 4 ? 'road-damage' : 
                       point.weight >= 3 ? 'encampment' : 'graffiti')
}));

// Get unique types from data
const uniqueTypes = ['all', ...new Set(dataPointsWithTypes.map(point => point.type))];

const center = { lat: 37.7749, lng: -122.4194 }; // San Francisco

// Separate component to access the map instance
const HeatmapLayer = ({ filteredData }) => {
  const map = useMap();
  const [heatmap, setHeatmap] = useState(null);
  
  useEffect(() => {
    if (!map || !window.google || !window.google.maps.visualization) {
      console.log("Map or google visualization not loaded yet");
      return;
    }

    // Convert data points to Google Maps LatLng objects
    const heatmapData = filteredData.map(point => ({
      location: new window.google.maps.LatLng(point.lat, point.lng),
      weight: point.weight
    }));

    // Remove existing heatmap if it exists
    if (heatmap) {
      heatmap.setMap(null);
    }

    // Create the heatmap layer
    const newHeatmapLayer = new window.google.maps.visualization.HeatmapLayer({
      data: heatmapData,
      radius: 25, // Adjusted radius for better visualization
      opacity: 0.8  // Slightly increased opacity
    });

    newHeatmapLayer.setMap(map);
    setHeatmap(newHeatmapLayer);

    return () => {
      // Clean up when component unmounts or filteredData changes
      if (newHeatmapLayer) {
        newHeatmapLayer.setMap(null);
      }
    };
  }, [map, filteredData]);

  return null; // This component doesn't render anything
};

const HeatmapComponent = () => {
  const [selectedType, setSelectedType] = useState('all');
  const [filteredData, setFilteredData] = useState(dataPointsWithTypes);

  // Filter data when type selection changes
  useEffect(() => {
    if (selectedType === 'all') {
      setFilteredData(dataPointsWithTypes);
    } else {
      setFilteredData(dataPointsWithTypes.filter(point => point.type === selectedType));
    }
  }, [selectedType]);

  const handleTypeChange = (event) => {
    setSelectedType(event.target.value);
  };

  return (
    <>
      <Box sx={{ minWidth: 200, maxWidth: 300, mb: 2 }}>
        <FormControl fullWidth>
          <InputLabel id="type-filter-label">Filter by Type</InputLabel>
          <Select
            labelId="type-filter-label"
            id="type-filter"
            value={selectedType}
            label="Filter by Type"
            onChange={handleTypeChange}
          >
            {uniqueTypes.map(type => (
              <MenuItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      <APIProvider apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} libraries={["visualization"]}>
        <div style={{ width: "100%", height: "500px" }}>
          <Map
            defaultCenter={center}
            defaultZoom={13}
            mapId=""
            style={{ width: "100%", height: "100%" }}
          >
            <HeatmapLayer filteredData={filteredData} />
          </Map>
        </div>
      </APIProvider>
    </>
  );
};

export default HeatmapComponent;