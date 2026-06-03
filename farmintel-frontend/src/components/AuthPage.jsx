import { useState } from "react";
import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";
import "./auth.css";

export default function AuthPage() {
  const [view, setView] = useState("login");

  return (
    <div className="container">
      <div className="card">

        {view === "login" && (
          <>
            <Login />
            <p>
              Don't have an account?{" "}
              <span onClick={() => setView("register")} className="link">
                Register
              </span>
            </p>
            <p>
              <span onClick={() => setView("forgot")} className="link">
                Forgot Password?
              </span>
            </p>
          </>
        )}

        {view === "register" && (
          <>
            <Register />
            <p>
              Already have an account?{" "}
              <span onClick={() => setView("login")} className="link">
                Login
              </span>
            </p>
          </>
        )}

        {view === "forgot" && (
          <>
            <ForgotPassword />
            <p>
              Back to{" "}
              <span onClick={() => setView("login")} className="link">
                Login
              </span>
            </p>
          </>
        )}

      </div>
    </div>
  );
}