import React, { useState } from "react";
import { Modal, Header, Image, Button, Label, Segment } from "semantic-ui-react";

const PopupWindow = ({
  marker,
  onClose,
  onVerify,
  onAssign,
  onDiscard,
  onStart,
  onComplete,
  isStaff,
  isDash = false,
}) => {
  const [imgDims, setImgDims] = useState({ width: 1, height: 1 });

  if (!marker) return null;

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
    <Modal open onClose={onClose} size="large" closeIcon>
      <Header content={`Event ID: ${marker.id}`} />
      <Modal.Content scrolling>
        <Segment>
          <p><strong>Time:</strong> {new Date(marker.timestamp).toLocaleString()}</p>
          <p><strong>Location:</strong> {marker.street || "Unknown"}, {marker.city || "Unknown"}, {marker.state || "Unknown"}, {marker.zipcode || "Unknown"}</p>
        </Segment>

        {isDash ? (
          // === DASH VERSION: Multiple images with bounding boxes ===
          marker.images?.map((image, imgIndex) => (
            <Segment key={imgIndex}>
              <Header as="h4" dividing>{image.direction} Image</Header>

              {image.metadatas?.length > 0 && (
                <div style={{ marginBottom: "10px" }}>
                  <strong>Captions:</strong>{" "}
                  {image.metadatas.map((meta, i) => (
                    <Label key={i} color="blue" size="tiny" style={{ marginBottom: "4px" }}>
                      {meta.caption}
                    </Label>
                  ))}
                </div>
              )}

              <div style={{ position: "relative", width: "100%", height: "auto" }}>
                <Image
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
            </Segment>
          ))
        ) : (
          // === TASK PAGE VERSION: Single image and single caption ===
          <Segment>
            <Header as="h4" dividing>Detection Image</Header>

            {marker.metadata?.caption && (
              <div style={{ marginBottom: "10px" }}>
                <strong>Caption:</strong>{" "}
                <Label color="blue" size="tiny" style={{ marginBottom: "4px" }}>
                  {marker.metadata.caption}
                </Label>
              </div>
            )}

            <div style={{ position: "relative", width: "100%", height: "auto" }}>
              <Image
                src={marker.image}
                alt="Detection"
                onLoad={(e) => {
                  setImgDims({
                    width: e.target.offsetWidth,
                    height: e.target.offsetHeight,
                  });
                }}
                style={{ width: "100%", height: "auto", objectFit: "contain" }}
              />
              {marker.metadata && renderBoundingBoxes(marker.metadata)}
            </div>
          </Segment>
        )}
      </Modal.Content>

      {/* === ACTIONS === */}
      <Modal.Actions>
        {isDash ? (
          <Button onClick={onClose}>Close</Button>
        ) : (
          <>
            {isStaff ? (
              <>
                {marker.status === "unverified" && (
                  <Button color="orange" onClick={() => onVerify(marker.id)}>
                    🖊 Verify
                  </Button>
                )}
                {marker.status === "verified" && (
                  <Button color="blue" onClick={onAssign}>
                    👤 Assign
                  </Button>
                )}
                <Button color="red" onClick={() => onDiscard(marker.id)}>
                  🗑 Discard
                </Button>
              </>
            ) : (
              <>
                {marker.status === "assigned" && (
                  <Button color="yellow" onClick={onStart}>
                    ▶️ Start
                  </Button>
                )}
                {marker.status === "in_progress" && (
                  <Button color="green" onClick={onComplete}>
                    ✅ Complete
                  </Button>
                )}
              </>
            )}
            <Button onClick={onClose}>Close</Button>
          </>
        )}
      </Modal.Actions>
    </Modal>
  );
};

export default PopupWindow;
