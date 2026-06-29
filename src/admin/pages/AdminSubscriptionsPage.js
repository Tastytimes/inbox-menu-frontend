import React, { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  cancelPlatformSubscription,
  createPlatformSubscription,
  listExpiringSubscriptions,
  listPlatformSubscriptions,
  listSubscriptionPlans,
  updatePlatformSubscription,
} from "../api/adminApi";
import AdminStatusBadge from "../components/AdminStatusBadge";
import {
  SUBSCRIPTION_STATUS_FILTERS,
  formToSubscriptionGrant,
  getExpiryLabel,
  getSubscriptionExpiryInfo,
  getSubscriptionRowClass,
  sortSubscriptionsByExpiry,
  subscriptionGrantToForm,
} from "../utils/subscriptionAdminHelpers";
import { formatAdminTime } from "../utils/adminFormatters";
import { adminRoutes } from "../../utils/routes";

const TABS = [
  { value: "all", label: "All subscriptions" },
  { value: "expiring", label: "Expiring soon" },
  { value: "grant", label: "Manual grant" },
];

const AdminSubscriptionsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "all";
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [clientIdFilter, setClientIdFilter] = useState(searchParams.get("clientId") || "");
  const [expiringDays, setExpiringDays] = useState(Number(searchParams.get("days")) || 7);
  const [data, setData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [grantForm, setGrantForm] = useState(subscriptionGrantToForm());
  const [updatingId, setUpdatingId] = useState(null);

  const loadPlans = useCallback(async () => {
    try {
      const response = await listSubscriptionPlans();
      const list = response?.plans || response?.subscriptionPlans || response || [];
      setPlans(Array.isArray(list) ? list : []);
    } catch {
      setPlans([]);
    }
  }, []);

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "expiring") {
        const response = await listExpiringSubscriptions(expiringDays);
        setData(response);
      } else if (tab !== "grant") {
        const response = await listPlatformSubscriptions({
          status: statusFilter || undefined,
          clientId: clientIdFilter || undefined,
        });
        setData(response);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not load subscriptions.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tab, statusFilter, clientIdFilter, expiringDays]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    if (tab === "grant") {
      setLoading(false);
      return;
    }
    loadSubscriptions();
  }, [loadSubscriptions, tab]);

  useEffect(() => {
    const params = { tab };
    if (statusFilter) params.status = statusFilter;
    if (clientIdFilter) params.clientId = clientIdFilter;
    if (tab === "expiring") params.days = String(expiringDays);
    setSearchParams(params, { replace: true });
  }, [tab, statusFilter, clientIdFilter, expiringDays, setSearchParams]);

  const subscriptions = sortSubscriptionsByExpiry(
    data?.subscriptions || data?.items || (Array.isArray(data) ? data : [])
  );

  const handleGrant = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");
    try {
      await createPlatformSubscription(formToSubscriptionGrant(grantForm));
      setSuccessMessage("Subscription granted.");
      setGrantForm(subscriptionGrantToForm());
      setSearchParams({ tab: "all" }, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Could not grant subscription.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (subscription) => {
    if (!window.confirm(`Cancel subscription for client ${subscription.clientId}?`)) return;
    setUpdatingId(subscription.id);
    setError("");
    setSuccessMessage("");
    try {
      await cancelPlatformSubscription(subscription.id);
      setSuccessMessage("Subscription cancelled.");
      await loadSubscriptions();
    } catch (err) {
      setError(err.response?.data?.message || "Could not cancel subscription.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkActive = async (subscription) => {
    setUpdatingId(subscription.id);
    setError("");
    setSuccessMessage("");
    try {
      await updatePlatformSubscription(subscription.id, { status: "active" });
      setSuccessMessage("Subscription updated.");
      await loadSubscriptions();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update subscription.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <header className="admin-header">
        <div>
          <h1>Restaurant subscriptions</h1>
          <p>View, grant, and manage venue subscription coverage.</p>
        </div>
        {tab !== "grant" && (
          <button type="button" className="admin-btn admin-btn--ghost" onClick={loadSubscriptions}>
            Refresh
          </button>
        )}
      </header>

      <div className="admin-filters">
        {TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`admin-btn admin-btn--small${
              tab === item.value ? " admin-btn--primary" : " admin-btn--ghost"
            }`}
            onClick={() => setSearchParams({ tab: item.value }, { replace: true })}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <div className="admin-error">{error}</div>}
      {successMessage && <div className="admin-success">{successMessage}</div>}

      {tab === "grant" && (
        <section className="admin-card admin-section">
          <h2 className="admin-section__title">Manual grant</h2>
          <form onSubmit={handleGrant} className="admin-restaurant-form">
            <div className="admin-field">
              <label htmlFor="grantClientId">Client ID</label>
              <input
                id="grantClientId"
                type="number"
                value={grantForm.clientId}
                onChange={(event) => setGrantForm({ ...grantForm, clientId: event.target.value })}
                required
              />
            </div>
            <div className="admin-field">
              <label htmlFor="grantPlanCode">Plan code</label>
              <select
                id="grantPlanCode"
                value={grantForm.planCode}
                onChange={(event) => setGrantForm({ ...grantForm, planCode: event.target.value })}
                required
              >
                <option value="">Select plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.code || plan.planCode}>
                    {plan.name || plan.planName || plan.code || plan.planCode}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label htmlFor="grantQuantity">Quantity</label>
              <input
                id="grantQuantity"
                type="number"
                min="1"
                value={grantForm.quantity}
                onChange={(event) => setGrantForm({ ...grantForm, quantity: event.target.value })}
              />
            </div>
            <div className="admin-field">
              <label htmlFor="grantStatus">Status</label>
              <select
                id="grantStatus"
                value={grantForm.status}
                onChange={(event) => setGrantForm({ ...grantForm, status: event.target.value })}
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="admin-field admin-field--full">
              <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
                {saving ? "Granting…" : "Grant subscription"}
              </button>
            </div>
          </form>
        </section>
      )}

      {tab === "all" && (
        <div className="admin-filters">
          <div className="admin-field" style={{ marginBottom: 0, minWidth: "160px" }}>
            <label htmlFor="subStatus">Status</label>
            <select
              id="subStatus"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              {SUBSCRIPTION_STATUS_FILTERS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field" style={{ marginBottom: 0, minWidth: "160px" }}>
            <label htmlFor="subClientId">Client ID</label>
            <input
              id="subClientId"
              type="number"
              value={clientIdFilter}
              onChange={(event) => setClientIdFilter(event.target.value)}
              placeholder="Filter by client"
            />
          </div>
        </div>
      )}

      {tab === "expiring" && (
        <div className="admin-filters">
          <div className="admin-field" style={{ marginBottom: 0, minWidth: "160px" }}>
            <label htmlFor="expiringDays">Within days</label>
            <input
              id="expiringDays"
              type="number"
              min="1"
              max="90"
              value={expiringDays}
              onChange={(event) => setExpiringDays(Number(event.target.value) || 7)}
            />
          </div>
        </div>
      )}

      {tab !== "grant" && (
        <section className="admin-section">
          <h2 className="admin-section__title">
            {tab === "expiring"
              ? `Expiring in ${expiringDays} days (${data?.count ?? subscriptions.length})`
              : `Subscriptions (${data?.count ?? subscriptions.length})`}
          </h2>
          {loading ? (
            <p className="admin-empty">Loading subscriptions…</p>
          ) : !subscriptions.length ? (
            <p className="admin-empty">No subscriptions found.</p>
          ) : (
            <>
              <div className="admin-expiry-legend">
                <span className="admin-expiry-legend__item admin-sub-row--expired">
                  Expired
                </span>
                <span className="admin-expiry-legend__item admin-sub-row--urgent">
                  Expires in &lt; 3 days
                </span>
                <span className="admin-expiry-legend__item admin-sub-row--warning">
                  Expires in &lt; 7 days
                </span>
              </div>
              <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Start</th>
                    <th>End</th>
                    {tab === "expiring" && <th>Days left</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => {
                    const expiry = getSubscriptionExpiryInfo(sub);
                    const expiryLabel = getExpiryLabel(expiry.daysUntilExpiry);
                    return (
                    <tr key={sub.id} className={getSubscriptionRowClass(expiry.tier)}>
                      <td>
                        {sub.clientId ? (
                          <Link to={adminRoutes.hotelDetail(sub.clientId)}>{sub.clientId}</Link>
                        ) : (
                          "—"
                        )}
                        {sub.restaurantName && (
                          <div className="admin-card__hint">{sub.restaurantName}</div>
                        )}
                      </td>
                      <td>
                        <div>{sub.planName || sub.planCode || sub.plan?.name || sub.plan?.code || "—"}</div>
                        {(sub.planCode || sub.plan?.code) && (sub.planName || sub.plan?.name) && (
                          <div className="admin-card__hint">{sub.planCode || sub.plan?.code}</div>
                        )}
                      </td>
                      <td>
                        <AdminStatusBadge status={sub.status} label={sub.status || "—"} />
                      </td>
                      <td>{formatAdminTime(sub.startDate)}</td>
                      <td>
                        <div>{formatAdminTime(sub.endDate)}</div>
                        {expiryLabel && (
                          <div className="admin-card__hint">{expiryLabel}</div>
                        )}
                      </td>
                      {tab === "expiring" && (
                        <td>{expiry.daysUntilExpiry ?? sub.daysUntilExpiry ?? "—"}</td>
                      )}
                      <td>
                        <div className="admin-action-row">
                          {sub.status !== "active" && (
                            <button
                              type="button"
                              className="admin-btn admin-btn--green admin-btn--small"
                              disabled={updatingId === sub.id}
                              onClick={() => handleMarkActive(sub)}
                            >
                              Activate
                            </button>
                          )}
                          {sub.status === "active" && (
                            <button
                              type="button"
                              className="admin-btn admin-btn--ghost admin-btn--small"
                              disabled={updatingId === sub.id}
                              onClick={() => handleCancel(sub)}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
          )}
        </section>
      )}
    </>
  );
};

export default AdminSubscriptionsPage;
