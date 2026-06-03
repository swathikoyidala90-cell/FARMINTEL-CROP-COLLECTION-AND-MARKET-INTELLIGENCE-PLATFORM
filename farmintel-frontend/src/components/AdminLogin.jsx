import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import "./auth.css";

export default function AdminLogin({ onLogin }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Invalid credentials.");
        return;
      }

      // Restrict this entrance to admin accounts.
      const role =
        typeof data.role === "object"
          ? data.role.name
          : data.role;

      if (role !== "ADMIN") {
        setError("Access denied. Not an admin account.");
        return;
      }

      onLogin(data);

      navigate("/admin/dashboard");

    } catch {
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="auth-root">
      <div className="auth-card">

        <div className="auth-brand">
          <span className="brand-farm">Farm</span>
          <span className="brand-intel">Intel</span>
        </div>

        <h1 className="auth-heading">Admin Login</h1>
        <p className="auth-sub">Sign in to manage platform</p>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <div className="auth-field">
          <label className="auth-label">Email</label>
          <input
            className="auth-input"
            type="email"
            placeholder="admin@example.com"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            onKeyDown={handleKey}
          />
        </div>

        <div className="auth-field">
          <label className="auth-label">Password</label>
          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            onKeyDown={handleKey}
          />
        </div>

        <div className="auth-forgot-row">
          <button
            className="auth-link ghost"
            onClick={() => navigate("/admin/forgot")}
          >
            Forgot password?
          </button>
        </div>

        <button
          className="auth-btn"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <div className="auth-divider" />

        <div className="auth-footer">
          Not an admin?{" "}
          <button
            className="auth-link"
            onClick={() => navigate("/")}
          >
            User Login
          </button>
        </div>

      </div>
    </div>
  );
}
