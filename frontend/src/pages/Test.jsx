import React, { useState, useEffect } from "react";
import { Button } from "@mui/material";

export default function Test() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/api/test")
      .then((response) => response.json())
      .then((data) => setMessage(data.message))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <Button variant="contained" color="primary">
        Click Me
      </Button>
      <h1>test api:</h1>
      <p>{message ? message : "Loading..."}</p>
    </div>
  );
}
