import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import "./auth.css";

export default function Login({ onLogin }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Invalid email or password.");
        return;
      }

      onLogin(data);
    } catch {
      setError("Cannot connect to server. Is it running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-card">

        <div className="auth-brand">FarmIntel</div>
        <h1 className="auth-heading">Welcome back</h1>
        <p className="auth-sub">Sign in to your account</p>

        {error && <div className="auth-toast error">{error}</div>}

        <input
          className="auth-input"
          placeholder="Email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />
        <br></br>
        <br></br>
        <input
          className="auth-input"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />
        <br></br>
        <br></br>
        <button className="auth-btn" onClick={handleLogin}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
        <br></br>
        <br></br>
        <button className="auth-link" onClick={() => navigate("/register")}>
          Create one
        </button>
        <br></br>
        
        <button className="auth-link" onClick={() => navigate("/forgot")}>
          Forgot password?
        </button>

      </div>
    </div>
  );
}
