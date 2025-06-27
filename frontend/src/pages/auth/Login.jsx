import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/auth";
import {
  Container,
  Form,
  Input,
  Button,
  Header,
  Segment,
  Message,
} from "semantic-ui-react";
// import LoginIcon from "../../medias/auth/authIcon.png";
import PopupMessage from "../../components/PopupMessage";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth(); // ✅ use login method from context

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [popupMessage, setPopupMessage] = useState({ message: "", type: "" });

  const handleChange = (e, { name, value }) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${process.env.REACT_APP_LOCALHOST}auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();

      login(data); // ✅ context handles setting user and localStorage
      navigate(`/${data.id}`); // ✅ redirect to user-specific route
    } catch (error) {
      setPopupMessage({ message: error.message, type: "error" });
      console.error("Login error:", error);
    }
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
        {/* <Image src={LoginIcon} alt="icon" size="mini" /> */}
        <Header as="h1" style={{ marginLeft: "1rem", color: "#2185d0" }}>
          StreetGuard
        </Header>
      </div>

      <Segment padded="very" style={{ maxWidth: 450, margin: "0 auto" }}>
        <Header as="h2" textAlign="center">
          Login
        </Header>

        <Form onSubmit={handleSubmit}>
          <Form.Field
            control={Input}
            type="email"
            name="email"
            placeholder="Enter email"
            value={formData.email}
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
          <Button
            fluid
            color="blue"
            type="submit"
            content="Login"
            style={{ marginTop: "1rem" }}
          />
        </Form>

        <PopupMessage message={popupMessage.message} type={popupMessage.type} />

        <Message style={{ marginTop: "1rem" }}>
          Don’t have an account?{" "}
          <a href="/signup" style={{ color: "#2185d0" }}>
            Signup
          </a>
        </Message>
      </Segment>
    </Container>
  );
}
