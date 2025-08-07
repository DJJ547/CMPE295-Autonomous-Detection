// PopupWindow.jsx
import React, { useState } from "react";
import {
  Modal,
  Header,
  Image,
  Button,
  Label,
  Segment,
  Confirm,
} from "semantic-ui-react";

const PopupWindow = ({
  marker,
  onClose,
  onVerify,
  onAssign,
  onDiscard,
  onStart,
  onComplete,
  onDeleteEvent,
  onDeleteImage,
  onDeleteMetadata,
  isStaff,
  isDash,
}) => {
  const [imgDims, setImgDims] = useState({ width: 1, height: 1 });

  // NEW: state for metadata-delete confirmation
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [metaToDelete, setMetaToDelete] = useState(null);

  if (!marker) return null;

  const handleBoxClick = (metaId) => {
    if (!isStaff) return;
    setMetaToDelete(metaId);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    onDeleteMetadata(metaToDelete);
    setConfirmOpen(false);
  };

  const renderBoundingBoxes = (meta) => {
    const scaleX = imgDims.width / 640;
    const scaleY = imgDims.height / 640;
    const x1 = meta.X1_loc * scaleX;
    const y1 = meta.Y1_loc * scaleY;
    const w  = (meta.X2_loc - meta.X1_loc) * scaleX;
    const h  = (meta.Y2_loc - meta.Y1_loc) * scaleY;

    return (
      <div
        key={meta.id}
        onClick={() => handleBoxClick(meta.id)}
        title={isStaff ? "Click to delete this metadata" : undefined}
        style={{
          position: "absolute",
          left: x1,
          top: y1,
          width: w,
          height: h,
          border: "2px solid red",
          backgroundColor: "rgba(255,0,0,0.2)",
          zIndex: 5,
          cursor: isStaff ? "pointer" : "default",
        }}
      >
        <div style={{
          position: "absolute",
          top: "-14px",
          left: "0px",
          color: "red",
          fontSize: "10px",
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}>
          {meta.label} ({meta.score.toFixed(3)})
        </div>
      </div>
    );
  };

  return (
    <>
      <Modal open onClose={onClose} size="large" closeIcon>
        <Header content={`Event ID: ${marker.id}`} />
        <Modal.Content scrolling>
          <Segment>
            <p><strong>Time:</strong> {new Date(marker.timestamp).toLocaleString()}</p>
            <p>
              <strong>Location:</strong>{" "}
              {marker.street || "Unknown"}, {marker.city || "Unknown"}, {marker.state || "Unknown"}, {marker.zipcode || "Unknown"}
            </p>
          </Segment>

          {isDash ? (
            marker.images?.map((image) => (
              <Segment key={image.id}>
                <Header as="h4" dividing>
                  {image.direction} Image
                  {isStaff && (
                    <Button
                      size="mini"
                      color="red"
                      floated="right"
                      onClick={() => onDeleteImage(image.id)}
                    >
                      Delete Image
                    </Button>
                  )}
                </Header>

                {image.metadatas?.length > 0 && (
                  <div style={{ marginBottom: "10px" }}>
                    <strong>Captions:</strong>{" "}
                    {image.metadatas.map((m) => (
                      <Label key={m.id} color="blue" size="tiny" style={{ margin: "2px" }}>
                        {m.caption}
                      </Label>
                    ))}
                  </div>
                )}

                <div style={{ position: "relative", width: "100%" }}>
                  <Image
                    src={image.image_url}
                    alt={image.direction}
                    onLoad={(e) =>
                      setImgDims({
                        width: e.target.offsetWidth,
                        height: e.target.offsetHeight,
                      })
                    }
                    style={{ width: "100%", objectFit: "contain" }}
                  />
                  {image.metadatas?.map(renderBoundingBoxes)}
                </div>
              </Segment>
            ))
          ) : (
            <Segment>
              <Header as="h4" dividing>
                Detection Image
                {isStaff && marker.image_id && (
                  <Button
                    size="mini"
                    color="red"
                    floated="right"
                    onClick={() => onDeleteImage(marker.image_id)}
                  >
                    Delete Image
                  </Button>
                )}
              </Header>

              {marker.metadata?.caption && (
                <div style={{ marginBottom: "10px" }}>
                  <strong>Caption:</strong>{" "}
                  <Label color="blue" size="tiny">
                    {marker.metadata.caption}
                  </Label>
                </div>
              )}

              <div style={{ position: "relative", width: "100%" }}>
                <Image
                  src={marker.image}
                  alt="Detection"
                  onLoad={(e) =>
                    setImgDims({
                      width: e.target.offsetWidth,
                      height: e.target.offsetHeight,
                    })
                  }
                  style={{ width: "100%", objectFit: "contain" }}
                />
                {marker.metadata && renderBoundingBoxes(marker.metadata)}
              </div>
            </Segment>
          )}
        </Modal.Content>

        <Modal.Actions>
          {isDash && isStaff && (
            <Button color="red" onClick={() => onDeleteEvent(marker.id)}>
              Delete Event
            </Button>
          )}

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

      {/* Confirmation for metadata deletion */}
      <Confirm
        open={confirmOpen}
        header="Delete this metadata?"
        content="This will permanently remove the detection metadata."
        confirmButton="Delete"
        cancelButton="Cancel"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
      />
    </>
  );
};

export default PopupWindow;
