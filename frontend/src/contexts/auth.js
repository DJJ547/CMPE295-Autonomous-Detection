// src/contexts/auth.js
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = {
      id:        localStorage.getItem("user_id"),
      token:     localStorage.getItem("token"),
      email:     localStorage.getItem("email"),
      firstname: localStorage.getItem("firstname"),
      lastname:  localStorage.getItem("lastname"),
      role:      localStorage.getItem("role"),
    };

    if (storedUser.id && storedUser.token) {
      setUser(storedUser);
    }

    setLoading(false);
  }, []);

  const login = (data) => {
    localStorage.setItem("user_id", data.id);
    localStorage.setItem("token", data.token);
    localStorage.setItem("email", data.email);
    localStorage.setItem("firstname", data.firstname);
    localStorage.setItem("lastname", data.lastname);
    localStorage.setItem("role", data.role);
    setUser(data);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
