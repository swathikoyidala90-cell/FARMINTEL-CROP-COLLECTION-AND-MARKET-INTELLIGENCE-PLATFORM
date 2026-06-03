import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import "./auth.css";

export default function StaffLogin({ onLogin }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/auth/staff/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Invalid credentials");
        return;
      }

      //  save user
      onLogin(data);

      //  go to staff dashboard
      navigate("/staff/dashboard");

    } catch {
      setError("Server error");
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-card">

        <div className="auth-brand">Staff Login</div>

        {error && <p className="error-text">{error}</p>}

        <input
          className="auth-input"
          placeholder="Email"
          onChange={e => setForm({ ...form, email: e.target.value })}
        />

        <br /><br />

        <input
          className="auth-input"
          type="password"
          placeholder="Password"
          onChange={e => setForm({ ...form, password: e.target.value })}
        />

        <br /><br />

        <button className="auth-btn" onClick={handleLogin}>
          Login
        </button>

        <button className="auth-link" onClick={() => navigate("/staff/forgot")}>
          Forgot Password?
        </button>

        <button className="auth-link" onClick={() => navigate("/")}>
          Back
        </button>

      </div>
    </div>
  );
}
