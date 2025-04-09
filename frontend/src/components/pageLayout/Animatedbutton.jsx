import React, { useState } from "react";

const AnimatedButton = ({ children, href }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      style={{
        position: "relative",
        display: "inline-block",
        width: "fit-content",
        height: "fit-content",
      }}
    >
      <h1 style={{ position: "relative" }}>
        {children}
        <span
          style={{
            position: "absolute",
            bottom: "-8px",
            left: "-8px",
            right: "-8px",
            height: "4px",
            backgroundColor: "#4B5563",
            borderRadius: "9999px",
            transform: open ? "scaleX(1)" : "scaleX(0)",
            transformOrigin: "left",
            transition: "transform 300ms ease-out",
            display: "block",
          }}
        />
      </h1>
    </div>
  );
};

export default AnimatedButton;
