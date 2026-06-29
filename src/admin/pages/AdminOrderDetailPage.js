import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminOrderDetailView from "../components/AdminOrderDetailView";
import { adminRoutes } from "../../utils/routes";

const AdminOrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  return (
    <>
      <header className="admin-header">
        <div>
          <p className="admin-card__hint" style={{ marginBottom: "0.35rem" }}>
            <Link to={adminRoutes.payments}>Orders & payments</Link> / Order detail
          </p>
          <h1>Order detail</h1>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          onClick={() => navigate(adminRoutes.payments)}
        >
          ← Back to orders
        </button>
      </header>

      <div className="admin-card admin-order-detail-page">
        <AdminOrderDetailView
          orderId={orderId}
          onClose={() => navigate(adminRoutes.payments)}
          layout="page"
        />
      </div>
    </>
  );
};

export default AdminOrderDetailPage;
