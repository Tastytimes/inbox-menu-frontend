import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { adminRoutes } from "../../utils/routes";
import { getStoredAdminAuth } from "../utils/adminAuthStorage";

const ProtectedRoute = () => {
  const { isAuth, token } = useAdminAuth();
  const stored = getStoredAdminAuth();

  if (!isAuth || !token || !stored?.token) {
    return <Navigate to={adminRoutes.login} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
