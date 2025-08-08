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
  const isActive = (path, prefix = false) =>
    prefix
      ? location.pathname === path || location.pathname.startsWith(path + "/")
      : location.pathname === path;

  return (
    <Card
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "20rem",
        padding: 0,
        fontSize: "1rem",
        boxShadow: "0 10px 15px -3px rgba(30, 41, 59, 0.8)",
      }}
    >
      {/* ── User Profile ─────────────────────────────── */}
      <div style={{ padding: "1rem", display: "flex", alignItems: "center" }}>
        <Icon name="user circle" size="huge" />
        <div style={{ marginLeft: "1rem" }}>
          <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
            {user.firstname} {user.lastname}
          </div>
          <div style={{ color: "#6B7280", textTransform: "capitalize" }}>
            {user.role}
          </div>
        </div>
      </div>

      {/* ── Navigation Menu ─────────────────────────── */}
      <div
        style={{
          padding: "1rem",
          paddingTop: "0.5rem",
          flexGrow: 1,
          overflowY: "auto",
        }}
      >
        <Menu vertical fluid secondary>
          <Menu.Item
            active={isActive("/dashboard")}
            onClick={go("/dashboard")}
            style={{ marginBottom: "1rem" }}
          >
            <Icon name="dashboard" size="large" />
            <AnimatedButton>Dashboard</AnimatedButton>
          </Menu.Item>

          <Menu.Item
            active={isActive("/analytics")}
            onClick={go("/analytics")}
            style={{ marginBottom: "1rem" }}
          >
            <Icon name="chart bar" size="large" />
            <AnimatedButton>Analytics</AnimatedButton>
          </Menu.Item>

          <Menu.Item
            active={isActive("/tasks", true)}
            onClick={go(`/tasks/${user.id}`)}
          >
            <Icon name="tasks" size="large" />
            <AnimatedButton>Tasks</AnimatedButton>
          </Menu.Item>
        </Menu>
      </div>
    </Card>
  );

}
