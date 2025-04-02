import React, { useEffect, useState } from "react";
import {
  Tab,
  Image,
  Segment,
  Grid,
  Input,
  Form,
  Button,
  Icon,
} from "semantic-ui-react";
import axios from "axios";

const LiveStreamWindow = ({ setCarLat, setCarLng }) => {
  const [imageList, setImageList] = useState({
    front: [],
    back: [],
    left: [],
    right: [],
  });

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
          const nextIndex = prevIndex + 1;
  
          const image = imageList?.[directions[activeTabIndex]]?.[nextIndex];
          if (image && isMounted) {
            setCarLat?.(image.lat);
            setCarLng?.(image.lon);
          }
  
          return nextIndex;
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
  }, [isPlaying, maxLen, activeTabIndex, imageList, setCarLat, setCarLng]);
  

  const handleSubmit = () => {
    if (
      !startLatInput ||
      !startLngInput ||
      !endLatInput ||
      !endLngInput ||
      !numPoints
    )
      return;

    setParams({
      startLatInput: parseFloat(startLatInput).toFixed(6),
      startLngInput: parseFloat(startLngInput).toFixed(6),
      endLatInput: parseFloat(endLatInput).toFixed(6),
      endLngInput: parseFloat(endLngInput).toFixed(6),
      points: numPoints,
    });
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

  const panes = directions.map((direction) => ({
    menuItem: direction.charAt(0).toUpperCase() + direction.slice(1),
    render: () => (
      <Tab.Pane attached={false}>
        <Grid centered>
          <Grid.Column mobile={16} tablet={10} computer={10}>
            <Image
              src={
                imageList?.[direction]?.[currentIndex]?.url ||
                "/static/images/placeholder.jpg"
              }
              fluid
              bordered
            />
          </Grid.Column>
        </Grid>
      </Tab.Pane>
    ),
  }));

  return (
    <Segment raised>
      <Form onSubmit={handleSubmit}>
        <Form.Group widths="equal">
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
        </Form.Group>
      </Form>

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
  );
};

export default LiveStreamWindow;
