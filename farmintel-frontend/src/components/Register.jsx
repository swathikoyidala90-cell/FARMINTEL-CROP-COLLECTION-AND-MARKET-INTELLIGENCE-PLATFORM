import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import "./auth.css";

export default function Register({ onRegister }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "",
    address: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError("");

    //  Basic validation
    if (!form.name || !form.email || !form.password || !form.role) {
      setError("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      //  Save user (optional - for global state)
      if (onRegister) onRegister(data);

      //  Store in localStorage (recommended)
      localStorage.setItem("user", JSON.stringify(data));

      //  Role-based navigation
      if (data.role === "FARMER") {
        navigate("/farmer");
      } else {
        navigate("/customer");
      }

    } catch (err) {
      console.error(err);
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-card">

        <div className="auth-brand">FarmIntel</div>

        {/*  Error Message */}
        {error && <p className="error-text">{error}</p>}

        <input
          className="auth-input"
          placeholder="Name"
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
        <br></br>
        <br></br>
        <input
          className="auth-input"
          placeholder="Email"
          onChange={e => setForm({ ...form, email: e.target.value })}
        />
        <br></br>
        <br></br>
        <input
          className="auth-input"
          type="password"
          placeholder="Password"
          onChange={e => setForm({ ...form, password: e.target.value })}
        />
        <br></br>
        <br></br>
        <input
          className="auth-input"
          placeholder="Phone"
          onChange={e => setForm({ ...form, phone: e.target.value })}
        />
        <br></br>
        <br></br>
        <select
          className="auth-select"
          onChange={e => setForm({ ...form, role: e.target.value })}
        >
          <option value="">Select Role</option>
          <option value="FARMER">Farmer</option>
          <option value="CUSTOMER">Customer</option>
        </select>
        <br></br>
        <br></br>
        {/*  Show address only for farmer */}
        {form.role === "FARMER" && (
          <input
            className="auth-input"
            placeholder="Address"
            onChange={e => setForm({ ...form, address: e.target.value })}
          />
        )}

        <button
          className="auth-btn"
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <button
          className="auth-link"
          onClick={() => navigate("/")}
        >
          Back to Login
        </button>

      </div>
    </div>
  );
}
