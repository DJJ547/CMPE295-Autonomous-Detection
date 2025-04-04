import React, { useState } from "react";
import {
  Container,
  Form,
  Input,
  Button,
  Header,
  Segment,
  Image,
  Message,
} from "semantic-ui-react";
// import SignupIcon from "../../medias/auth/authIcon.png";
import PopupMessage from "../../components/PopupMessage";

const api_url = process.env.REACT_APP_DASHBOARD;

export default function Signup() {
  const [formData, setFormData] = useState({
    email: "",
    firstname: "",
    lastname: "",
    password: "",
  });

  const [popupMessage, setPopupMessage] = useState({ message: "", type: "" });

  const handleChange = (e, { name, value }) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    fetch(`${process.env.REACT_APP_LOCALHOST}auth/signup/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Signup failed");
        }
        return response.json();
      })
      .then(() => {
        window.location.href = "/login";
      })
      .catch((error) => {
        setPopupMessage({ message: error.message, type: "error" });
        console.error("Signup error:", error);
      });
  };

  return (
    <Container
      textAlign="center"
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        {/* <Image src={SignupIcon} size="mini" alt="icon" /> */}
        <Header as="h1" style={{ marginLeft: "1rem", color: "#2185d0" }}>
          StreetGuard
        </Header>
      </div>

      <Segment padded="very" style={{ maxWidth: 450, margin: "0 auto" }}>
        <Header as="h2" textAlign="center">
          Sign Up
        </Header>

        <Form onSubmit={handleSubmit}>
          <Form.Field
            control={Input}
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <Form.Field
            control={Input}
            type="text"
            name="firstname"
            placeholder="First Name"
            value={formData.firstname}
            onChange={handleChange}
            required
          />
          <Form.Field
            control={Input}
            type="text"
            name="lastname"
            placeholder="Last Name"
            value={formData.lastname}
            onChange={handleChange}
            required
          />
          <Form.Field
            control={Input}
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <Button fluid color="blue" type="submit" content="Sign Up" />
        </Form>

        <PopupMessage message={popupMessage.message} type={popupMessage.type} />

        <Message style={{ marginTop: "1rem" }}>
          Already have an account?{" "}
          <a href="/login" style={{ color: "#2185d0" }}>
            Log in
          </a>
        </Message>
      </Segment>
    </Container>
  );
}
