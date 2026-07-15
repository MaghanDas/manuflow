import { NavLink } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { logout } from "../features/auth/authSlice";

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  gap: 4,
  padding: "10px 4px",
  borderRadius: 6,
  color: isActive ? "#fff" : "#8791a1",
  background: isActive ? "var(--color-rail-active)" : "transparent",
  fontSize: 10,
  fontFamily: "var(--font-mono)",
  textDecoration: "none",
  letterSpacing: "0.02em",
});

export function NavRail() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  return (
    <nav
      style={{
        background: "var(--color-rail)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 8px",
        gap: 6,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: "var(--color-accent-amber)",
          marginBottom: 18,
        }}
        title="ManuFlow"
      />

      {user?.role === "CLIENT" && (
        <>
          <NavLink to="/orders/new" style={linkStyle}>
            <span>+</span>
            New job
          </NavLink>
          <NavLink to="/orders" style={linkStyle}>
            <span>▤</span>
            My orders
          </NavLink>
        </>
      )}

      {(user?.role === "OPERATOR" || user?.role === "ADMIN") && (
        <NavLink to="/queue" style={linkStyle}>
          <span>▥</span>
          Queue
        </NavLink>
      )}

      {user?.role === "ADMIN" && (
        <NavLink to="/dashboard" style={linkStyle}>
          <span>◫</span>
          Dashboard
        </NavLink>
      )}

      <div style={{ flex: 1 }} />

      <button
        onClick={() => dispatch(logout())}
        style={{
          background: "none",
          border: "none",
          color: "#8791a1",
          fontFamily: "var(--font-mono)",
          fontSize: 10,
        }}
      >
        Sign out
      </button>
    </nav>
  );
}
