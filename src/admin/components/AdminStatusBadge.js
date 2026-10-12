import React from "react";

const STATUS_CLASS = {
  placed: "admin-badge--placed",
  accepted: "admin-badge--accepted",
  ready: "admin-badge--ready",
  delivered: "admin-badge--delivered",
  cancelled: "admin-badge--inactive",
  declined: "admin-badge--inactive",
  pending: "admin-badge--placed",
  processing: "admin-badge--accepted",
  submitted: "admin-badge--placed",
  approved: "admin-badge--ready",
  rejected: "admin-badge--inactive",
  paid: "admin-badge--ready",
  failed: "admin-badge--inactive",
  active: "admin-badge--ready",
  success: "admin-badge--ready",
  completed: "admin-badge--ready",
  expired: "admin-badge--inactive",
  waived: "admin-badge--accepted",
  not_applied: "admin-badge--inactive",
  applied: "admin-badge--placed",
  manual: "admin-badge--placed",
  easebuzz: "admin-badge--ready",
};

const AdminStatusBadge = ({ status, label }) => {
  const key = String(status || "").toLowerCase();
  const className = `admin-badge ${STATUS_CLASS[key] || ""}`;

  return <span className={className}>{label || status || "Unknown"}</span>;
};

export default AdminStatusBadge;
