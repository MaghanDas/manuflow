import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "./app/hooks";
import { NavRail } from "./components/NavRail";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { fetchCurrentUser } from "./features/auth/authSlice";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { ClientOrderFormPage } from "./pages/ClientOrderFormPage";
import { ClientOrdersPage } from "./pages/ClientOrdersPage";
import { HomeRedirect } from "./pages/HomeRedirect";
import { LoginPage } from "./pages/LoginPage";
import { OperatorQueuePage } from "./pages/OperatorQueuePage";
import { RegisterPage } from "./pages/RegisterPage";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <NavRail />
      {children}
    </div>
  );
}

export default function App() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);

  useEffect(() => {
    if (token) {
      dispatch(fetchCurrentUser());
    }
  }, [token, dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Shell>
                <HomeRedirect />
              </Shell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders/new"
          element={
            <ProtectedRoute allowedRoles={["CLIENT"]}>
              <Shell>
                <ClientOrderFormPage />
              </Shell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute allowedRoles={["CLIENT"]}>
              <Shell>
                <ClientOrdersPage />
              </Shell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/queue"
          element={
            <ProtectedRoute allowedRoles={["OPERATOR", "ADMIN"]}>
              <Shell>
                <OperatorQueuePage />
              </Shell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Shell>
                <AdminDashboardPage />
              </Shell>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
