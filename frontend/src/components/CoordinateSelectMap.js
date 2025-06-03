import React, { useState } from "react";
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";

const CoordinateSelectMap = ({
  startLat, startLng, endLat, endLng,
  setStartLatInput, setStartLngInput,
  setEndLatInput, setEndLngInput,
  onCoordinateSelected
}) => {
  const [step, setStep] = useState(1);

  const handleMapClick = (event) => {
    const lat = (event.detail.latLng.lat).toFixed(6);
    const lng = (event.detail.latLng.lng).toFixed(6);

    if (step === 1) {
      setStartLatInput(lat);
      setStartLngInput(lng);

      setEndLatInput("");
      setEndLngInput("");

      setStep(2);
      onCoordinateSelected();
    } else {
      setEndLatInput(lat);
      setEndLngInput(lng);
      setStep(1);
      onCoordinateSelected();
    }
  };

  const startCoord = startLat && startLng ? { lat: Number(startLat), lng: Number(startLng) } : null;
  const endCoord = endLat && endLng ? { lat: Number(endLat), lng: Number(endLng) } : null;

  return (
    <APIProvider apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
      <Map
        defaultCenter={{ lat: 37.7749, lng: -122.4194 }}
        defaultZoom={15}
        gestureHandling="greedy"
        disableDefaultUI
        onClick={handleMapClick}
        style={{ height: "100%", width: "100%" }}
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
        {startCoord && (
          <Marker
            position={startCoord}
            icon={{ url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" }}
            title={`Start: ${startCoord.lat.toFixed(6)}, ${startCoord.lng.toFixed(6)}`}
          />
        )}
        {endCoord && (
          <Marker
            position={endCoord}
            icon={{
              url: "/finish-flag.png",
              scaledSize: new window.google.maps.Size(30, 30),
              anchor: new window.google.maps.Point(0, 30),
            }}
            title={`End: ${endCoord.lat.toFixed(6)}, ${endCoord.lng.toFixed(6)}`}
          />
        )}
      </Map>
    </APIProvider>
  );
};

export default CoordinateSelectMap;
