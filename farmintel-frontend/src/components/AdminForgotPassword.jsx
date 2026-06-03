import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

function AdminForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");

    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Error");

      setMsg("Password reset successful. Check your email or use new password.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-card">

        <div className="auth-brand">
          <span className="brand-farm">FARM</span>
          <span className="brand-intel">INTEL</span>
        </div>

        <h2 className="auth-heading">Admin Forgot Password</h2>
        <p className="auth-sub">Reset your admin password</p>

        {error && <div className="auth-error">{error}</div>}
        {msg && <div className="auth-info-box">{msg}</div>}

        <form onSubmit={handleSubmit}>

          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              type="email"
              className="auth-input"
              placeholder="Enter admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button className="auth-btn" type="submit">
            Reset Password
          </button>

        </form>

        <div className="auth-footer">
          <button
            className="auth-link"
            onClick={() => navigate("/admin")}
          >
            Back to Login
          </button>
        </div>

      </div>
    </div>
  );
}

export default AdminForgotPassword;
