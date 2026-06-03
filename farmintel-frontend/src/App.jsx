import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import FarmerDashboard from "./components/FarmerDashboard";
import CustomerDashboard from "./components/CustomerDashboard";
import CropDetails from "./components/CropDetails";

import AdminLogin from "./components/AdminLogin";
import AdminForgotPassword from "./components/AdminForgotPassword";
import AdminDashboard from "./components/AdminDashboard";

import StaffLogin from "./components/StaffLogin";
import StaffForgot from "./components/StaffForgot";
import StaffDashboard from "./components/StaffDashboard";

import bg from "./assets/bg2.jpg";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser && savedUser !== "undefined") {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed?.id) setUser(parsed);
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  const handleLogin = (data) => {
    const role =
      typeof data.role === "object"
        ? data.role.name
        : data.role;

    const userData = {
      id: data.id,
      email: data.email,
      role: role,
    };

    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <div style={{ backgroundImage: `url(${bg})`, backgroundSize: "cover", minHeight: "100vh" }}>
      <Routes>

        {/* Main login for farmer and customer accounts */}
        <Route
          path="/"
          element={
            user ? (
              user.role === "FARMER" ? (
                <FarmerDashboard user={user} onLogout={handleLogout} />
              ) : user.role === "CUSTOMER" ? (
                <CustomerDashboard user={user} onLogout={handleLogout} />
              ) : (
                <Login onLogin={handleLogin} />
              )
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />

        {/* REGISTER */}
        <Route path="/register" element={<Register onRegister={handleLogin} />} />

        {/* FORGOT */}
        <Route path="/forgot" element={<ForgotPassword />} />

        {/* FARMER */}
        <Route
          path="/farmer"
          element={
            user?.role === "FARMER" ? (
              <FarmerDashboard user={user} onLogout={handleLogout} />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />

        {/* CUSTOMER */}
        <Route
          path="/customer"
          element={
            user?.role === "CUSTOMER" ? (
              <CustomerDashboard user={user} onLogout={handleLogout} />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />

        {/* ================= STAFF ================= */}
        <Route path="/staff" element={<StaffLogin onLogin={handleLogin} />} />
        <Route path="/staff/forgot" element={<StaffForgot />} />

        <Route
          path="/staff/dashboard"
          element={
            user?.role === "STAFF" ? (
              <StaffDashboard user={user} onLogout={handleLogout} />
            ) : (
              <StaffLogin onLogin={handleLogin} />
            )
          }
        />

        {/* ================= ADMIN ================= */}
        <Route path="/admin" element={<AdminLogin onLogin={handleLogin} />} />
        <Route path="/admin/forgot" element={<AdminForgotPassword />} />

        <Route
          path="/admin/dashboard"
          element={
            user?.role === "ADMIN" ? (
              <AdminDashboard user={user} onLogout={handleLogout} />
            ) : (
              <AdminLogin onLogin={handleLogin} />
            )
          }
        />

        {/* CROP DETAILS */}
        <Route path="/crop/:id" element={<CropDetails />} />

      </Routes>
    </div>
  );
}

export default App;
