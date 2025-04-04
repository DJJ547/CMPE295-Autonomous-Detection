import React, { useState } from "react";
import { Card, Menu, Icon } from "semantic-ui-react";
import AnimatedButton from "./Animatedbutton";

export default function Sidebar() {
  const [selectedPath, setSelectedPath] = useState(window.location.pathname);

  const handleClick = (path) => () => {
    window.location.href = path;
    setSelectedPath(path);
  };

  return (
    <Card
      style={{
        height: "100%",
        width: "100%",
        maxWidth: "20rem",
        padding: "1rem",
        fontSize: "1rem",
        boxShadow: "0 10px 15px -3px rgba(30, 41, 59, 0.8)",
      }}
    >
      <Menu vertical fluid secondary>
        <Menu.Item
          active={selectedPath === "/"}
          onClick={handleClick("/")}
          style={{ marginBottom: "2.5rem" }}
        >
          <Icon name="dashboard" size="large" />
          <AnimatedButton>Dashboard</AnimatedButton>
        </Menu.Item>

        <Menu.Item
          active={selectedPath === "/analytics"}
          onClick={handleClick("/analytics")}
          style={{ marginBottom: "2.5rem" }}
        >
          <Icon name="chart bar" size="large" />
          <AnimatedButton>Analytics</AnimatedButton>
        </Menu.Item>
      </Menu>
    </Card>
  );
}

