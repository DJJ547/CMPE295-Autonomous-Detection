import React, { useState, useEffect } from "react";
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";
import CustomMarker from "./customMarker";
import CarMarker from "./carMarker";
import PopupWindow from "./PopupWindow";

const center = { lat: 37.7749, lng: -122.4194 };

const InteractiveMap = ({
  carLat,
  carLng,
  markers,
  coordSelect,
  setStartLatInput,
  setStartLngInput,
  setEndLatInput,
  setEndLngInput,
  onDeleteEvent,
  onDeleteImage,
  onDeleteMetadata,
  isStaff,
}) => {
  const [selectedMarker, setSelectedMarker] = useState(null);

  // Whenever the markers array changes, sync/close the popup
  useEffect(() => {
    if (!selectedMarker) return;

    const updated = markers.find((m) => m.id === selectedMarker.id);
    if (updated) {
      setSelectedMarker(updated);
    } else {
      setSelectedMarker(null);
    }
  }, [markers, selectedMarker]);

  // For coordinate selection on clicks
  const [step, setStep] = useState(1);
  const [startCoord, setStart] = useState(null);
  const [endCoord, setEnd] = useState(null);

  const handleMapClick = (event) => {
    if (!coordSelect) return;

    const raw = event.detail.latLng;

    // support both .lat()/.lng() and .lat/.lng
    const lat = typeof raw.lat === "function" ? raw.lat() : raw.lat;
    const lng = typeof raw.lng === "function" ? raw.lng() : raw.lng;

    if (step === 1) {
      setStart({ lat, lng });
      setStartLatInput(lat.toFixed(6));
      setStartLngInput(lng.toFixed(6));
      setStep(2);
    } else {
      setEnd({ lat, lng });
      setEndLatInput(lat.toFixed(6));
      setEndLngInput(lng.toFixed(6));
      setStep(1);
    }
  };

  return (
    <APIProvider apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
      <Map
        defaultCenter={center}
        defaultZoom={14}
        gestureHandling="greedy"
        disableDefaultUI={false}
        onClick={handleMapClick}
        style={{ width: "100%", height: "100%" }}
        options={{
          styles: [
            {
              featureType: "poi",
              elementType: "all",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "transit",
              elementType: "all",
              stylers: [{ visibility: "off" }],
            },
          ],
        }}
      >
        {carLat != null && carLng != null && (
          <CarMarker position={{ lat: carLat, lng: carLng }} />
        )}

        {Array.isArray(markers) &&
          markers.map((marker) => (
            <CustomMarker
              key={marker.id}
              position={{
                lat: parseFloat(marker.latitude),
                lng: parseFloat(marker.longitude),
              }}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
              }}
              info={marker}
              onClick={() => setSelectedMarker(marker)}
            />
          ))}

        {startCoord && (
          <Marker
            position={startCoord}
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
            }}
            title={`Start: ${startCoord.lat}, ${startCoord.lng}`}
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
            title={`End: ${endCoord.lat}, ${endCoord.lng}`}
          />
        )}

        {selectedMarker && (
          <div style={{ position: "absolute", top: 0, left: 0 }}>
            <PopupWindow
              marker={selectedMarker}
              onClose={() => setSelectedMarker(null)}
              onDeleteEvent={onDeleteEvent}
              onDeleteImage={onDeleteImage}
              onDeleteMetadata={onDeleteMetadata}
              isDash={true}
              isStaff={isStaff}
              // …plus any other props like onVerify, onAssign, etc.
            />
          </div>
        )}
      </Map>
    </APIProvider>
  );
};

export default InteractiveMap;
