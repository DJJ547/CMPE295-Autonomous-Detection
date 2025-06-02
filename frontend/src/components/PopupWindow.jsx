import React, { useState } from "react";
import "./PopupWindow.css"; // Create a CSS file for styling

const PopupWindow = ({ marker, onClose }) => {
  const [imgDims, setImgDims] = useState({ width: 1, height: 1 });

  if (!marker) return null;

    // Function to render bounding boxes
  const renderBoundingBoxes = (meta) => {
    const scaleX = imgDims.width / 640;
    const scaleY = imgDims.height / 640;

    const x1 = meta.X1_loc * scaleX;
    const y1 = meta.Y1_loc * scaleY;
    const x2 = meta.X2_loc * scaleX;
    const y2 = meta.Y2_loc * scaleY;

    const width = x2 - x1;
    const height = y2 - y1;

    return (
      <div
        key={meta.id}
        style={{
          position: "absolute",
          left: x1,
          top: y1,
          width,
          height,
          border: "2px solid red",
          backgroundColor: "rgba(255, 0, 0, 0.2)",
          zIndex: 5,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-14px",
            left: "0px",
            color: "red",
            fontSize: "10px",
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          {meta.label} ({meta.score.toFixed(3)})
        </div>
      </div>
    );
  };

  return (
    <div className="popup-window">
      <div className="popup-content">
        <button className="close-btn" onClick={onClose}>×</button>
        <h3>Event ID: {marker.id}</h3>
        <p>Timestamp: {new Date(marker.timestamp).toLocaleString()}</p>
        <p>
          Location: {marker.street || "Unknown"}, {marker.city || "Unknown"},
          {marker.state || "Unknown"}, {marker.zipcode || "Unknown"}
        </p>
        {marker.images?.map((image, imgIndex) => (
          <div key={imgIndex} style={{ marginBottom: "10px", position: "relative" }}>
            <h4>{image.direction} Image:</h4>
            <div style={{ position: "relative", width: "100%", height: "auto" }}>
              <img
                src={image.image_url}
                alt={image.direction}
                onLoad={(e) => {
                  setImgDims({
                    width: e.target.offsetWidth,
                    height: e.target.offsetHeight,
                  });
                }}
                style={{ width: "100%", height: "auto", objectFit: "contain" }}
              />
              {image.metadatas?.map((meta) => renderBoundingBoxes(meta))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopupWindow;
