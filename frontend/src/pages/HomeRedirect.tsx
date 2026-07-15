import { Navigate } from "react-router-dom";

import { useAppSelector } from "../app/hooks";

export function HomeRedirect() {
  const user = useAppSelector((state) => state.auth.user);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "CLIENT") return <Navigate to="/orders" replace />;
  if (user.role === "OPERATOR") return <Navigate to="/queue" replace />;
  return <Navigate to="/dashboard" replace />;
}
