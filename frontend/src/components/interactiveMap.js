import React, { useEffect, useState } from "react";
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";

import CustomMarker from "./customMarker";
import CarMarker from "./carMarker";
import PopupWindow from "./PopupWindow";
const center = {
  lat: 37.7749, // Default to San Francisco
  lng: -122.4194,
};

const InteractiveMap = ({ carLat, carLng, markers }) => {
  const [position, setPosition] = useState(center);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const speed = 1;


    // Handle marker click
  const handleMarkerClick = (marker) => {
    console.log(marker);
    setSelectedMarker(marker);
  };

  // Close the popup window
  const closePopup = () => {
    setSelectedMarker(null);
  };


  return (
    <APIProvider apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} libraries={["visualization"]}>
      <Map
        defaultCenter={position}
        defaultZoom={15}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
      >
        {/* {carLat !== null && carLng !== null && (
          <CarMarker position={{ lat: carLat, lng: carLng }} />
        )} */}

        {Array.isArray(markers) &&
          markers.map((marker, index) => (
            <CustomMarker
              key={index}
              position={{
                lat: parseFloat(marker.latitude), // Updated to "latitude"
                lng: parseFloat(marker.longitude), // Updated to "longitude"
              }}
              icon={{
                url: `http://maps.google.com/mapfiles/ms/icons/red-dot.png`,// Default to "red"
              }}
              info={{
                id: marker.id,
                timestamp: marker.timestamp,
                street: marker.street || "Unknown",
                city: marker.city || "Unknown",
                state: marker.state || "Unknown",
                zipcode: marker.zipcode || "Unknown",
              }}

              onClick={() => handleMarkerClick(marker)}

            />
          ))}

        {selectedMarker && (
          <div style={{ position: "absolute", top: 0, left: 0 }}>
          <PopupWindow marker={selectedMarker} onClose={closePopup} />
          </div>
        )}
      </Map>
    </APIProvider>
  );
};

export default InteractiveMap;
