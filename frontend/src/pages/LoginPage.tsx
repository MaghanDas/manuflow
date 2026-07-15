import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { login } from "../features/auth/authSlice";

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { token, status, error } = useAppSelector((state) => state.auth);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (token) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await dispatch(login({ username, password }));
    if (login.fulfilled.match(result)) {
      navigate("/");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg)" }}>
      <form onSubmit={onSubmit} className="card" style={{ width: 380 }}>
        <div className="eyebrow">MANUFLOW</div>
        <h1 style={{ fontSize: 24, marginBottom: 20 }}>Sign in to the shop floor</h1>

        <div className="form-row">
          <label className="field-label" htmlFor="username">Username</label>
          <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
        </div>
        <div className="form-row" style={{ marginTop: 14 }}>
          <label className="field-label" htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: 20 }} disabled={status === "loading"}>
          {status === "loading" ? "Signing in..." : "Sign in"}
        </button>

        <p style={{ marginTop: 16, fontSize: 13, textAlign: "center", color: "var(--color-ink-muted)" }}>
          New here? <Link to="/register">Create an account</Link>
        </p>

        <p style={{ marginTop: 12, fontSize: 11, textAlign: "center", color: "var(--color-ink-muted)" }}>
          Demo accounts: admin / admin12345 · operator1 / operator12345 · client1 / client12345
        </p>
      </form>
    </div>
  );
}
