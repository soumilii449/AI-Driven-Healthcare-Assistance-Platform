import { createContext, useContext, useEffect, useState } from "react";
import {
  loginUser,
  registerUser,
  getCurrentUser,
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setLoading(false);
      return;
    }

    getCurrentUser()
      .then((data) => {
        setUser(data);
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (username, password) => {
    const data = await loginUser(username, password);

    localStorage.setItem("access_token", data.access_token);

    const currentUser = await getCurrentUser();

    setUser(currentUser);

    return currentUser;
  };

  const register = async (username, password, role = "patient") => {
    return await registerUser(username, password, role);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}