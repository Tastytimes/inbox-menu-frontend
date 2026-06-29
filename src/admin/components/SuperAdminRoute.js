import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { adminRoutes } from "../../utils/routes";

const SuperAdminRoute = () => {
  const { isAuth, isSuperAdmin } = useAdminAuth();

  if (!isAuth) {
    return <Navigate to={adminRoutes.login} replace />;
  }

  if (!isSuperAdmin) {
    return <Navigate to={adminRoutes.dashboard} replace />;
  }

  return <Outlet />;
};

export default SuperAdminRoute;
