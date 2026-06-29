import React, { useCallback, useEffect, useState } from "react";
import {
  createSubscriptionPlan,
  deactivateSubscriptionPlan,
  listSubscriptionPlans,
  updateSubscriptionPlan,
} from "../api/adminApi";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { BUSINESS_TYPE_OPTIONS } from "../constants/businessTypes";
import {
  PRICING_MODEL_OPTIONS,
  formToPlanPayload,
  planToForm,
} from "../utils/subscriptionAdminHelpers";
import { formatAdminAmount, formatAdminTime } from "../utils/adminFormatters";
import { formatBusinessTypeList } from "../utils/restaurantProfileDisplay";

const EMPTY_FORM = planToForm();

const AdminSubscriptionPlansPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await listSubscriptionPlans();
      setData(response);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load subscription plans.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleEdit = (plan) => {
    setEditingId(plan.id);
    setForm(planToForm(plan));
    setError("");
    setSuccessMessage("");
  };

  const toggleCoveredType = (value) => {
    setForm((current) => {
      const types = current.coveredTypes || [];
      const next = types.includes(value)
        ? types.filter((type) => type !== value)
        : [...types, value];
      return { ...current, coveredTypes: next };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");
    try {
      const payload = formToPlanPayload(form, { isUpdate: Boolean(editingId) });
      if (editingId) {
        await updateSubscriptionPlan(editingId, payload);
        setSuccessMessage("Plan updated.");
      } else {
        await createSubscriptionPlan(payload);
        setSuccessMessage("Plan created.");
      }
      resetForm();
      await loadPlans();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save plan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (plan) => {
    const label = plan.name || plan.planName || plan.code || plan.planCode;
    if (!window.confirm(`Deactivate plan "${label}"?`)) return;
    setError("");
    setSuccessMessage("");
    try {
      await deactivateSubscriptionPlan(plan.id);
      setSuccessMessage("Plan deactivated.");
      if (editingId === plan.id) resetForm();
      await loadPlans();
    } catch (err) {
      setError(err.response?.data?.message || "Could not deactivate plan.");
    }
  };

  const plans = data?.plans || data?.subscriptionPlans || data || [];

  return (
    <>
      <header className="admin-header">
        <div>
          <h1>Subscription plans</h1>
          <p>Manage platform subscription plan catalog.</p>
        </div>
        <button type="button" className="admin-btn admin-btn--ghost" onClick={loadPlans}>
          Refresh
        </button>
      </header>

      {error && <div className="admin-error">{error}</div>}
      {successMessage && <div className="admin-success">{successMessage}</div>}

      <section className="admin-card admin-section">
        <h2 className="admin-section__title">{editingId ? "Edit plan" : "Create plan"}</h2>
        <form onSubmit={handleSubmit} className="admin-restaurant-form">
          <div className="admin-field">
            <label htmlFor="planCode">Code</label>
            <input
              id="planCode"
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value })}
              placeholder="quick_dining_daily"
              required
              disabled={Boolean(editingId)}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="planName">Name</label>
            <input
              id="planName"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Quick dining daily"
              required
            />
          </div>
          <div className="admin-field">
            <label htmlFor="pricingModel">Pricing model</label>
            <select
              id="pricingModel"
              value={form.pricingModel}
              onChange={(event) => setForm({ ...form, pricingModel: event.target.value })}
              required
            >
              {PRICING_MODEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label htmlFor="price">Price (₹)</label>
            <input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(event) => setForm({ ...form, price: event.target.value })}
              required
            />
          </div>
          <div className="admin-field">
            <label htmlFor="durationDays">Duration (days)</label>
            <input
              id="durationDays"
              type="number"
              min="1"
              value={form.durationDays}
              onChange={(event) => setForm({ ...form, durationDays: event.target.value })}
              required
            />
          </div>
          <div className="admin-field admin-field--full">
            <span className="admin-field__label">Covered business types</span>
            <div className="admin-checkbox-group">
              {BUSINESS_TYPE_OPTIONS.map((option) => (
                <label key={option.value} className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={form.coveredTypes.includes(option.value)}
                    onChange={() => toggleCoveredType(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
          <div className="admin-field">
            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
              />
              Active
            </label>
          </div>
          <div className="admin-field admin-field--full admin-action-row">
            <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Update plan" : "Create plan"}
            </button>
            {editingId && (
              <button type="button" className="admin-btn admin-btn--ghost" onClick={resetForm}>
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="admin-section">
        <h2 className="admin-section__title">Plans ({Array.isArray(plans) ? plans.length : 0})</h2>
        {loading ? (
          <p className="admin-empty">Loading plans…</p>
        ) : !Array.isArray(plans) || !plans.length ? (
          <p className="admin-empty">No plans yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Covered types</th>
                  <th>Pricing</th>
                  <th>Price</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td>{plan.code || plan.planCode}</td>
                    <td>{plan.name || plan.planName}</td>
                    <td>
                      {formatBusinessTypeList({ businessType: plan.coveredTypes })}
                    </td>
                    <td>{plan.pricingModel || "—"}</td>
                    <td>
                      {formatAdminAmount(
                        plan.price ?? (plan.priceInPaise != null ? plan.priceInPaise / 100 : null)
                      )}
                    </td>
                    <td>{plan.durationDays ? `${plan.durationDays}d` : "—"}</td>
                    <td>
                      <AdminStatusBadge
                        status={plan.isActive === false ? "cancelled" : "active"}
                        label={plan.isActive === false ? "Inactive" : "Active"}
                      />
                    </td>
                    <td>{formatAdminTime(plan.updatedAt)}</td>
                    <td>
                      <div className="admin-action-row">
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost admin-btn--small"
                          onClick={() => handleEdit(plan)}
                        >
                          Edit
                        </button>
                        {plan.isActive !== false && (
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost admin-btn--small"
                            onClick={() => handleDeactivate(plan)}
                          >
                            Deactivate
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
      </section>
    </>
  );
};

export default AdminSubscriptionPlansPage;
