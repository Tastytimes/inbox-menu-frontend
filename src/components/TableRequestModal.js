import React, { useState } from "react";

const OPTIONS = [
  { id: "water", label: "Water" },
  { id: "bill", label: "Bill" },
  { id: "other", label: "Other" },
];

const TableRequestModal = ({
  open,
  busy,
  onClose,
  onSubmit,
}) => {
  const [type, setType] = useState("water");
  const [note, setNote] = useState("");

  if (!open) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ type, note: note.trim() });
  };

  return (
    <div className="group-order-modal" role="presentation">
      <button
        type="button"
        className="group-order-modal__backdrop"
        aria-label="Close request"
        onClick={() => !busy && onClose()}
      />
      <div
        className="group-order-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="table-request-title"
      >
        <h2 id="table-request-title">Call staff</h2>
        <p>Ask the captain for water, the bill, or anything else at the table.</p>
        <form className="group-order-invite" onSubmit={handleSubmit}>
          <div className="table-request-options">
            {OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`table-request-option${
                  type === option.id ? " table-request-option--active" : ""
                }`}
                onClick={() => setType(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
          {type === "other" ? (
            <label>
              What do you need?
              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Napkins, extra plates…"
                autoFocus
              />
            </label>
          ) : null}
          <div className="group-order-modal__actions">
            <button
              type="button"
              className="group-order-modal__cancel"
              disabled={busy}
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" disabled={busy}>
              {busy ? "Sending…" : "Send request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TableRequestModal;
