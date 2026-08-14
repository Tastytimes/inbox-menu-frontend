import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  assignSupportConversation,
  getSupportConversation,
  listSupportConversations,
  lookupSupportOrders,
  replySupportConversation,
  reopenSupportConversation,
  replySupportConversationMedia,
  resolveSupportConversation,
  retrySupportMessage,
  sendSupportTemplate,
} from "../api/adminApi";
import AdminOrderDetailModal from "../components/AdminOrderDetailModal";
import AdminStatusBadge from "../components/AdminStatusBadge";
import SupportMessageMedia from "../components/SupportMessageMedia";
import WhatsAppSessionTimer, { useWhatsAppSessionTimer } from "../components/WhatsAppSessionTimer";
import { useAdminSocket } from "../hooks/useAdminSocket";
import {
  formatAdminAmount,
  formatAdminTime,
  formatOrderLabel,
} from "../utils/adminFormatters";
import { getFulfillmentLabel } from "../../utils/fulfillmentStatus";

const STATUS_FILTERS = [
  { value: "active", label: "Active" },
  { value: "open", label: "Open" },
  { value: "assigned", label: "Assigned" },
  { value: "resolved", label: "Resolved" },
];

const PAGE_SIZE = 20;

function formatPhoneDisplay(phone) {
  if (!phone) return "—";
  if (phone.length === 12 && phone.startsWith("91")) {
    return `+91 ${phone.slice(2, 7)} ${phone.slice(7)}`;
  }
  return phone;
}

function formatDeliveryStatus(status) {
  switch (status) {
    case "sent":
      return "Sent";
    case "delivered":
      return "Delivered";
    case "read":
      return "Read";
    case "failed":
      return "Failed";
    case "pending":
      return "Pending";
    default:
      return null;
  }
}

function shouldShowMessageBody(message) {
  if (!message.body) return false;

  const placeholders = {
    image: "[Image]",
    video: "[Video]",
    audio: "[Audio]",
    document: "[Document]",
  };

  if (message.mediaId && message.body === placeholders[message.messageType]) {
    return false;
  }

  return true;
}

const MEDIA_ACCEPT = "image/jpeg,image/png,image/webp,video/mp4,video/3gpp,video/3gp";

const AdminWhatsAppInbox = () => {
  const [statusFilter, setStatusFilter] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [thread, setThread] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const [ordersResult, setOrdersResult] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { connected } = useAdminSocket(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const loadConversations = useCallback(async () => {
    setLoadingList(true);
    setError("");

    try {
      const status = statusFilter === "active" ? undefined : statusFilter;
      const data = await listSupportConversations({
        status,
        search: debouncedSearch || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setConversations(data.conversations ?? []);
      setTotalPages(data.totalPages ?? 1);

      if (selectedId && !(data.conversations ?? []).some((item) => item.id === selectedId)) {
        setSelectedId(null);
        setThread(null);
        setOrdersResult(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not load WhatsApp conversations.");
    } finally {
      setLoadingList(false);
    }
  }, [debouncedSearch, page, selectedId, statusFilter]);

  const loadThread = useCallback(async (conversationId) => {
    if (!conversationId) return;

    setLoadingThread(true);
    setError("");

    try {
      const data = await getSupportConversation(conversationId);
      setThread(data);

      const phone = data.customerPhone?.replace(/^91/, "") ?? "";
      if (phone.length === 10) {
        const orders = await lookupSupportOrders(phone);
        setOrdersResult(orders);
      } else {
        setOrdersResult(null);
      }

      setConversations((current) =>
        current.map((item) =>
          item.id === conversationId ? { ...item, unreadCount: 0 } : item
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || "Could not load conversation.");
    } finally {
      setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (selectedId) {
      void loadThread(selectedId);
    }
  }, [selectedId, loadThread]);

  const handleSelectConversation = (conversationId) => {
    setSelectedId(conversationId);
    setReplyText("");
    setSelectedFile(null);
    setSelectedOrderId(null);
  };

  const clearSelectedFile = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setFilePreviewUrl(null);
      return undefined;
    }

    const previewUrl = URL.createObjectURL(selectedFile);
    setFilePreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [selectedFile]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      clearSelectedFile();
      return;
    }

    setSelectedFile(file);
  };

  const handleAssign = async () => {
    if (!selectedId) return;

    setSubmitting(true);
    setError("");

    try {
      const updated = await assignSupportConversation(selectedId);
      setThread((current) => (current ? { ...current, ...updated } : current));
      await loadConversations();
    } catch (err) {
      setError(err.response?.data?.message || "Could not assign conversation.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (event) => {
    event.preventDefault();
    if (!selectedId || (!replyText.trim() && !selectedFile)) return;

    setSubmitting(true);
    setError("");

    try {
      const result = selectedFile
        ? await replySupportConversationMedia(selectedId, selectedFile, replyText)
        : await replySupportConversation(selectedId, replyText.trim());

      setThread((current) =>
        current
          ? {
              ...current,
              ...result.conversation,
              messages: [...(current.messages ?? []), result.message],
            }
          : current
      );
      setReplyText("");
      clearSelectedFile();
      await loadConversations();
    } catch (err) {
      setError(err.response?.data?.message || "Could not send reply.");
      await loadThread(selectedId);
      await loadConversations();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendTemplate = async () => {
    if (!selectedId) return;

    setSubmitting(true);
    setError("");

    try {
      const result = await sendSupportTemplate(selectedId);
      setThread((current) =>
        current
          ? {
              ...current,
              ...result.conversation,
              messages: [...(current.messages ?? []), result.message],
            }
          : current
      );
      await loadConversations();
    } catch (err) {
      setError(err.response?.data?.message || "Could not send template message.");
      await loadThread(selectedId);
      await loadConversations();
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetryMessage = async (messageId) => {
    if (!selectedId) return;

    setSubmitting(true);
    setError("");

    try {
      const result = await retrySupportMessage(selectedId, messageId);
      setThread((current) =>
        current
          ? {
              ...current,
              ...result.conversation,
              messages: (current.messages ?? []).map((message) =>
                message.id === messageId ? result.message : message
              ),
            }
          : current
      );
      await loadConversations();
    } catch (err) {
      setError(err.response?.data?.message || "Could not retry message.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedId) return;

    setSubmitting(true);
    setError("");

    try {
      await resolveSupportConversation(selectedId);
      setSelectedId(null);
      setThread(null);
      setOrdersResult(null);
      await loadConversations();
    } catch (err) {
      setError(err.response?.data?.message || "Could not resolve conversation.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReopen = async () => {
    if (!selectedId) return;

    setSubmitting(true);
    setError("");

    try {
      const updated = await reopenSupportConversation(selectedId);
      setThread((current) => (current ? { ...current, ...updated } : current));
      await loadConversations();
    } catch (err) {
      setError(err.response?.data?.message || "Could not reopen conversation.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const refresh = () => {
      void loadConversations();
      if (selectedId) {
        void loadThread(selectedId);
      }
    };

    window.addEventListener("admin-support-message", refresh);
    return () => window.removeEventListener("admin-support-message", refresh);
  }, [loadConversations, loadThread, selectedId]);

  const sessionTimer = useWhatsAppSessionTimer(
    thread?.sessionExpiresAt,
    thread?.sessionWindowMinutes
  );
  const sessionActive = sessionTimer.isActive;

  return (
    <>
      <div className="admin-support-inbox__meta">
        <span className={`admin-support-inbox__live${connected ? " admin-support-inbox__live--on" : ""}`}>
          {connected ? "Live updates on" : "Live updates off"}
        </span>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-support-inbox">
        <aside className="admin-support-inbox__list admin-card">
          <div className="admin-support-inbox__search">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search phone or name…"
              aria-label="Search conversations"
            />
          </div>

          <div className="admin-support-inbox__filters">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={`admin-btn admin-btn--ghost${
                  statusFilter === filter.value ? " admin-btn--active" : ""
                }`}
                onClick={() => {
                  setStatusFilter(filter.value);
                  setPage(1);
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {loadingList ? (
            <p className="admin-empty">Loading conversations…</p>
          ) : !conversations.length ? (
            <p className="admin-empty">No WhatsApp conversations yet.</p>
          ) : (
            <ul className="admin-support-inbox__items">
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    type="button"
                    className={`admin-support-inbox__item${
                      selectedId === conversation.id ? " admin-support-inbox__item--active" : ""
                    }`}
                    onClick={() => handleSelectConversation(conversation.id)}
                  >
                    <div className="admin-support-inbox__item-top">
                      <strong>
                        {conversation.customerName || formatPhoneDisplay(conversation.customerPhone)}
                      </strong>
                      {conversation.unreadCount > 0 ? (
                        <span className="admin-support-inbox__badge">{conversation.unreadCount}</span>
                      ) : null}
                    </div>
                    <div className="admin-support-inbox__item-phone">
                      {formatPhoneDisplay(conversation.customerPhone)}
                    </div>
                    <div className="admin-support-inbox__item-preview">
                      {conversation.lastMessagePreview || "—"}
                    </div>
                    <div className="admin-support-inbox__item-footer">
                      <AdminStatusBadge status={conversation.status} label={conversation.status} />
                      <span>{formatAdminTime(conversation.lastMessageAt)}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {totalPages > 1 ? (
            <div className="admin-support-inbox__pagination">
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                disabled={page <= 1 || loadingList}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                disabled={page >= totalPages || loadingList}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Next
              </button>
            </div>
          ) : null}
        </aside>

        <section className="admin-support-inbox__thread admin-card">
          {!selectedId || !thread ? (
            <div className="admin-empty admin-support-inbox__placeholder">
              Select a conversation to view messages and reply.
            </div>
          ) : loadingThread ? (
            <p className="admin-empty">Loading conversation…</p>
          ) : (
            <>
              <header className="admin-support-inbox__thread-header">
                <div>
                  <h2>{thread.customerName || formatPhoneDisplay(thread.customerPhone)}</h2>
                  <p>{formatPhoneDisplay(thread.customerPhone)}</p>
                  {thread.assignedAdminName ? (
                    <p className="admin-support-inbox__assigned">
                      Assigned to {thread.assignedAdminName}
                    </p>
                  ) : null}
                  {thread.sessionExpiresAt ? (
                    <WhatsAppSessionTimer
                      sessionExpiresAt={thread.sessionExpiresAt}
                      sessionWindowMinutes={thread.sessionWindowMinutes}
                    />
                  ) : null}
                </div>
                <div className="admin-support-inbox__actions">
                  {thread.status !== "resolved" ? (
                    <>
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost"
                        disabled={submitting}
                        onClick={() => void handleAssign()}
                      >
                        Pick
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--primary"
                        disabled={submitting}
                        onClick={() => void handleResolve()}
                      >
                        Resolve
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="admin-btn admin-btn--ghost"
                      disabled={submitting}
                      onClick={() => void handleReopen()}
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </header>

              {!sessionActive && thread.status !== "resolved" ? (
                <div className="admin-support-inbox__session-banner">
                  <p>Free-text replies are blocked until you send an approved template.</p>
                  <button
                    type="button"
                    className="admin-btn admin-btn--primary"
                    disabled={submitting}
                    onClick={() => void handleSendTemplate()}
                  >
                    Send template ({thread.templateName || "hello_world"})
                  </button>
                </div>
              ) : null}

              <div className="admin-support-inbox__messages">
                {(thread.messages ?? []).map((message) => {
                  const deliveryLabel =
                    message.direction === "outbound"
                      ? formatDeliveryStatus(message.deliveryStatus)
                      : null;

                  return (
                    <div
                      key={message.id}
                      className={`admin-support-inbox__message admin-support-inbox__message--${message.direction}`}
                    >
                      {(message.messageType === "image" ||
                        message.messageType === "video" ||
                        message.messageType === "audio" ||
                        message.messageType === "document") &&
                      message.mediaId ? (
                        <SupportMessageMedia
                          mediaId={message.mediaId}
                          messageType={message.messageType}
                          mediaMimeType={message.mediaMimeType}
                          caption={message.mediaCaption || message.body}
                        />
                      ) : null}

                      {shouldShowMessageBody(message) ? (
                        <div className="admin-support-inbox__message-body">{message.body}</div>
                      ) : null}

                      <div className="admin-support-inbox__message-meta">
                        {message.direction === "outbound"
                          ? message.sentByAdminName || "Support"
                          : thread.customerName || "Customer"}
                        {" · "}
                        {formatAdminTime(message.createdAt)}
                        {deliveryLabel ? ` · ${deliveryLabel}` : ""}
                        {message.deliveryStatus === "failed" && message.failureReason
                          ? ` — ${message.failureReason}`
                          : ""}
                      </div>

                      {message.direction === "outbound" &&
                      message.deliveryStatus === "failed" ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost admin-support-inbox__retry"
                          disabled={submitting}
                          onClick={() => void handleRetryMessage(message.id)}
                        >
                          Retry send
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {thread.status !== "resolved" ? (
                sessionActive ? (
                  <form className="admin-support-inbox__composer" onSubmit={handleReply}>
                    {selectedFile ? (
                      <div className="admin-support-inbox__attachment-preview">
                        {selectedFile.type.startsWith("video/") && filePreviewUrl ? (
                          <video
                            src={filePreviewUrl}
                            controls
                            playsInline
                            className="admin-support-inbox__attachment-video"
                          />
                        ) : selectedFile.type.startsWith("image/") && filePreviewUrl ? (
                          <img
                            src={filePreviewUrl}
                            alt={selectedFile.name}
                            className="admin-support-inbox__attachment-image"
                          />
                        ) : (
                          <span>{selectedFile.name}</span>
                        )}
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost"
                          onClick={clearSelectedFile}
                        >
                          Remove
                        </button>
                      </div>
                    ) : null}

                    <textarea
                      value={replyText}
                      onChange={(event) => setReplyText(event.target.value)}
                      placeholder={selectedFile ? "Add a caption (optional)…" : "Type a reply…"}
                      rows={3}
                    />

                    <div className="admin-support-inbox__composer-actions">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={MEDIA_ACCEPT}
                        className="admin-support-inbox__file-input"
                        onChange={handleFileChange}
                      />
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost"
                        disabled={submitting}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Attach image/video
                      </button>
                      <button
                        type="submit"
                        className="admin-btn admin-btn--primary"
                        disabled={submitting || (!replyText.trim() && !selectedFile)}
                      >
                        {submitting ? "Sending…" : "Send on WhatsApp"}
                      </button>
                    </div>
                  </form>
                ) : null
              ) : null}

              {ordersResult?.orders?.length ? (
                <div className="admin-support-inbox__orders">
                  <h3>Recent orders</h3>
                  <div className="admin-table-wrap">
                    <table className="admin-table admin-table--clickable">
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Restaurant</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordersResult.orders.map((order) => (
                          <tr
                            key={order.orderId}
                            onClick={() => setSelectedOrderId(order.orderId)}
                          >
                            <td>{formatOrderLabel(order)}</td>
                            <td>{order.slug || order.clientId || "—"}</td>
                            <td>{formatAdminAmount(order.pricing?.customerPayAmount)}</td>
                            <td>
                              <AdminStatusBadge
                                status={order.fulfillmentStatus}
                                label={getFulfillmentLabel(order.fulfillmentStatus)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>

      {selectedOrderId && (
        <AdminOrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </>
  );
};

export default AdminWhatsAppInbox;
