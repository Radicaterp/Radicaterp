import { useState, useEffect, createContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import Home from "./pages/Home";
import Applications from "./pages/Applications";
import MyApplications from "./pages/MyApplications";
import AdminPanel from "./pages/AdminPanel";
import About from "./pages/About";
import AuthCallback from "./pages/AuthCallback";
import Report from "./pages/Report";
import MyReports from "./pages/MyReports";
import Staff from "./pages/Staff";
import HeadAdminPanel from "./pages/HeadAdminPanel";
import SuperAdminPanel from "./pages/SuperAdminPanel";
import FiveMPanel from "./pages/FiveMPanel";
import SearchApplications from "./pages/SearchApplications";
import FAQ from "./pages/FAQ";
import { Toaster } from "@/components/ui/sonner";
import SnowEffect from "./components/SnowEffect";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Configure axios defaults to always send credentials
axios.defaults.withCredentials = true;

export const AuthContext = createContext(null);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      setUser(null);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="text-[#4A90E2] text-xl">Indlæser...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout, checkAuth }}>
      <div className="App">
        <SnowEffect />
        <Toaster position="top-right" />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/about" element={<About />} />
            <Route path="/staff" element={<Staff />} />
            <Route
              path="/applications"
              element={user ? <Applications /> : <Navigate to="/" />}
            />
            <Route
              path="/my-applications"
              element={user ? <MyApplications /> : <Navigate to="/" />}
            />
            <Route
              path="/report"
              element={user ? <Report /> : <Navigate to="/" />}
            />
            <Route
              path="/my-reports"
              element={user ? <MyReports /> : <Navigate to="/" />}
            />
            <Route
              path="/admin"
              element={
                user && user.is_admin ? <AdminPanel /> : <Navigate to="/" />
              }
            />
            <Route
              path="/head-admin"
              element={
                user && user.is_head_admin ? <HeadAdminPanel /> : <Navigate to="/" />
              }
            />
            <Route
              path="/super-admin"
              element={
                user && user.is_admin ? <SuperAdminPanel /> : <Navigate to="/" />
              }
            />
            <Route
              path="/fivem-panel"
              element={
                user && user.is_admin ? <FiveMPanel /> : <Navigate to="/" />
              }
            />
            <Route
              path="/search-applications"
              element={
                user && user.is_admin ? <SearchApplications /> : <Navigate to="/" />
              }
            />
            <Route path="/faq" element={<FAQ />} />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthContext.Provider>
  );
}

export default App;
