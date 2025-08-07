import React, { useState } from "react";
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
}) => {
  const [selectedMarker, setSelectedMarker] = useState(null);

  // ✅ Track clicks
  const [step, setStep] = useState(1);
  const [startCoord, setStartCoord] = useState(null);
  const [endCoord, setEndCoord] = useState(null);

  // ✅ Click handler for selecting start & end
  const handleMapClick = (event) => {
    // 🚨 Only allow selection when coordSelect is true
    if (!coordSelect) return;

    const lat = event.detail.latLng.lat;
    const lng = event.detail.latLng.lng;

    if (step === 1) {
      setStartCoord({ lat, lng });
      setStartLatInput(lat.toFixed(6));
      setStartLngInput(lng.toFixed(6));
      setStep(2);
    } else {
      setEndCoord({ lat, lng });
      setEndLatInput(lat.toFixed(6));
      setEndLngInput(lng.toFixed(6));
      setStep(1); // reset for next round
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
        {/* ✅ Car Marker */}
        {carLat && carLng && (
          <CarMarker position={{ lat: carLat, lng: carLng }} />
        )}

        {/* ✅ Existing markers */}
        {Array.isArray(markers) &&
          markers.map((marker, index) => (
            <CustomMarker
              key={index}
              position={{
                lat: parseFloat(marker.latitude),
                lng: parseFloat(marker.longitude),
              }}
              icon={{
                url: `http://maps.google.com/mapfiles/ms/icons/red-dot.png`,
              }}
              info={marker}
              onClick={() => setSelectedMarker(marker)}
            />
          ))}

        {/* ✅ Start & End Markers */}
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

        {/* ✅ Optional popup */}
        {selectedMarker && (
          <div style={{ position: "absolute", top: 0, left: 0 }}>
            <PopupWindow
              marker={selectedMarker}
              onClose={() => setSelectedMarker(null)}
              isDash={true}
            />
          </div>
        )}
      </Map>
    </APIProvider>
  );
};

export default InteractiveMap;
