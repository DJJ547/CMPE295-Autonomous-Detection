import {Marker, InfoWindow, useMarkerRef  } from '@vis.gl/react-google-maps';
import React, { useEffect, useState, useCallback} from "react";


const CarMarker = ({position, icon, info}) => {
  // `markerRef` and `marker` are needed to establish the connection between
  // the marker and infowindow (if you're using the Marker component, you
  // can use the `useMarkerRef` hook instead).
  const [markerRef, marker] = useMarkerRef();

  const [infoWindowShown, setInfoWindowShown] = useState(false);

  // Show InfoWindow on hover
  const handleMouseOver = useCallback(() => setInfoWindowShown(true), []);
  const handleMouseOut = useCallback(() => setInfoWindowShown(false), []);

  const carIcon = {
    url: "/car.png", 
    scaledSize: new window.google.maps.Size(35, 35), 
    anchor: new window.google.maps.Point(20, 25), 
    className: "marker-icon",
  };


  return (
    <>
      <Marker
        ref={markerRef}
        position={position}
        icon = {carIcon}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        zIndex={9999}
      />

      {/* {infoWindowShown && (
        <InfoWindow anchor={marker} headerDisabled>
          <h2>{info.class}</h2>
          <p>lat:{info.lat}, lng:{info.lng}</p>
        </InfoWindow>
      )} */}
    </>
  );
};

export default CarMarker;