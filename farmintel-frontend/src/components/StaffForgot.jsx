import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import "./auth.css";

export default function StaffForgot() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1);
  const [msg, setMsg] = useState("");

  // STEP 1  get token
  const sendEmail = async () => {
    const res = await fetch(`${API_BASE_URL}/auth/staff/forgot?email=${encodeURIComponent(email)}`, {
      method: "POST",
    });

    const text = await res.text();

    setMsg(text);
    setStep(2);
  };

  // STEP 2  reset password
  const resetPassword = async () => {
    const res = await fetch(
      `${API_BASE_URL}/auth/staff/reset?token=${encodeURIComponent(token)}&newPassword=${encodeURIComponent(newPassword)}`,
      { method: "POST" }
    );

    const text = await res.text();

    setMsg(text);

    setTimeout(() => navigate("/staff"), 2000);
  };

  return (
    <div className="auth-root">
      <div className="auth-card">

        <div className="auth-brand">Staff Forgot Password</div>

        <p>{msg}</p>

        {step === 1 && (
          <>
            <input
              className="auth-input"
              placeholder="Enter Email"
              onChange={e => setEmail(e.target.value)}
            />

            <br /><br />

            <button className="auth-btn" onClick={sendEmail}>
              Get Reset Token
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <input
              className="auth-input"
              placeholder="Enter Token"
              onChange={e => setToken(e.target.value)}
            />

            <br /><br />

            <input
              className="auth-input"
              type="password"
              placeholder="New Password"
              onChange={e => setNewPassword(e.target.value)}
            />

            <br /><br />

            <button className="auth-btn" onClick={resetPassword}>
              Reset Password
            </button>
          </>
        )}

        <button className="auth-link" onClick={() => navigate("/staff")}>
          Back to Login
        </button>

      </div>
    </div>
  );
}
