import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getPlatformOverview,
  listExpiringSubscriptions,
  listRefundCandidates,
} from "../api/adminApi";
import { useAdminSocket } from "../hooks/useAdminSocket";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { adminRoutes } from "../../utils/routes";
import { formatAdminTime } from "../utils/adminFormatters";
import { normalizeRefundCandidates } from "../utils/refundHelpers";

const AdminDashboardPage = () => {
  const [overview, setOverview] = useState(null);
  const [expiring, setExpiring] = useState(null);
  const [refundCount, setRefundCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { connected, events, clearEvents } = useAdminSocket(true);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewData, expiringData, refundsData] = await Promise.all([
        getPlatformOverview(),
        listExpiringSubscriptions(7),
        listRefundCandidates(),
      ]);
      setOverview(overviewData);
      setExpiring(expiringData);
      setRefundCount(normalizeRefundCandidates(refundsData).length);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load platform overview.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (!events.length) return;
    const latest = events[0];
    if (
      latest.type === "registration.created" ||
      latest.type === "registration.approved"
    ) {
      loadOverview();
    }
  }, [events, loadOverview]);

  if (loading) {
    return <p className="admin-empty">Loading platform overview…</p>;
  }

  if (error && !overview) {
    return <div className="admin-error">{error}</div>;
  }

  const restaurants = overview?.restaurants;
  const payments = overview?.payments;
  const expiringList = expiring?.subscriptions || expiring?.items || [];

  const eventLabel = (event) => {
    if (event.type === "registration.created") {
      return `New registration — ${event.payload?.restaurantName || event.payload?.clientId || "venue"}`;
    }
    if (event.type === "registration.approved") {
      return `Approved — ${event.payload?.restaurantName || event.payload?.clientId || "venue"}`;
    }
    return event.type;
  };

  return (
    <>
      <header className="admin-header">
        <div>
          <h1>Platform overview</h1>
          <p>
            {overview?.date || "Today"} · Live updates{" "}
            <AdminStatusBadge
              status={connected ? "active" : "cancelled"}
              label={connected ? "Connected" : "Offline"}
            />
          </p>
        </div>
        <button type="button" className="admin-btn admin-btn--ghost" onClick={loadOverview}>
          Refresh
        </button>
      </header>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-grid">
        <div className="admin-card">
          <div className="admin-card__label">Total venues</div>
          <div className="admin-card__value">{restaurants?.total ?? 0}</div>
          <div className="admin-card__hint">
            {restaurants?.active ?? 0} currently open for orders
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card__label">Pending review</div>
          <div className="admin-card__value">{restaurants?.pendingReview ?? 0}</div>
          <div className="admin-card__hint">
            <Link to={`${adminRoutes.hotels}?status=submitted`}>Review submitted →</Link>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card__label">Paid orders today</div>
          <div className="admin-card__value">{payments?.todayOrderCount ?? 0}</div>
          <div className="admin-card__hint">
            <Link to={adminRoutes.payments}>View orders →</Link>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card__label">GMV today</div>
          <div className="admin-card__value">₹{payments?.todayGmv ?? 0}</div>
          <div className="admin-card__hint">
            Platform fees ₹{payments?.todayPlatformFees ?? 0}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card__label">Expiring subscriptions</div>
          <div className="admin-card__value">{expiring?.count ?? expiringList.length}</div>
          <div className="admin-card__hint">
            <Link to={`${adminRoutes.subscriptions}?tab=expiring`}>View expiring →</Link>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card__label">Refund eligible</div>
          <div className="admin-card__value">{refundCount}</div>
          <div className="admin-card__hint">
            <Link to={adminRoutes.refunds}>Review candidates →</Link>
          </div>
        </div>
      </div>

      <div className="admin-split-layout">
        <section className="admin-section admin-split-layout__main">
          <h2 className="admin-section__title">Registration pipeline</h2>
          <div className="admin-grid">
            {Object.entries(restaurants?.byStatus || {}).map(([status, count]) => (
              <Link
                key={status}
                to={`${adminRoutes.hotels}?status=${status}`}
                className="admin-card admin-card--link"
              >
                <div className="admin-card__label">{status}</div>
                <div className="admin-card__value">{count}</div>
              </Link>
            ))}
          </div>
        </section>

        <aside className="admin-split-layout__side">
          <section className="admin-card admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section__title">Live activity</h2>
              {events.length > 0 && (
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost admin-btn--small"
                  onClick={clearEvents}
                >
                  Clear
                </button>
              )}
            </div>
            {!events.length ? (
              <p className="admin-card__hint">Waiting for registration events…</p>
            ) : (
              <ul className="admin-live-feed">
                {events.map((event) => (
                  <li key={event.id} className="admin-live-feed__item">
                    <AdminStatusBadge
                      status={event.type === "registration.approved" ? "approved" : "submitted"}
                      label={event.type === "registration.approved" ? "Approved" : "New"}
                    />
                    <div>
                      <div>{eventLabel(event)}</div>
                      <div className="admin-card__hint">{formatAdminTime(event.at)}</div>
                    </div>
                    {event.payload?.clientId && (
                      <Link
                        to={adminRoutes.hotelDetail(event.payload.clientId)}
                        className="admin-btn admin-btn--ghost admin-btn--small"
                      >
                        View
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </>
  );
};

export default AdminDashboardPage;
