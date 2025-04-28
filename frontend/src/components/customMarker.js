import {Marker, InfoWindow, useMarkerRef  } from '@vis.gl/react-google-maps';
import React, { useEffect, useState, useCallback} from "react";


const CustomMarker = ({position, icon, info}) => {
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
        icon = {icon}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
      />

      {infoWindowShown && (
        <InfoWindow anchor={marker} headerDisabled>
          <h2>{info.class}</h2>
          <p>lat:{info.lat}, lng:{info.lng}</p>
          <img src={info.image_url}/>
        </InfoWindow>
      )}
    </>
  );
};

export default CustomMarker;