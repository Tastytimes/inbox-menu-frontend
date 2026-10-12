import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getRestaurantBankAccount,
  getRestaurantPayoutCycleDetail,
  listAdminPayouts,
  updateRestaurantPayoutCycleStatus,
} from "../api/adminApi";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { adminRoutes } from "../../utils/routes";

const formatInr = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDay = (isoDate) => {
  if (!isoDate) return "—";
  const parsed = new Date(`${String(isoDate).slice(0, 10)}T12:00:00+05:30`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

const formatDateTime = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  } catch {
    return iso;
  }
};

const apiMessage = (err, fallback) => {
  const message = err.response?.data?.message;
  if (Array.isArray(message)) return message.filter(Boolean).join(" ");
  return message || fallback;
};

const STATUS_ACTIONS = [
  { status: "processing", label: "Processing" },
  { status: "paid", label: "Paid" },
  { status: "failed", label: "Failed" },
  { status: "pending", label: "Pending" },
];

const AdminPayoutsPage = () => {
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("due");
  const [notes, setNotes] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [accounts, setAccounts] = useState({});
  const [revealingId, setRevealingId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const loadBoard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listAdminPayouts();
      setBoard(data);
      const nextNotes = {};
      for (const row of [
        ...(data.due || []),
        ...(data.upcoming || []),
        ...(data.history || []),
      ]) {
        nextNotes[row.cycleId] = row.statusNote || "";
      }
      setNotes(nextNotes);
    } catch (err) {
      setBoard(null);
      setError(apiMessage(err, "Could not load payouts."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const rows = useMemo(() => {
    if (!board) return [];
    if (tab === "history") return board.history || [];
    if (tab === "upcoming") return board.upcoming || [];
    return board.due || [];
  }, [board, tab]);

  const openDetail = async (row) => {
    if (!row.clientId) {
      setError("This payout is not linked to a restaurant client, so its orders cannot be opened.");
      return;
    }
    setSelected(row);
    setDetail(null);
    setDetailError("");
    setDetailLoading(true);
    setActionMessage("");
    try {
      const data = await getRestaurantPayoutCycleDetail(row.clientId, row.cycleId);
      setDetail(data);
    } catch (err) {
      setDetailError(apiMessage(err, "Could not load payout detail."));
    } finally {
      setDetailLoading(false);
    }
  };

  const revealAccount = async (row) => {
    if (!row.clientId || accounts[row.clientId]) return;
    setRevealingId(row.clientId);
    setError("");
    try {
      const data = await getRestaurantBankAccount(row.clientId);
      setAccounts((current) => ({
        ...current,
        [row.clientId]: data.bankAccountNumber,
      }));
    } catch (err) {
      setError(apiMessage(err, "Could not load the bank account."));
    } finally {
      setRevealingId(null);
    }
  };

  const updateStatus = async (row, status) => {
    if (!row.clientId) return;
    setSavingId(row.cycleId);
    setError("");
    setActionMessage("");
    try {
      await updateRestaurantPayoutCycleStatus(row.clientId, row.cycleId, {
        status,
        statusNote: (notes[row.cycleId] || "").trim() || undefined,
      });
      setActionMessage(
        status === "paid"
          ? `${row.restaurantName} marked paid. It is now in payout history.`
          : `${row.restaurantName} marked ${status}.`
      );
      if (status === "paid") {
        setTab("history");
      }
      await loadBoard();
      if (selected?.cycleId === row.cycleId) {
        const data = await getRestaurantPayoutCycleDetail(row.clientId, row.cycleId);
        setDetail(data);
        setSelected({ ...row, status });
      }
    } catch (err) {
      setError(apiMessage(err, "Could not update payout status."));
    } finally {
      setSavingId(null);
    }
  };

  const asOfLabel = formatDay(board?.asOfDate);

  return (
    <>
      <header className="admin-header">
        <div>
          <h1>Payouts</h1>
          <p>
            Due on {asOfLabel} (IST, T+2). Pay each restaurant their bill. Platform fee stays with
            the platform and is not included in the amount to pay.
          </p>
        </div>
        <button type="button" className="admin-btn admin-btn--ghost" onClick={loadBoard}>
          Refresh
        </button>
      </header>

      {error ? <div className="admin-error">{error}</div> : null}
      {actionMessage ? <p className="admin-success">{actionMessage}</p> : null}

      <div className="admin-grid">
        <div className="admin-card">
          <div className="admin-card__label">To pay today</div>
          <div className="admin-card__value">{board?.dueCount ?? 0}</div>
          <div className="admin-card__hint">Restaurants with a payout due by end of {asOfLabel}</div>
        </div>
        <div className="admin-card">
          <div className="admin-card__label">Amount to pay</div>
          <div className="admin-card__value">{formatInr(board?.dueAmount)}</div>
          <div className="admin-card__hint">Restaurant share only. Platform fee is excluded.</div>
        </div>
        <div className="admin-card">
          <div className="admin-card__label">Still unpaid from earlier</div>
          <div className="admin-card__value">{board?.overdueCount ?? 0}</div>
          <div className="admin-card__hint">Included in the due list until marked paid</div>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-btn admin-btn--ghost${tab === "due" ? " admin-btn--active" : ""}`}
          onClick={() => setTab("due")}
        >
          Due ({board?.dueCount ?? 0})
        </button>
        <button
          type="button"
          className={`admin-btn admin-btn--ghost${tab === "upcoming" ? " admin-btn--active" : ""}`}
          onClick={() => setTab("upcoming")}
        >
          Not due yet ({board?.upcoming?.length ?? 0})
        </button>
        <button
          type="button"
          className={`admin-btn admin-btn--ghost${tab === "history" ? " admin-btn--active" : ""}`}
          onClick={() => setTab("history")}
        >
          History ({board?.history?.length ?? 0})
        </button>
      </div>

      <section className="admin-section">
        {loading ? <p className="admin-empty">Loading payouts…</p> : null}
        {!loading && rows.length === 0 ? (
          <p className="admin-empty">
            {tab === "history"
              ? "No paid payouts yet. Mark a due payout as paid and it will show here and on the restaurant."
              : tab === "upcoming"
                ? "No open cycles. New paid orders appear here until their T+2 date."
                : `Nothing to pay on ${asOfLabel}. Cycles become due two days after the orders are paid.`}
          </p>
        ) : null}

        {!loading && rows.length > 0 ? (
          <div className="admin-payout-list">
            {rows.map((row) => {
              const isOpen = selected?.cycleId === row.cycleId;
              return (
                <article
                  key={row.cycleId}
                  className={`admin-payout-card${isOpen ? " admin-payout-card--open" : ""}`}
                >
                  <div className="admin-payout-card__main">
                    <div>
                      <h2 className="admin-payout-card__name">{row.restaurantName}</h2>
                      <div className="admin-payout-card__meta">
                        {row.clientId ? (
                          <Link to={adminRoutes.hotelDetail(row.clientId)}>Client {row.clientId}</Link>
                        ) : (
                          <span>Client unknown</span>
                        )}
                        {row.ownerName ? <span>{row.ownerName}</span> : null}
                        <span>
                          {tab === "history"
                            ? `Paid ${formatDateTime(row.paidAt)}`
                            : `Due ${formatDay(row.settlementDate)}`}
                        </span>
                        <span>
                          {row.orderCount} {row.orderCount === 1 ? "order" : "orders"}
                        </span>
                        {row.timing === "overdue" ? <span>Overdue</span> : null}
                      </div>
                    </div>
                    <div>
                      <div className="admin-payout-card__bank">
                        {row.bankAccountHolder || "Account holder not saved"}
                      </div>
                      <div className="admin-payout-card__bank-meta">
                        {row.bankIfsc || "IFSC not saved"}
                        {row.bankAccountLast4 ? ` · •••• ${row.bankAccountLast4}` : ""}
                      </div>
                      {accounts[row.clientId] ? (
                        <div className="admin-payout-card__account">{accounts[row.clientId]}</div>
                      ) : (
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost admin-btn--small"
                          style={{ marginTop: "0.45rem" }}
                          disabled={!row.clientId || revealingId === row.clientId}
                          onClick={() => revealAccount(row)}
                        >
                          {revealingId === row.clientId ? "Loading…" : "Show account"}
                        </button>
                      )}
                    </div>
                    <div className="admin-payout-card__side">
                      <div className="admin-payout-card__amount-label">Pay restaurant</div>
                      <div className="admin-payout-card__amount">{formatInr(row.netPayoutAmount)}</div>
                      <AdminStatusBadge status={row.status} label={row.status} />
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost admin-btn--small"
                        onClick={() => (isOpen ? setSelected(null) : openDetail(row))}
                      >
                        {isOpen ? "Hide orders" : "View orders"}
                      </button>
                    </div>
                  </div>

                  {isOpen ? (
                    <div className="admin-payout-detail">
                      {detailLoading ? <p className="admin-empty">Loading orders…</p> : null}
                      {detailError ? <div className="admin-error">{detailError}</div> : null}
                      {detail?.breakdown ? (
                        <div className="admin-payout-stats">
                          <div className="admin-payout-stat">
                            <span>Pay restaurant</span>
                            <strong>{formatInr(detail.breakdown.netToRestaurant)}</strong>
                          </div>
                          <div className="admin-payout-stat">
                            <span>Customer paid</span>
                            <strong>{formatInr(detail.breakdown.customerPaidTotal)}</strong>
                          </div>
                          <div className="admin-payout-stat">
                            <span>Platform fee kept</span>
                            <strong>{formatInr(detail.breakdown.platformFee)}</strong>
                          </div>
                        </div>
                      ) : null}
                      {detail && !detailLoading && !detail.orders?.length ? (
                        <p className="admin-empty">No orders in this cycle.</p>
                      ) : null}
                      {detail?.orders?.map((order) => (
                        <div key={order.orderId} className="admin-payout-order">
                          <div>
                            <div className="admin-payout-order__title">
                              Order {order.orderNo || order.orderId.slice(0, 8)}
                            </div>
                            <div className="admin-payout-order__time">{formatDateTime(order.paidAt)}</div>
                            <div className="admin-payout-order__lines">
                              <span className="admin-payout-chip">
                                Food {formatInr(order.summary?.foodSubtotal)}
                              </span>
                              {(order.summary?.extraCharges || []).map((charge) => (
                                <span
                                  key={`${charge.name}-${charge.chargeType}`}
                                  className="admin-payout-chip"
                                >
                                  {charge.name} {formatInr(charge.amount)}
                                </span>
                              ))}
                              <span className="admin-payout-chip">Bill {formatInr(order.billTotal)}</span>
                            </div>
                          </div>
                          <div className="admin-payout-order__pay">
                            <strong>{formatInr(order.restaurantShareAmount)}</strong>
                            <span>to restaurant</span>
                          </div>
                        </div>
                      ))}
                      <div className="admin-payout-note">
                        <label htmlFor={`payout-note-${row.cycleId}`}>Status note</label>
                        <textarea
                          id={`payout-note-${row.cycleId}`}
                          rows={2}
                          value={notes[row.cycleId] || ""}
                          onChange={(event) =>
                            setNotes((current) => ({
                              ...current,
                              [row.cycleId]: event.target.value,
                            }))
                          }
                          placeholder="UTR, transfer date, or reason"
                        />
                      </div>
                      {row.status === "open" ? (
                        <p className="admin-card__hint">
                          This cycle is still open. It can be marked after {formatDay(row.settlementDate)}.
                        </p>
                      ) : (
                        <div className="admin-payout-actions">
                          {STATUS_ACTIONS.map((action) => (
                            <button
                              key={action.status}
                              type="button"
                              className={`admin-btn admin-btn--small${
                                action.status === "paid" ? " admin-btn--green" : " admin-btn--ghost"
                              }`}
                              disabled={savingId === row.cycleId || row.status === action.status}
                              onClick={() => updateStatus(row, action.status)}
                            >
                              Mark {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </>
  );
};

export default AdminPayoutsPage;
