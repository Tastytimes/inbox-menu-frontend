import React, { useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { lookupSupportOrders } from "../api/adminApi";
import AdminStatusBadge from "../components/AdminStatusBadge";
import AdminOrderDetailModal from "../components/AdminOrderDetailModal";
import {
  formatAdminAmount,
  formatAdminTime,
  formatOrderLabel,
  isValidIndianPhone,
} from "../utils/adminFormatters";
import { getFulfillmentLabel } from "../../utils/fulfillmentStatus";
import { adminRoutes } from "../../utils/routes";

const AdminSupportPage = () => {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get("clientId");
  const [phone, setPhone] = useState("");
  const [ordersResult, setOrdersResult] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState("");

  if (clientId) {
    return <Navigate to={adminRoutes.hotelDetail(clientId)} replace />;
  }

  const handleOrderLookup = async (event) => {
    event.preventDefault();
    setError("");
    setOrdersResult(null);
    setSelectedOrderId(null);

    if (!isValidIndianPhone(phone)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    setLoadingOrders(true);
    try {
      const data = await lookupSupportOrders(phone.trim());
      setOrdersResult(data);
      if (data.orders?.length === 1) {
        setSelectedOrderId(data.orders[0].orderId);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not look up orders for this phone.");
    } finally {
      setLoadingOrders(false);
    }
  };

  return (
    <>
      <header className="admin-header">
        <div>
          <h1>Customer care</h1>
          <p>Look up customer orders by phone and view payment sync details.</p>
        </div>
      </header>

      {error && <div className="admin-error">{error}</div>}

      <section className="admin-card admin-section">
        <h2 className="admin-section__title">Order lookup</h2>
        <form onSubmit={handleOrderLookup} className="admin-support-lookup">
          <div className="admin-field">
            <label htmlFor="supportPhone">Customer phone</label>
            <input
              id="supportPhone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
              placeholder="10-digit mobile number"
            />
          </div>
          <button
            type="submit"
            className="admin-btn admin-btn--primary"
            disabled={loadingOrders}
          >
            {loadingOrders ? "Searching…" : "Find orders"}
          </button>
        </form>
      </section>

      {ordersResult && (
        <section className="admin-card admin-section">
          <h2 className="admin-section__title">
            {ordersResult.count} order(s) for {ordersResult.customerPhone}
          </h2>
          {!ordersResult.orders?.length ? (
            <p className="admin-empty">No orders found.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table admin-table--clickable">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Restaurant</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Fulfillment</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersResult.orders.map((order) => (
                    <tr
                      key={order.orderId}
                      className={
                        selectedOrderId === order.orderId ? "admin-table__row--active" : ""
                      }
                      onClick={() => setSelectedOrderId(order.orderId)}
                    >
                      <td>
                        <strong>{formatOrderLabel(order)}</strong>
                      </td>
                      <td>{order.slug || order.clientId || "—"}</td>
                      <td>{formatAdminAmount(order.pricing?.customerPayAmount)}</td>
                      <td>
                        <AdminStatusBadge
                          status={order.paymentStatus}
                          label={order.paymentStatus}
                        />
                      </td>
                      <td>
                        <AdminStatusBadge
                          status={order.fulfillmentStatus}
                          label={getFulfillmentLabel(order.fulfillmentStatus)}
                        />
                      </td>
                      <td>{formatAdminTime(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {selectedOrderId && (
        <AdminOrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </>
  );
};

export default AdminSupportPage;
