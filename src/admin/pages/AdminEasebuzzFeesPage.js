import React, { useCallback, useEffect, useState } from "react";
import { getEasebuzzFeeConfig, updateEasebuzzFeeConfig } from "../api/adminApi";
import { formatAdminTime } from "../utils/adminFormatters";

const CHECKOUT_INSTRUMENT_OPTIONS = [
  { value: "debit_auto", label: "Debit card (auto by amount)" },
  { value: "debit_le_2000", label: "Debit ≤ ₹2000" },
  { value: "debit_gt_2000", label: "Debit > ₹2000" },
  { value: "upi", label: "Rupay & UPI" },
  { value: "credit_card", label: "Credit cards" },
  { value: "diners_commercial", label: "Diners & commercial" },
  { value: "amex", label: "Amex" },
  { value: "netbanking_hdfc_icici", label: "Netbanking HDFC/ICICI" },
  { value: "netbanking_rest", label: "Netbanking other banks" },
  { value: "wallet_mobikwik", label: "Mobikwik" },
  { value: "wallet_other", label: "Other wallets" },
  { value: "wallet_simple_ola", label: "Simple & Ola Money" },
];

const apiMessage = (err, fallback) => {
  const message = err.response?.data?.message;
  if (Array.isArray(message)) return message.filter(Boolean).join(" ");
  return message || fallback;
};

const AdminEasebuzzFeesPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [checkoutInstrumentKey, setCheckoutInstrumentKey] = useState("upi");
  const [debitTierThreshold, setDebitTierThreshold] = useState(2000);
  const [categories, setCategories] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [rates, setRates] = useState({});

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getEasebuzzFeeConfig();
      setCheckoutInstrumentKey(data.checkoutInstrumentKey || "upi");
      setDebitTierThreshold(Number(data.schedule?.debitTierThreshold ?? 2000));
      setCategories(data.schedule?.categories || []);
      setInstruments(data.schedule?.instruments || []);
      setRates(data.schedule?.rates || {});
      setUpdatedAt(data.updatedAt || null);
    } catch (err) {
      setError(apiMessage(err, "Could not load Easebuzz fee schedule."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const updateRate = (categoryKey, instrumentKey, field, value) => {
    setRates((current) => ({
      ...current,
      [categoryKey]: {
        ...(current[categoryKey] || {}),
        [instrumentKey]: {
          ...(current[categoryKey]?.[instrumentKey] || { type: "percent", value: 0 }),
          [field]: field === "value" ? Number(value) : value,
        },
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccessMessage("");
    try {
      const payload = await updateEasebuzzFeeConfig({
        checkoutInstrumentKey,
        schedule: {
          debitTierThreshold: Number(debitTierThreshold),
          rates,
        },
      });
      setUpdatedAt(payload.updatedAt || null);
      setSuccessMessage("Easebuzz fee schedule saved.");
    } catch (err) {
      setError(apiMessage(err, "Could not save Easebuzz fee schedule."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header className="admin-header">
        <div>
          <h1>Easebuzz gateway fees</h1>
          <p>
            MDR schedule by merchant category. Checkout uses the default payment method below until
            the customer picks an instrument on Easebuzz.
          </p>
          {updatedAt && (
            <p className="admin-card__hint">Last updated {formatAdminTime(updatedAt)}</p>
          )}
        </div>
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          disabled={saving || loading}
          onClick={handleSave}
        >
          {saving ? "Saving…" : "Save schedule"}
        </button>
      </header>

      {error && <div className="admin-error">{error}</div>}
      {successMessage && <div className="admin-success">{successMessage}</div>}

      {loading ? (
        <p className="admin-empty">Loading fee schedule…</p>
      ) : (
        <div className="admin-card admin-section">
          <div className="admin-restaurant-form" style={{ marginBottom: "1.25rem" }}>
            <div className="admin-field">
              <label htmlFor="checkoutInstrumentKey">Default checkout payment method</label>
              <select
                id="checkoutInstrumentKey"
                value={checkoutInstrumentKey}
                onChange={(event) => setCheckoutInstrumentKey(event.target.value)}
              >
                {CHECKOUT_INSTRUMENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-field">
              <label htmlFor="debitTierThreshold">Debit tier threshold (₹)</label>
              <input
                id="debitTierThreshold"
                type="number"
                min="0"
                value={debitTierThreshold}
                onChange={(event) => setDebitTierThreshold(event.target.value)}
              />
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table admin-table--compact">
              <thead>
                <tr>
                  <th>Payment method</th>
                  {categories.map((category) => (
                    <th key={category.key}>{category.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {instruments.map((instrument) => (
                  <tr key={instrument.key}>
                    <td>{instrument.label}</td>
                    {categories.map((category) => {
                      const rule = rates[category.key]?.[instrument.key] || {
                        type: "percent",
                        value: 0,
                      };
                      return (
                        <td key={`${category.key}-${instrument.key}`}>
                          <div className="admin-fee-cell">
                            <select
                              value={rule.type}
                              onChange={(event) =>
                                updateRate(category.key, instrument.key, "type", event.target.value)
                              }
                            >
                              <option value="percent">%</option>
                              <option value="flat">₹ flat</option>
                              <option value="na">N/A</option>
                            </select>
                            {rule.type !== "na" && (
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={rule.value ?? 0}
                                onChange={(event) =>
                                  updateRate(
                                    category.key,
                                    instrument.key,
                                    "value",
                                    event.target.value
                                  )
                                }
                              />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminEasebuzzFeesPage;
