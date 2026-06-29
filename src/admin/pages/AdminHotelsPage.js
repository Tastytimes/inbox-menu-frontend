import React, { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  listPlatformRestaurants,
  updatePlatformRestaurantStatus,
} from "../api/adminApi";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { adminRoutes } from "../../utils/routes";

const STATUS_FILTERS = [
  { value: "", label: "All statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const REVIEW_STATUSES = new Set(["submitted", "pending"]);

const AdminHotelsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") || "submitted";
  const [filter, setFilter] = useState(initialStatus);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const loadRestaurants = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await listPlatformRestaurants(filter || undefined);
      setData(response);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load restaurants.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  useEffect(() => {
    if (filter) {
      setSearchParams({ status: filter }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [filter, setSearchParams]);

  const handleStatusUpdate = async (clientId, status) => {
    if (!clientId) return;
    setUpdatingId(clientId);
    setError("");
    setSuccessMessage("");
    try {
      await updatePlatformRestaurantStatus(clientId, status);
      setSuccessMessage(`Client ${clientId} marked as ${status}.`);
      await loadRestaurants();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update restaurant status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <header className="admin-header">
        <div>
          <h1>Hotels & restaurants</h1>
          <p>
            GET /admin/platform/restaurants — review onboarding and approve or reject venues.
          </p>
        </div>
        <button type="button" className="admin-btn admin-btn--ghost" onClick={loadRestaurants}>
          Refresh
        </button>
      </header>

      <div className="admin-filters">
        <div className="admin-field" style={{ marginBottom: 0, minWidth: "180px" }}>
          <label htmlFor="statusFilter">Filter by status</label>
          <select
            id="statusFilter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            {STATUS_FILTERS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-card" style={{ padding: "0.65rem 1rem" }}>
          <span className="admin-card__label">Listed</span> <strong>{data?.count ?? 0}</strong>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}
      {successMessage && <div className="admin-success">{successMessage}</div>}

      {loading ? (
        <p className="admin-empty">Loading venues…</p>
      ) : !data?.restaurants?.length ? (
        <p className="admin-empty">No restaurants found for this filter.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Venue</th>
                <th>Client ID</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Open</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.restaurants.map((restaurant) => (
                <tr key={`${restaurant.clientId}-${restaurant.restaurantName}`}>
                  <td>
                    <strong>{restaurant.restaurantName}</strong>
                    <div className="admin-card__hint">
                      {[restaurant.city, restaurant.state].filter(Boolean).join(", ")}
                    </div>
                    {restaurant.clientId && (
                      <Link
                        to={adminRoutes.hotelDetail(restaurant.clientId)}
                        className="admin-card__hint"
                      >
                        View details →
                      </Link>
                    )}
                  </td>
                  <td>
                    {restaurant.clientId ? (
                      <Link to={adminRoutes.hotelDetail(restaurant.clientId)}>
                        {restaurant.clientId}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <div>{restaurant.ownerName || "—"}</div>
                    <div className="admin-card__hint">{restaurant.ownerEmail || "—"}</div>
                  </td>
                  <td>
                    <AdminStatusBadge status={restaurant.status} label={restaurant.status} />
                  </td>
                  <td>
                    <AdminStatusBadge
                      status={restaurant.isActive ? "ready" : "cancelled"}
                      label={restaurant.isActive ? "Open" : "Closed"}
                    />
                  </td>
                  <td>
                    <div className="admin-action-row">
                      {REVIEW_STATUSES.has(restaurant.status) && (
                        <>
                          <button
                            type="button"
                            className="admin-btn admin-btn--green admin-btn--small"
                            disabled={!restaurant.clientId || updatingId === restaurant.clientId}
                            onClick={() => handleStatusUpdate(restaurant.clientId, "approved")}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost admin-btn--small"
                            disabled={!restaurant.clientId || updatingId === restaurant.clientId}
                            onClick={() => handleStatusUpdate(restaurant.clientId, "rejected")}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {restaurant.status === "approved" && (
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost admin-btn--small"
                          disabled={!restaurant.clientId || updatingId === restaurant.clientId}
                          onClick={() => handleStatusUpdate(restaurant.clientId, "pending")}
                        >
                          Mark pending
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default AdminHotelsPage;
