// src/contexts/auth.js
import React, { createContext, useContext, useState, useEffect } from "react";

// 1. Create context
const AuthContext = createContext();

// 2. Provider
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Load user from localStorage on initial mount
  useEffect(() => {
    const storedUser = {
      id: localStorage.getItem("user_id"),
      token: localStorage.getItem("token"),
      email: localStorage.getItem("email"),
      firstname: localStorage.getItem("firstname"),
      lastname: localStorage.getItem("lastname"),
      role: localStorage.getItem("role"),
    };
    if (storedUser.id && storedUser.token) {
      setUser(storedUser);
    }
  }, []);

  // 3. Login method
  const login = (data) => {
    localStorage.setItem("user_id", data.id);
    localStorage.setItem("token", data.token);
    localStorage.setItem("email", data.email);
    localStorage.setItem("firstname", data.firstname);
    localStorage.setItem("lastname", data.lastname);
    localStorage.setItem("role", data.role);
    setUser(data);
  };

  // 4. Logout method
  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 5. Hook
export function useAuth() {
  return useContext(AuthContext);
}
