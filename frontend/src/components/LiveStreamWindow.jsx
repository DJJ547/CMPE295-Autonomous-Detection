import React, { useEffect, useState } from 'react';
import { Tab, Image, Segment, Grid, Input, Form, Button, Icon } from 'semantic-ui-react';
import axios from 'axios';

const LiveStreamWindow = () => {
  const [imageList, setImageList] = useState({
    front: [],
    back: [],
    left: [],
    right: [],
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const [startLat, setStartLat] = useState('');
  const [startLng, setStartLng] = useState('');
  const [endLat, setEndLat] = useState('');
  const [endLng, setEndLng] = useState('');
  const [numPoints, setNumPoints] = useState('');
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
        const res = await axios.get(`${process.env.REACT_APP_LOCALHOST}api/stream`, {
          params: {
            startLat: params.startLat,
            startLng: params.startLng,
            endLat: params.endLat,
            endLng: params.endLng,
            num_points: params.points,
          },
        });
        console.log('S3 image URLs:', res.data);
        setImageList(res.data);
        setCurrentIndex(0);
        setIsPlaying(true);
      } catch (error) {
        console.error('Failed to fetch images:', error);
      }
    };

    fetchImages();
  }, [params]);

  useEffect(() => {
    if (!isPlaying || maxLen === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex + 1 < maxLen ? prevIndex + 1 : 0
      );
    }, 1500);

    return () => clearInterval(interval);
  }, [isPlaying, maxLen]);

  const handleSubmit = () => {
    if (!startLat || !startLng || !endLat || !endLng || !numPoints) return;

    setParams({
      startLat: parseFloat(startLat).toFixed(6),
      startLng: parseFloat(startLng).toFixed(6),
      endLat: parseFloat(endLat).toFixed(6),
      endLng: parseFloat(endLng).toFixed(6),
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

  const directions = ['front', 'back', 'left', 'right'];

  const panes = directions.map((direction) => ({
    menuItem: direction.charAt(0).toUpperCase() + direction.slice(1),
    render: () => (
      <Tab.Pane attached={false}>
        <Grid centered>
          <Grid.Column mobile={16} tablet={10} computer={10}>
            <Image
              src={
                imageList[direction][currentIndex] ||
                '/static/images/placeholder.jpg'
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
            value={startLat}
            onChange={(e) => setStartLat(e.target.value)}
          />
          <Form.Field
            control={Input}
            type="number"
            step="0.000001"
            label="Start Longitude"
            placeholder="e.g., -122.419400"
            value={startLng}
            onChange={(e) => setStartLng(e.target.value)}
          />
          <Form.Field
            control={Input}
            type="number"
            step="0.000001"
            label="End Latitude"
            placeholder="e.g., 37.804900"
            value={endLat}
            onChange={(e) => setEndLat(e.target.value)}
          />
          <Form.Field
            control={Input}
            type="number"
            step="0.000001"
            label="End Longitude"
            placeholder="e.g., -122.271100"
            value={endLng}
            onChange={(e) => setEndLng(e.target.value)}
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

      <Tab menu={{ pointing: true }} panes={panes} />

      {maxLen > 0 && (
        <Segment textAlign="center">
          <Button icon labelPosition="left" onClick={handlePrev} disabled={currentIndex === 0}>
            <Icon name="arrow left" />
            Previous
          </Button>
          <Button icon onClick={() => setIsPlaying(!isPlaying)}>
            <Icon name={isPlaying ? 'pause' : 'play'} />
          </Button>
          <Button icon labelPosition="right" onClick={handleNext} disabled={currentIndex === maxLen - 1}>
            Next
            <Icon name="arrow right" />
          </Button>
          <p style={{ marginTop: '1em' }}>
            Viewing image <strong>{currentIndex + 1}</strong> of <strong>{maxLen}</strong>
          </p>
        </Segment>
      )}
    </Segment>
  );
};

export default LiveStreamWindow;
