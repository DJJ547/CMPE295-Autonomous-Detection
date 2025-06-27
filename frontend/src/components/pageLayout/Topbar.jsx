import React from "react";
import { Dropdown } from "semantic-ui-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/auth";

export default function Topbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      style={{
        backgroundColor: "#1f2937",
        padding: "0.5rem 2rem",
        minHeight: "3.8rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <a
        href="/"
        style={{
          color: "white",
          fontSize: "1.8rem",
          fontWeight: "bold",
          textDecoration: "none",
        }}
      >
        StreetGuard
      </a>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <Dropdown
          item
          simple
          trigger={
            <img
              src="/static/images/notification-icon.png"
              alt="Notification Icon"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                cursor: "pointer",
              }}
            />
          }
        >
          <Dropdown.Menu
            style={{
              right: 0,
              left: "auto",
              transform: "translateX(0%)",
            }}
          >
            <Dropdown.Item text="Road damage detected!" description="5 mins ago" />
            <Dropdown.Item text="Tent detected!" description="8 mins ago" />
            <Dropdown.Item text="Graffiti detected!" description="30 mins ago" />
            <Dropdown.Divider />
            <Dropdown.Item text="View More" icon="arrow right" />
          </Dropdown.Menu>
        </Dropdown>

        <Dropdown
          item
          simple
          trigger={
            <img
              src="/static/images/user-icon.png"
              alt="Profile Icon"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                cursor: "pointer",
              }}
            />
          }
        >
          <Dropdown.Menu
            style={{
              right: 0,
              left: "auto",
              transform: "translateX(0%)",
            }}
          >
            <Dropdown.Item disabled text="Asummers@gmail.com" />
            <Dropdown.Divider />
            <Dropdown.Item text="Logout" onClick={handleLogout} />
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </div>
  );
}
