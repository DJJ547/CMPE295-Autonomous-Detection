import React from "react";
import { Card, Menu, Icon } from "semantic-ui-react";
import { useNavigate, useLocation } from "react-router-dom";
import AnimatedButton from "./Animatedbutton";
import { useAuth } from "../../contexts/auth";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  const go = (path) => () => navigate(path);

  const isActive = (path, prefix = false) => {
    if (prefix) {
      return location.pathname === path || location.pathname.startsWith(path + "/");
    }
    return location.pathname === path;
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
          active={isActive("/")}
          onClick={go(`/dashboard`)}
          style={{ marginBottom: "2.5rem" }}
        >
          <Icon name="dashboard" size="large" />
          <AnimatedButton>Dashboard</AnimatedButton>
        </Menu.Item>

        <Menu.Item
          active={isActive("/analytics")}
          onClick={go(`/analytics`)}
          style={{ marginBottom: "2.5rem" }}
        >
          <Icon name="chart bar" size="large" />
          <AnimatedButton>Analytics</AnimatedButton>
        </Menu.Item>

        <Menu.Item
          active={isActive("/tasks", true)}
          onClick={go(`/tasks/${user.id}`)}
          style={{ marginBottom: "2.5rem" }}
        >
          <Icon name="tasks" size="large" />
          <AnimatedButton>Tasks</AnimatedButton>
        </Menu.Item>
      </Menu>
    </Card>
  );
}
