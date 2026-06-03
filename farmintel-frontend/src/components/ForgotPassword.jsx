import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import "./auth.css";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const handleSend = async () => {
    await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ email })
    });
    alert("Reset link sent");
  };

  return (
    <div className="auth-root">
      <div className="auth-card">

        <input className="auth-input"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)} />

        <button className="auth-btn" onClick={handleSend}>
          Send Reset Link
        </button>

        <button className="auth-link" onClick={() => navigate("/")}>
          Back to login
        </button>

      </div>
    </div>
  );
}
