import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  BRAND_LOGO,
  BRAND_NAME,
  BRAND_NAME_KANNADA,
  BRAND_TAGLINE,
} from "../../constants/brand";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { adminRoutes } from "../../utils/routes";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { isAuth, signIn } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuth) {
    return <Navigate to={adminRoutes.dashboard} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      await signIn({ email, password });
      navigate(adminRoutes.dashboard, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Sign in failed. Check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page admin-login">
      <div className="admin-login__card">
        <div className="admin-login__brand">
          <img src={BRAND_LOGO} alt={BRAND_NAME} />
          <div>
            <h1>{BRAND_NAME.toLowerCase()}</h1>
            <p>
              {BRAND_NAME_KANNADA} · {BRAND_TAGLINE}
            </p>
          </div>
        </div>

        <h2 className="admin-login__title">Company admin</h2>
        <p className="admin-login__subtitle">
          Sign in with your platform admin account to manage hotels, payments, and customer care.
        </p>

        {error && <div className="admin-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="admin-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@sambhrama.com"
              autoComplete="email"
            />
          </div>

          <div className="admin-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="admin-btn admin-btn--primary"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="admin-login__subtitle" style={{ marginTop: "1.25rem", marginBottom: 0 }}>
          <Link to="/">← Back to public site</Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;
