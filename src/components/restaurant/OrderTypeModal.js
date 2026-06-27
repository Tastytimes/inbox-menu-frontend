import React from "react";
import Modal from "react-bootstrap/Modal";

const OrderTypeModal = ({
  show,
  foodName,
  onClose,
  onSelect,
  loading,
}) => (
  <Modal show={show} onHide={onClose} centered className="order-type-modal">
    <Modal.Header closeButton className="border-0 pb-0">
      <Modal.Title className="fs-5 fw-semibold">How would you like it?</Modal.Title>
    </Modal.Header>
    <Modal.Body className="pt-2 pb-4">
      {foodName && (
        <p className="text-muted small mb-3">
          Adding <span className="fw-medium text-dark">{foodName}</span> to your cart
        </p>
      )}
      <div className="d-grid gap-3">
        <button
          type="button"
          className="order-type-btn order-type-btn--takeaway"
          disabled={loading}
          onClick={() => onSelect(true)}
        >
          <span className="order-type-btn__icon" aria-hidden>
            🥡
          </span>
          <span className="order-type-btn__text">
            <strong>Takeaway</strong>
            <small>Pack it to go</small>
          </span>
        </button>
        <button
          type="button"
          className="order-type-btn order-type-btn--dinein"
          disabled={loading}
          onClick={() => onSelect(false)}
        >
          <span className="order-type-btn__icon" aria-hidden>
            🍽️
          </span>
          <span className="order-type-btn__text">
            <strong>Dine in</strong>
            <small>Enjoy here at the restaurant</small>
          </span>
        </button>
      </div>
    </Modal.Body>
  </Modal>
);

export default OrderTypeModal;
