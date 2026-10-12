import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getRestaurantPayoutCycleDetail,
  listRestaurantPayoutCycles,
  updateRestaurantPayoutCycleStatus,
} from "../../api/adminApi";
import { adminRoutes } from "../../../utils/routes";

const STATUS_OPTIONS = ["pending", "processing", "paid", "failed"];

const formatInr = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const CycleTable = ({ title, cycles, selectedId, onOpen }) => (
  <div style={{ marginTop: "1rem" }}>
    <h3 className="admin-section__subtitle">{title}</h3>
    <div className="admin-table-wrap">
      <table className="admin-table admin-table--compact">
        <thead>
          <tr>
            <th>Cycle</th>
            <th>Mode</th>
            <th>Status</th>
            <th>Orders</th>
            <th>Payout</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {cycles.map((cycle) => (
            <tr key={cycle.id} className={selectedId === cycle.id ? "admin-table__row--active" : ""}>
              <td>
                {cycle.label}
                {cycle.paidAt ? (
                  <div className="admin-card__hint">Paid {formatDate(cycle.paidAt)}</div>
                ) : null}
              </td>
              <td>{cycle.payoutMode}</td>
              <td>{cycle.status}</td>
              <td>{cycle.orderCount}</td>
              <td>{formatInr(cycle.netPayoutAmount)}</td>
              <td>
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost admin-btn--small"
                  onClick={() => onOpen(cycle.id)}
                >
                  Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  } catch {
    return iso;
  }
};

export const PayoutCyclesSection = ({ clientId }) => {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusNote, setStatusNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const loadCycles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listRestaurantPayoutCycles(Number(clientId));
      setCycles(data.cycles || []);
    } catch (err) {
      setCycles([]);
      setError(err.response?.data?.message || "Could not load payout cycles.");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadCycles();
  }, [loadCycles]);

  const currentCycles = useMemo(
    () => cycles.filter((cycle) => cycle.status !== "paid"),
    [cycles]
  );
  const historyCycles = useMemo(
    () => cycles.filter((cycle) => cycle.status === "paid"),
    [cycles]
  );

  const openCycle = async (cycleId) => {
    setSelectedId(cycleId);
    setDetail(null);
    setDetailLoading(true);
    setActionMessage("");
    try {
      const data = await getRestaurantPayoutCycleDetail(Number(clientId), cycleId);
      setDetail(data);
      setStatusNote(data.cycle?.statusNote || "");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load cycle detail.");
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const updateStatus = async (status) => {
    if (!selectedId) return;
    setSaving(true);
    setActionMessage("");
    setError("");
    try {
      await updateRestaurantPayoutCycleStatus(Number(clientId), selectedId, {
        status,
        statusNote: statusNote.trim() || undefined,
      });
      setActionMessage(`Cycle marked ${status}.`);
      await loadCycles();
      await openCycle(selectedId);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update payout status.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-section">
      <div className="admin-section__header">
        <h2 className="admin-section__title">Payout cycles (T+2)</h2>
        <button type="button" className="admin-btn admin-btn--ghost admin-btn--small" onClick={loadCycles}>
          Refresh
        </button>
      </div>
      <p className="admin-card__hint">
        One cycle per payment day (IST). Payout is due on T+2. Mark status from the{" "}
        <Link to={adminRoutes.payouts}>Payouts</Link> page or here. Paid cycles stay in history.
      </p>

      {loading ? <p className="admin-empty">Loading cycles…</p> : null}
      {!loading && cycles.length === 0 ? (
        <p className="admin-empty">No payout cycles yet (paid orders will appear after sync).</p>
      ) : null}

      {!loading && currentCycles.length > 0 ? (
        <CycleTable
          title="Open and due"
          cycles={currentCycles}
          selectedId={selectedId}
          onOpen={openCycle}
        />
      ) : null}

      {!loading && historyCycles.length > 0 ? (
        <CycleTable
          title="Payout history"
          cycles={historyCycles}
          selectedId={selectedId}
          onOpen={openCycle}
        />
      ) : null}
      {!loading && cycles.length > 0 && historyCycles.length === 0 ? (
        <p className="admin-card__hint">Paid payouts will appear here as history.</p>
      ) : null}

      {selectedId && detailLoading ? <p className="admin-empty">Loading cycle detail…</p> : null}

      {detail?.cycle ? (
        <div className="admin-subpanel" style={{ marginTop: "1rem" }}>
          <h3 className="admin-section__subtitle">{detail.cycle.label}</h3>
          <p className="admin-card__hint">
            {detail.cycle.orderCount} orders · Net {formatInr(detail.cycle.netPayoutAmount)} · Customer paid{" "}
            {formatInr(detail.cycle.totalCustomerPaid)}
          </p>

          {detail.breakdown ? (
            <ul className="admin-kv-list">
              <li>
                <span>Food subtotal</span>
                <span>{formatInr(detail.breakdown.foodSubtotal)}</span>
              </li>
              {detail.breakdown.parcelSubtotal > 0 ? (
                <li>
                  <span>Packaging</span>
                  <span>{formatInr(detail.breakdown.parcelSubtotal)}</span>
                </li>
              ) : null}
              {(detail.breakdown.extraChargeLines || []).map((line) => (
                <li key={`${line.name}-${line.chargeType}`}>
                  <span>
                    {line.name} ({line.chargeType})
                  </span>
                  <span>{formatInr(line.amount)}</span>
                </li>
              ))}
              <li>
                <span>Bill total</span>
                <span>{formatInr(detail.breakdown.billTotal)}</span>
              </li>
              <li>
                <span>Customer paid</span>
                <span>{formatInr(detail.breakdown.customerPaidTotal)}</span>
              </li>
              <li>
                <span>Platform fee (kept by platform)</span>
                <span>{formatInr(detail.breakdown.platformFee)}</span>
              </li>
              {detail.breakdown.gatewayFee > 0 ? (
                <li>
                  <span>Gateway fee (kept by platform)</span>
                  <span>{formatInr(detail.breakdown.gatewayFee)}</span>
                </li>
              ) : null}
              <li>
                <strong>Payout to restaurant</strong>
                <strong>{formatInr(detail.breakdown.netToRestaurant)}</strong>
              </li>
            </ul>
          ) : null}

          {detail.cycle.status !== "open" ? (
            <div className="admin-form-grid" style={{ marginTop: "1rem" }}>
              <label htmlFor="payoutStatusNote">Status note</label>
              <textarea
                id="payoutStatusNote"
                rows={2}
                value={statusNote}
                onChange={(event) => setStatusNote(event.target.value)}
                placeholder="Bank UTR, transfer date, etc."
              />
              <div className="admin-action-row">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className="admin-btn admin-btn--ghost admin-btn--small"
                    disabled={saving || detail.cycle.status === status}
                    onClick={() => updateStatus(status)}
                  >
                    Mark {status}
                  </button>
                ))}
              </div>
              {detail.cycle.paidAt ? (
                <p className="admin-card__hint">Paid at {formatDate(detail.cycle.paidAt)}</p>
              ) : null}
              {actionMessage ? <p className="admin-success">{actionMessage}</p> : null}
            </div>
          ) : (
            <p className="admin-card__hint">This cycle is still open. Payout is due on T+2.</p>
          )}

          {detail.orders?.length ? (
            <>
              <h4 className="admin-section__subtitle">Orders</h4>
              <div className="admin-table-wrap">
                <table className="admin-table admin-table--compact">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Paid</th>
                      <th>Bill</th>
                      <th>Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.orders.map((order) => (
                      <tr key={order.orderId}>
                        <td>{order.orderNo || order.orderId.slice(0, 8)}</td>
                        <td>{formatDate(order.paidAt)}</td>
                        <td>{formatInr(order.billTotal)}</td>
                        <td>{formatInr(order.restaurantShareAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

export default PayoutCyclesSection;
