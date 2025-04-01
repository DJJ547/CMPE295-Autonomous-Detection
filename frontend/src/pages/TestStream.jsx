import React from "react";
import LivestreamWindow from "../components/LiveStreamWindow"; // adjust the path if needed
import { Container, Menu } from "semantic-ui-react";

const TestStream = () => {
  return (
    <>
      <Menu inverted>
        <Container>
          <Menu.Item header>Urban Maintenance Dashboard</Menu.Item>
        </Container>
      </Menu>

      <LivestreamWindow />
    </>
  );
};

export default TestStream;
