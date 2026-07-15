import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { register } from "../features/auth/authSlice";
import type { Role } from "../types";

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { token, status, error } = useAppSelector((state) => state.auth);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("CLIENT");
  const [companyName, setCompanyName] = useState("");

  if (token) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await dispatch(
      register({ username, email, password, role, company_name: companyName })
    );
    if (register.fulfilled.match(result)) {
      navigate("/");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg)" }}>
      <form onSubmit={onSubmit} className="card" style={{ width: 420 }}>
        <div className="eyebrow">MANUFLOW</div>
        <h1 style={{ fontSize: 24, marginBottom: 20 }}>Create an account</h1>

        <div className="form-grid">
          <div className="form-row">
            <label className="field-label" htmlFor="role">I am a</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="CLIENT">Client — I submit job orders</option>
              <option value="OPERATOR">Operator — I run the production queue</option>
            </select>
          </div>
          <div className="form-row">
            <label className="field-label" htmlFor="username">Username</label>
            <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
        </div>

        <div className="form-row" style={{ marginTop: 14 }}>
          <label className="field-label" htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        {role === "CLIENT" && (
          <div className="form-row" style={{ marginTop: 14 }}>
            <label className="field-label" htmlFor="company">Company name</label>
            <input id="company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
        )}

        <div className="form-row" style={{ marginTop: 14 }}>
          <label className="field-label" htmlFor="password">Password</label>
          <input id="password" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: 20 }} disabled={status === "loading"}>
          {status === "loading" ? "Creating account..." : "Create account"}
        </button>

        <p style={{ marginTop: 16, fontSize: 13, textAlign: "center", color: "var(--color-ink-muted)" }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
