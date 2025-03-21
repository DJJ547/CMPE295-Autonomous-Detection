import React, { useEffect, useState } from "react";
import { APIProvider, Map, Marker  } from '@vis.gl/react-google-maps';
import CustomMarker from "./customMarker";
const center = {
  lat: 37.7749, // Default to San Francisco
  lng: -122.4194,
};

const InteractiveMap = ({ markers }) => {
  const [position, setPosition] = useState(center);
  const speed = 1;
      


   // Function to determine marker color based on label
  const getMarkerColor = (label) => {
    const colorMap = {
      "road-damage": "red",
      "graffiti": "orange",
      "encampment": "yellow",
    };

    return colorMap[label] || "white";
  };



  return (
    <APIProvider apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
      <Map defaultCenter={position} defaultZoom={15} gestureHandling={"greedy"} disableDefaultUI={true}>
        {Array.isArray(markers) && markers.map((marker, index) => (
          <CustomMarker
            key={index}
            position={{ lat: parseFloat(marker.lat), lng: parseFloat(marker.lng) }} // Convert to float
            icon={{
              url: `http://maps.google.com/mapfiles/ms/icons/${getMarkerColor(marker.class)}-dot.png`,
            }}
            info = {marker}
          />
        ))}
      </Map>
    </APIProvider>
  );
};

export default InteractiveMap;