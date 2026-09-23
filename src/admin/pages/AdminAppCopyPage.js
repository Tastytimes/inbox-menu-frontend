import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getAdminAppCopy, upsertAdminAppCopy } from "../api/adminApi";
import {
  APP_COPY_DEFAULT_LOCALE,
  APP_COPY_DEFAULTS,
  buildAppCopyRows,
} from "../constants/appCopyDefaults";
import { formatAdminTime } from "../utils/adminFormatters";

const apiMessage = (err, fallback) => {
  const message = err.response?.data?.message;
  if (Array.isArray(message)) return message.filter(Boolean).join(" ");
  return message || fallback;
};

const AdminAppCopyPage = () => {
  const [locale] = useState(APP_COPY_DEFAULT_LOCALE);
  const [revision, setRevision] = useState(0);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [rows, setRows] = useState([]);
  const [savedOverrides, setSavedOverrides] = useState({});
  const [query, setQuery] = useState("");
  const [showOverriddenOnly, setShowOverriddenOnly] = useState(false);
  const [customKey, setCustomKey] = useState("");
  const [customValue, setCustomValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const applyPayload = useCallback((payload) => {
    const entries = payload?.entries || {};
    setRevision(Number(payload?.revision ?? 0));
    setUpdatedAt(payload?.updatedAt ?? null);
    setRows(buildAppCopyRows(entries));
    setSavedOverrides(
      Object.fromEntries(
        Object.entries(entries).filter(([, value]) => typeof value === "string")
      )
    );
  }, []);

  const loadCopy = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await getAdminAppCopy(locale);
      applyPayload(payload);
    } catch (err) {
      setError(apiMessage(err, "Could not load app copy."));
    } finally {
      setLoading(false);
    }
  }, [applyPayload, locale]);

  useEffect(() => {
    loadCopy();
  }, [loadCopy]);

  const dirtyCount = useMemo(() => {
    return rows.filter((row) => (row.override || "") !== (savedOverrides[row.key] || "")).length;
  }, [rows, savedOverrides]);

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (showOverriddenOnly && !row.override.trim()) return false;
      if (!needle) return true;
      return (
        row.key.toLowerCase().includes(needle) ||
        row.defaultValue.toLowerCase().includes(needle) ||
        row.override.toLowerCase().includes(needle)
      );
    });
  }, [query, rows, showOverriddenOnly]);

  const updateRow = (key, override) => {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, override } : row)));
  };

  const handleAddCustomKey = (event) => {
    event.preventDefault();
    const key = customKey.trim();
    if (!key) return;
    setError("");
    setSuccessMessage("");
    setRows((current) => {
      if (current.some((row) => row.key === key)) {
        return current.map((row) => (row.key === key ? { ...row, override: customValue } : row));
      }
      return [...current, { key, defaultValue: APP_COPY_DEFAULTS[key] || "", override: customValue }];
    });
    setCustomKey("");
    setCustomValue("");
  };

  const handleSave = async () => {
    const entries = {};
    rows.forEach((row) => {
      const value = row.override.trim();
      if (value) entries[row.key] = row.override;
    });

    setSaving(true);
    setError("");
    setSuccessMessage("");
    try {
      const payload = await upsertAdminAppCopy({ locale, entries, replace: true });
      applyPayload(payload);
      setSuccessMessage(
        `Saved revision ${payload.revision}. Reload StayServe Partner to see the new wording.`
      );
    } catch (err) {
      setError(apiMessage(err, "Could not save app copy."));
    } finally {
      setSaving(false);
    }
  };

  const handleResetAll = async () => {
    if (
      !window.confirm(
        "Clear every override and use the built-in Partner app defaults again?"
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");
    try {
      const payload = await upsertAdminAppCopy({ locale, entries: {}, replace: true });
      applyPayload(payload);
      setSuccessMessage("All overrides cleared. Partner app will use built-in defaults.");
    } catch (err) {
      setError(apiMessage(err, "Could not reset app copy."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="admin-empty">Loading app copy…</p>;
  }

  return (
    <>
      <header className="admin-header">
        <div>
          <h1>App copy</h1>
          <p>
            Change StayServe Partner wording without a store build. Empty override keeps the app
            default.
          </p>
        </div>
        <div className="admin-payments-header__actions">
          <button type="button" className="admin-btn admin-btn--ghost" onClick={loadCopy}>
            Refresh
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={handleResetAll}
            disabled={saving}
          >
            Reset all
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={handleSave}
            disabled={saving || dirtyCount === 0}
          >
            {saving ? "Saving…" : dirtyCount ? `Save ${dirtyCount} change${dirtyCount === 1 ? "" : "s"}` : "Saved"}
          </button>
        </div>
      </header>

      {error && <div className="admin-error">{error}</div>}
      {successMessage && <div className="admin-success">{successMessage}</div>}

      <div className="admin-grid">
        <div className="admin-card">
          <div className="admin-card__label">Locale</div>
          <div className="admin-card__value">{locale}</div>
        </div>
        <div className="admin-card">
          <div className="admin-card__label">Revision</div>
          <div className="admin-card__value">{revision}</div>
        </div>
        <div className="admin-card">
          <div className="admin-card__label">Last updated</div>
          <div className="admin-card__value admin-copy__meta">{formatAdminTime(updatedAt)}</div>
        </div>
      </div>

      <section className="admin-card admin-section">
        <div className="admin-copy__toolbar">
          <div className="admin-field admin-copy__search">
            <label htmlFor="copySearch">Search keys</label>
            <input
              id="copySearch"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="fineDine.makeTableFree"
            />
          </div>
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={showOverriddenOnly}
              onChange={(event) => setShowOverriddenOnly(event.target.checked)}
            />
            Overridden only
          </label>
        </div>

        <form className="admin-copy__add" onSubmit={handleAddCustomKey}>
          <div className="admin-field">
            <label htmlFor="customCopyKey">Add key</label>
            <input
              id="customCopyKey"
              value={customKey}
              onChange={(event) => setCustomKey(event.target.value)}
              placeholder="fineDine.makeTableFree"
            />
          </div>
          <div className="admin-field admin-field--full">
            <label htmlFor="customCopyValue">Override</label>
            <input
              id="customCopyValue"
              value={customValue}
              onChange={(event) => setCustomValue(event.target.value)}
              placeholder="Clear table"
            />
          </div>
          <button type="submit" className="admin-btn admin-btn--ghost">
            Add
          </button>
        </form>
      </section>

      <div className="admin-table-wrap admin-section">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>App default</th>
              <th>Override</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={3}>No matching copy keys.</td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const dirty = (row.override || "") !== (savedOverrides[row.key] || "");
                return (
                  <tr key={row.key} className={dirty ? "admin-table__row--active" : undefined}>
                    <td>
                      <code className="admin-copy__key">{row.key}</code>
                    </td>
                    <td className="admin-copy__default">{row.defaultValue || "—"}</td>
                    <td>
                      <textarea
                        className="admin-copy__input"
                        rows={row.defaultValue.length > 60 || row.override.length > 60 ? 3 : 1}
                        value={row.override}
                        placeholder={row.defaultValue}
                        onChange={(event) => updateRow(row.key, event.target.value)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default AdminAppCopyPage;
