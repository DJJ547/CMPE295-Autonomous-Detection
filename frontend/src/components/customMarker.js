import { Marker, InfoWindow, useMarkerRef } from '@vis.gl/react-google-maps';
import React, { useEffect, useState, useCallback } from "react";


const CustomMarker = ({ position, icon, info, onClick }) => {
  // `markerRef` and `marker` are needed to establish the connection between
  // the marker and infowindow (if you're using the Marker component, you
  // can use the `useMarkerRef` hook instead).
  const [markerRef, marker] = useMarkerRef();

  const [infoWindowShown, setInfoWindowShown] = useState(false);

  // Show InfoWindow on hover
  const handleMouseOver = useCallback(() => setInfoWindowShown(true), []);
  const handleMouseOut = useCallback(() => setInfoWindowShown(false), []);

  return (
    <>
      <Marker
        ref={markerRef}
        position={position}
        icon={icon}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        onClick={onClick}
      />

      {infoWindowShown && (
        <InfoWindow anchor={marker} headerDisabled>
          <h2>Detection Event {info.id}</h2>
          <p>Timestamp: {new Date(info.timestamp).toLocaleString()}</p>
          <p>Location: {info.street || "Unknown"}, {info.city || "Unknown"}, {info.state || "Unknown"}, {info.zipcode || "Unknown"}</p>
          <p>Coordinates: lat: {position.lat}, lng: {position.lng}</p>

        </InfoWindow>
      )}
    </>
  );
};

export default CustomMarker;