import React from "react";

const DetailRow = ({ label, value, children }) => (
  <div className="admin-detail-row">
    <span>{label}</span>
    {children ?? <strong>{value ?? "—"}</strong>}
  </div>
);

export default DetailRow;
