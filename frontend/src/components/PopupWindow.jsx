import React from "react";
import "./PopupWindow.css"; // Create a CSS file for styling

const PopupWindow = ({ marker, onClose }) => {
  if (!marker) return null;

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
          <div key={imgIndex} style={{ marginBottom: "10px" }}>
            <h4>{image.direction} Image:</h4>
            <img
              src={image.imageUrl}
              alt={image.direction}
              style={{ width: "100%", maxHeight: "150px" }}
            />
            {image.metadatas?.map((meta, metaIndex) => (
              <div
                key={metaIndex}
                style={{
                  padding: "5px",
                  border: "1px solid #ccc",
                  marginTop: "5px",
                }}
              >
                <p>Type: {meta.type}</p>
                <p>Label: {meta.label}</p>
                <p>Score: {meta.score.toFixed(3)}</p>
                {/* <p>
                  Coords: ({meta.coords.x1}, {meta.coords.y1}) to (
                  {meta.coords.x2}, {meta.coords.y2})
                </p> */}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopupWindow;
