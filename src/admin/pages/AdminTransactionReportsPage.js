import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  downloadOrderInvoice,
  downloadSubscriptionPaymentInvoice,
  exportPlatformTransactionsReport,
  getPlatformTransactionsReport,
} from "../api/adminApi";
import { formatAdminAmount, formatAdminTime } from "../utils/adminFormatters";
import { adminRoutes } from "../../utils/routes";

const TYPE_FILTERS = [
  { value: "all", label: "All transactions" },
  { value: "order", label: "Orders only" },
  { value: "subscription", label: "Subscriptions only" },
];

const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const toInput = (date) => date.toISOString().slice(0, 10);
  return { startDate: toInput(start), endDate: toInput(end) };
};

const SummaryCard = ({ label, value, hint }) => (
  <div className="admin-payments-metric">
    <span className="admin-payments-metric__label">{label}</span>
    <span className="admin-payments-metric__value">{value}</span>
    {hint && <span className="admin-payments-metric__hint">{hint}</span>}
  </div>
);

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

const AdminTransactionReportsPage = () => {
  const defaultRange = useMemo(() => getCurrentMonthRange(), []);
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [type, setType] = useState("all");
  const [clientId, setClientId] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [invoiceLoadingId, setInvoiceLoadingId] = useState(null);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        startDate,
        endDate,
        type,
        page,
        limit: 50,
      };
      if (clientId.trim()) params.clientId = Number(clientId.trim());
      if (search.trim()) params.search = search.trim();

      const data = await getPlatformTransactionsReport(params);
      setReport(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load transaction report.");
    } finally {
      setLoading(false);
    }
  }, [clientId, endDate, page, search, startDate, type]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExport = async () => {
    setExporting(true);
    setError("");
    try {
      const params = { startDate, endDate, type };
      if (clientId.trim()) params.clientId = Number(clientId.trim());
      if (search.trim()) params.search = search.trim();
      const { blob, filename } = await exportPlatformTransactionsReport(params);
      downloadBlob(blob, filename);
    } catch (err) {
      setError(err.response?.data?.message || "Could not export CSV.");
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadInvoice = async (row) => {
    setInvoiceLoadingId(row.transactionId);
    setError("");
    try {
      if (row.type === "order") {
        const { blob, filename } = await downloadOrderInvoice(row.transactionId);
        downloadBlob(blob, filename);
        return;
      }

      const { blob, filename } = await downloadSubscriptionPaymentInvoice(
        row.clientId,
        row.transactionId
      );
      downloadBlob(blob, filename);
    } catch (err) {
      setError(err.response?.data?.message || "Could not download invoice.");
    } finally {
      setInvoiceLoadingId(null);
    }
  };

  const summary = report?.summary;
  const items = report?.items ?? [];
  const pagination = report?.pagination;

  return (
    <div className="admin-payments-page">
      <header className="admin-header admin-payments-header">
        <div>
          <h1>Transaction reports</h1>
          <p>
            Vendor vs platform split for every paid order and subscription — for GST filing and
            accounts.
          </p>
        </div>
        <div className="admin-payments-header__actions">
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={loadReport}
            disabled={loading}
          >
            Refresh
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={handleExport}
            disabled={exporting || loading}
          >
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </header>

      {error && <div className="admin-error">{error}</div>}

      <section className="admin-card admin-section">
        <div className="admin-transactions-filters">
          <label>
            From
            <input
              type="date"
              value={startDate}
              onChange={(event) => {
                setPage(1);
                setStartDate(event.target.value);
              }}
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={endDate}
              onChange={(event) => {
                setPage(1);
                setEndDate(event.target.value);
              }}
            />
          </label>
          <label>
            Client ID
            <input
              type="number"
              placeholder="All"
              value={clientId}
              onChange={(event) => {
                setPage(1);
                setClientId(event.target.value);
              }}
            />
          </label>
          <label className="admin-transactions-filters__search">
            Search
            <input
              type="search"
              placeholder="Reference, restaurant, invoice…"
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
            />
          </label>
        </div>

        <div className="admin-payments-chips" style={{ marginTop: "1rem" }}>
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`admin-payments-chip${
                type === filter.value ? " admin-payments-chip--active" : ""
              }`}
              onClick={() => {
                setPage(1);
                setType(filter.value);
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {report?.period?.label && (
          <p className="admin-card__hint" style={{ marginTop: "0.75rem" }}>
            Period: {report.period.label}
          </p>
        )}
      </section>

      {loading ? (
        <div className="admin-payments-loading">
          <div className="admin-payments-loading__bar" />
          <p>Loading transactions…</p>
        </div>
      ) : (
        <>
          <div className="admin-payments-metrics">
            <SummaryCard
              label="Transactions"
              value={summary?.transactionCount ?? 0}
              hint={`${summary?.orderCount ?? 0} orders · ${summary?.subscriptionCount ?? 0} subs`}
            />
            <SummaryCard
              label="Customer paid"
              value={formatAdminAmount(summary?.customerPaidTotal ?? 0)}
            />
            <SummaryCard
              label="Vendor share"
              value={formatAdminAmount(summary?.vendorShareTotal ?? 0)}
              hint="Restaurant bill settlements"
            />
            <SummaryCard
              label="Platform revenue"
              value={formatAdminAmount(summary?.platformRevenueTotal ?? 0)}
              hint={`Fees ${formatAdminAmount(summary?.platformFeeTotal ?? 0)} + GST ${formatAdminAmount(summary?.gstTotal ?? 0)}`}
            />
          </div>

          <section className="admin-card admin-payments-orders">
            <div className="admin-payments-orders__head">
              <h2>Ledger</h2>
              <span>{pagination?.total ?? 0} transactions</span>
            </div>

            {!items.length ? (
              <div className="admin-payments-empty">
                <strong>No transactions in this period</strong>
                <p>Adjust the date range or filters.</p>
              </div>
            ) : (
              <div className="admin-transactions-table-wrap">
                <table className="admin-transactions-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Reference</th>
                      <th>Restaurant</th>
                      <th>Customer paid</th>
                      <th>Vendor got</th>
                      <th>Platform got</th>
                      <th>GST</th>
                      <th>Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => (
                      <tr key={`${row.type}-${row.transactionId}`}>
                        <td>{formatAdminTime(row.transactionDate)}</td>
                        <td>
                          <span
                            className={`admin-transactions-type admin-transactions-type--${row.type}`}
                          >
                            {row.type}
                          </span>
                        </td>
                        <td>
                          <div className="admin-transactions-ref">
                            <strong>{row.reference}</strong>
                            {row.orderNo && <span>#{row.orderNo}</span>}
                            {row.type === "order" && (
                              <Link to={adminRoutes.orderDetail(row.transactionId)}>View</Link>
                            )}
                          </div>
                        </td>
                        <td>
                          <div>
                            {row.clientId ? (
                              <Link to={adminRoutes.hotelDetail(row.clientId)}>
                                {row.restaurantName}
                              </Link>
                            ) : (
                              row.restaurantName
                            )}
                            {row.planName && <span className="admin-card__hint">{row.planName}</span>}
                          </div>
                        </td>
                        <td>{formatAdminAmount(row.customerPaid)}</td>
                        <td>{formatAdminAmount(row.vendorShare)}</td>
                        <td>{formatAdminAmount(row.platformRevenue)}</td>
                        <td>{formatAdminAmount(row.gstAmount)}</td>
                        <td>
                          {row.canDownloadInvoice ? (
                            <button
                              type="button"
                              className="admin-btn admin-btn--ghost admin-btn--small"
                              disabled={invoiceLoadingId === row.transactionId}
                              onClick={() => handleDownloadInvoice(row)}
                            >
                              {invoiceLoadingId === row.transactionId ? "…" : "PDF"}
                            </button>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {pagination && pagination.totalPages > 1 && (
              <div className="admin-transactions-pagination">
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost admin-btn--small"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </button>
                <span>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost admin-btn--small"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default AdminTransactionReportsPage;
