import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import SuperAdminRoute from "./components/SuperAdminRoute";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminHotelsPage from "./pages/AdminHotelsPage";
import AdminRestaurantDetailPage from "./pages/AdminRestaurantDetailPage";
import AdminPaymentsPage from "./pages/AdminPaymentsPage";
import AdminTransactionReportsPage from "./pages/AdminTransactionReportsPage";
import AdminSupportPage from "./pages/AdminSupportPage";
import AdminSubscriptionPlansPage from "./pages/AdminSubscriptionPlansPage";
import AdminSubscriptionsPage from "./pages/AdminSubscriptionsPage";
import AdminRefundsPage from "./pages/AdminRefundsPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminOrderDetailPage from "./pages/AdminOrderDetailPage";
import { useAdminAuth } from "./hooks/useAdminAuth";
import { adminRoutes } from "../utils/routes";
import "./admin.css";

const AdminApp = () => {
  const { restoreSession } = useAdminAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    restoreSession().finally(() => setReady(true));
  }, [restoreSession]);

  if (!ready) {
    return <div className="admin-loading">Loading admin…</div>;
  }

  return (
    <div className="admin-page">
      <Routes>
        <Route path="login" element={<AdminLoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="hotels" element={<AdminHotelsPage />} />
            <Route path="hotels/:clientId" element={<AdminRestaurantDetailPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="transaction-reports" element={<AdminTransactionReportsPage />} />
            <Route path="orders/:orderId" element={<AdminOrderDetailPage />} />
            <Route path="subscription-plans" element={<AdminSubscriptionPlansPage />} />
            <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
            <Route path="refunds" element={<AdminRefundsPage />} />
            <Route path="support" element={<AdminSupportPage />} />
            <Route element={<SuperAdminRoute />}>
              <Route path="users" element={<AdminUsersPage />} />
            </Route>
            <Route path="orders" element={<Navigate to={adminRoutes.payments} replace />} />
            <Route path="restaurants" element={<Navigate to={adminRoutes.hotels} replace />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to={adminRoutes.login} replace />} />
      </Routes>
    </div>
  );
};

export default AdminApp;
