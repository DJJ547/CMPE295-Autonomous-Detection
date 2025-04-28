import React, { useEffect, useState } from "react";
import {
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

  const maxLen = Math.max(
    imageList.front.length,
    imageList.back.length,
    imageList.left.length,
    imageList.right.length
  );

  useEffect(() => {
    if (!params) return;

    const fetchImages = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_LOCALHOST}api/stream`,
          {
            params: {
              userId: localStorage.getItem("user_id"),
              startLatInput: params.startLatInput,
              startLngInput: params.startLngInput,
              endLatInput: params.endLatInput,
              endLngInput: params.endLngInput,
              num_points: params.points,
            },
          }
        );
        console.log("S3 image URLs and coordinates:", res.data);
        setImageList(res.data);
        setCurrentIndex(0);
        setLoading(false);
        setIsPlaying(true);
      } catch (error) {
        console.error("Failed to fetch images:", error);
      }
    };

    fetchImages();
  }, [params]);

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
    setParams({
      startLatInput: parseFloat(startLatInput).toFixed(6),
      startLngInput: parseFloat(startLngInput).toFixed(6),
      endLatInput: parseFloat(endLatInput).toFixed(6),
      endLngInput: parseFloat(endLngInput).toFixed(6),
      points: numPoints,
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

  const renderBoundingBoxes = (boxes) => {
    const scaleX = imgDims.width / 640;
    const scaleY = imgDims.height / 640;
  
    return boxes.map(([x1, y1, x2, y2], idx) => {
      const left = x1 * scaleX;
      const top = y1 * scaleY;
      const width = (x2 - x1) * scaleX;
      const height = (y2 - y1) * scaleY;
  
      return (
        <div
          key={idx}
          style={{
            position: "absolute",
            left,
            top,
            width,
            height,
            border: "2px solid red",
            backgroundColor: "rgba(255, 0, 0, 0.2)",
            zIndex: 5,
          }}
        />
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
                {renderBoundingBoxes(boxes)}
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
