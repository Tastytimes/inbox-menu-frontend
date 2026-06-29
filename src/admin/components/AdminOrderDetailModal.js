import React, { useEffect } from "react";
import AdminOrderDetailView from "./AdminOrderDetailView";

const AdminOrderDetailModal = ({ orderId, onClose, onRefunded }) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!orderId) return null;

  return (
    <div className="admin-order-detail-modal" role="dialog" aria-modal="true">
      <button
        type="button"
        className="admin-order-detail-modal__backdrop"
        aria-label="Close order detail"
        onClick={onClose}
      />
      <div className="admin-order-detail-modal__panel">
        <AdminOrderDetailView
          orderId={orderId}
          onClose={onClose}
          onRefunded={onRefunded}
          layout="modal"
        />
      </div>
    </div>
  );
};

export default AdminOrderDetailModal;
