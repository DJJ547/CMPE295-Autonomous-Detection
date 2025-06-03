import React, { useEffect, useState } from "react";
import {
  Dropdown,
  Tab,
  Image,
  Segment,
  Input,
  Form,
  Button,
  Icon,
  Loader,
  Modal,
} from "semantic-ui-react";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io(
  process.env.REACT_APP_SOCKET_BACKEND || "http://localhost:8000"
);

const LiveStreamWindow = ({ setCarLat, setCarLng }) => {
  const [imageList, setImageList] = useState({
    front: [],
    back: [],
    left: [],
    right: [],
  });

  const [imgDims, setImgDims] = useState({ width: 1, height: 1 });

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const [startLatInput, setStartLatInput] = useState("");
  const [startLngInput, setStartLngInput] = useState("");
  const [endLatInput, setEndLatInput] = useState("");
  const [endLngInput, setEndLngInput] = useState("");
  const [numPoints, setNumPoints] = useState("");
  const [params, setParams] = useState(null);

  const [selectedModel, setSelectedModel] = useState("GroundingDINO");

  const maxLen = Math.max(
    imageList.front.length,
    imageList.back.length,
    imageList.left.length,
    imageList.right.length
  );

  useEffect(() => {
    if (!params) return;

    setLoading(true);
    setImageList({
      front: [],
      back: [],
      left: [],
      right: [],
    });
    console.log(localStorage.getItem("user_id"));
    socket.emit("start_stream", {
      userId: localStorage.getItem("user_id"),
      startLatInput: params.startLatInput,
      startLngInput: params.startLngInput,
      endLatInput: params.endLatInput,
      endLngInput: params.endLngInput,
      num_points: params.points,
      model: params.model,
    });
  }, [params]);

  useEffect(() => {
    socket.on("start_stream", (data) => {
      const { direction, ...imageData } = data;

      setImageList((prev) => ({
        ...prev,
        [direction]: [...prev[direction], imageData],
      }));

      setLoading(false); // loading ends as soon as first image is received
      setIsPlaying(true);
    });

    // cleanup on unmount
    return () => {
      socket.off("start_stream");
    };
  }, []);

  useEffect(() => {
    if (!isPlaying || maxLen === 0) return;

    let isMounted = true;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        if (prevIndex + 1 < maxLen) {
          return prevIndex + 1;
        } else {
          setIsPlaying(false);
          return prevIndex;
        }
      });
    }, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isPlaying, maxLen]);

  useEffect(() => {
    if (!imageList || !directions[activeTabIndex]) return;

    const image = imageList[directions[activeTabIndex]]?.[currentIndex];
    if (image && image.lat !== undefined && image.lon !== undefined) {
      setCarLat?.(image.lat);
      setCarLng?.(image.lon);
    }
  }, [currentIndex, activeTabIndex, imageList, setCarLat, setCarLng]);

  const handleSubmit = () => {
    if (
      !startLatInput ||
      !startLngInput ||
      !endLatInput ||
      !endLngInput ||
      !numPoints
    )
      return;

    setLoading(true);
    setCurrentIndex(0);
    setParams({
      startLatInput: parseFloat(startLatInput).toFixed(6),
      startLngInput: parseFloat(startLngInput).toFixed(6),
      endLatInput: parseFloat(endLatInput).toFixed(6),
      endLngInput: parseFloat(endLngInput).toFixed(6),
      points: numPoints,
      model: selectedModel,
    });
    setModalOpen(false);
  };

  const handlePrev = () => {
    setIsPlaying(false);
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentIndex((prev) => Math.min(prev + 1, maxLen - 1));
  };

  const directions = ["front", "back", "left", "right"];

  const renderBoundingBoxes = (boxes, labels = [], scores = []) => {
    const scaleX = imgDims.width / 640;
    const scaleY = imgDims.height / 640;

    return boxes.map(([x1, y1, x2, y2], idx) => {
      const left = x1 * scaleX;
      const top = y1 * scaleY;
      const width = (x2 - x1) * scaleX;
      const height = (y2 - y1) * scaleY;
      const label = labels[idx] || "";
      const score = scores[idx] !== undefined ? scores[idx].toFixed(2) : "";

      return (
        <div
          key={idx}
          style={{ position: "absolute", left, top, width, height, zIndex: 5 }}
        >
          {/* Label positioned above the bounding box */}
          <div
            style={{
              position: "absolute",
              top: "-14px", // move above the box
              left: "0px",
              color: "red",
              fontSize: "10px",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {label} ({score})
          </div>

          {/* Bounding box */}
          <div
            style={{
              width: "100%",
              height: "100%",
              border: "2px solid red",
              backgroundColor: "rgba(255, 0, 0, 0.2)",
              position: "relative",
            }}
          />
        </div>
      );
    });
  };

  const panes = directions.map((direction) => ({
    menuItem: direction.charAt(0).toUpperCase() + direction.slice(1),
    render: () => {
      const imageData = imageList?.[direction]?.[currentIndex];
      const imageUrl = imageData?.url || "/static/images/placeholder.jpg";
      const boxes = imageData?.boxes || [];

      return (
        <Tab.Pane
          attached={false}
          style={{ height: "100%", position: "relative" }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
            }}
          >
            {loading ? (
              <Loader active inline="centered" size="huge" />
            ) : (
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                }}
              >
                <img
                  src={imageUrl}
                  alt="Stream"
                  onLoad={(e) => {
                    setImgDims({
                      width: e.target.offsetWidth,
                      height: e.target.offsetHeight,
                    });
                  }}
                  style={{
                    width: "100%",
                    height: "auto",
                    objectFit: "contain",
                    // position: "absolute",
                    top: 0,
                    left: 0,
                  }}
                />
                {renderBoundingBoxes(
                  boxes,
                  imageData?.labels,
                  imageData?.scores
                )}
              </div>
            )}

            <Button
              icon
              onClick={() => setFullscreenOpen(true)}
              style={{
                position: "absolute",
                bottom: "1rem",
                right: "1rem",
                zIndex: 10,
              }}
            >
              <Icon name="expand" />
            </Button>
          </div>
        </Tab.Pane>
      );
    },
  }));

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Segment
        raised
        style={{ flex: 1, overflowY: "auto", position: "relative" }}
      >
        <Button
          icon
          labelPosition="left"
          onClick={() => setModalOpen(true)}
          style={{ marginBottom: "1rem" }}
        >
          <Icon name="settings" />
          Show Stream Controls
        </Button>

        <Modal open={modalOpen} onClose={() => setModalOpen(false)} size="tiny">
          <Modal.Header>
            Stream Controls
            <Icon
              name="close"
              onClick={() => setModalOpen(false)}
              style={{
                float: "right",
                cursor: "pointer",
              }}
            />
          </Modal.Header>
          <Modal.Content>
            <Form onSubmit={handleSubmit}>
              <Form.Field
                control={Input}
                type="number"
                step="0.000001"
                label="Start Latitude"
                placeholder="e.g., 37.774900"
                value={startLatInput}
                onChange={(e) => setStartLatInput(e.target.value)}
              />
              <Form.Field
                control={Input}
                type="number"
                step="0.000001"
                label="Start Longitude"
                placeholder="e.g., -122.419400"
                value={startLngInput}
                onChange={(e) => setStartLngInput(e.target.value)}
              />
              <Form.Field
                control={Input}
                type="number"
                step="0.000001"
                label="End Latitude"
                placeholder="e.g., 37.804900"
                value={endLatInput}
                onChange={(e) => setEndLatInput(e.target.value)}
              />
              <Form.Field
                control={Input}
                type="number"
                step="0.000001"
                label="End Longitude"
                placeholder="e.g., -122.271100"
                value={endLngInput}
                onChange={(e) => setEndLngInput(e.target.value)}
              />
              <Form.Field
                control={Input}
                type="number"
                label="Number of Points"
                placeholder="e.g., 10"
                value={numPoints}
                onChange={(e) => setNumPoints(e.target.value)}
              />
              {/* New Dropdown Field */}
              <Form.Field>
                <label>Detection Model</label>
                <Dropdown
                  placeholder="Select Model"
                  fluid
                  selection
                  options={[
                    {
                      key: "dino",
                      text: "GroundingDINO",
                      value: "dino",
                    },
                    { key: "owlvit", text: "OWL-ViT", value: "owlvit" },
                    { key: "yolo", text: "YOLO-v8", value: "yolo" },
                  ]}
                  value={selectedModel}
                  onChange={(e, { value }) => setSelectedModel(value)}
                />
              </Form.Field>
              <Form.Field control={Button} content="Update Stream" primary />
            </Form>
          </Modal.Content>
        </Modal>

        <Modal
          open={fullscreenOpen}
          onClose={() => setFullscreenOpen(false)}
          size="fullscreen"
          closeIcon
          style={{
            maxWidth: "70vw",
            margin: "0 auto",
            height: "90vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Modal.Header>Expanded Stream View</Modal.Header>
          <Modal.Content
            style={{
              backgroundColor: "#f9f9f9",
              height: "100%",
              padding: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Tab
              menu={{ pointing: true }}
              panes={panes}
              activeIndex={activeTabIndex}
              onTabChange={(e, { activeIndex }) =>
                setActiveTabIndex(activeIndex)
              }
            />
            {maxLen > 0 && (
              <Segment textAlign="center">
                <Button
                  icon
                  labelPosition="left"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                >
                  <Icon name="arrow left" />
                  Previous
                </Button>
                <Button icon onClick={() => setIsPlaying(!isPlaying)}>
                  <Icon name={isPlaying ? "pause" : "play"} />
                </Button>
                <Button
                  icon
                  labelPosition="right"
                  onClick={handleNext}
                  disabled={currentIndex === maxLen - 1}
                >
                  Next
                  <Icon name="arrow right" />
                </Button>
                <p style={{ marginTop: "1em" }}>
                  Viewing image <strong>{currentIndex + 1}</strong> of{" "}
                  <strong>{maxLen}</strong>
                </p>
              </Segment>
            )}
          </Modal.Content>
        </Modal>

        <Tab
          menu={{ pointing: true }}
          panes={panes}
          activeIndex={activeTabIndex}
          onTabChange={(e, { activeIndex }) => setActiveTabIndex(activeIndex)}
        />

        {maxLen > 0 && (
          <Segment textAlign="center">
            <Button
              icon
              labelPosition="left"
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              <Icon name="arrow left" />
              Previous
            </Button>
            <Button icon onClick={() => setIsPlaying(!isPlaying)}>
              <Icon name={isPlaying ? "pause" : "play"} />
            </Button>
            <Button
              icon
              labelPosition="right"
              onClick={handleNext}
              disabled={currentIndex === maxLen - 1}
            >
              Next
              <Icon name="arrow right" />
            </Button>
            <p style={{ marginTop: "1em" }}>
              Viewing image <strong>{currentIndex + 1}</strong> of{" "}
              <strong>{maxLen}</strong>
            </p>
          </Segment>
        )}
      </Segment>
    </div>
  );
};

export default LiveStreamWindow;
