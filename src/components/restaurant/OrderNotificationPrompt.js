import React from "react";

const OrderNotificationPrompt = ({
  show,
  enabling,
  notificationPermission,
  enableMessage,
  onEnable,
  onDismiss,
}) => {
  if (!show) return null;

  const blocked = notificationPermission === "denied";
  const granted = notificationPermission === "granted";

  return (
    <div className="order-notification-prompt">
      <div className="order-notification-prompt__content">
        {granted ? (
          <>
            <strong>Notifications are on</strong>
            <p>You'll get pop-up alerts when your order status changes.</p>
          </>
        ) : blocked ? (
          <>
            <strong>Notifications are turned off</strong>
            <p>
              Allow notifications for this site in your browser settings (click
              the lock icon in the address bar), then tap the button below.
            </p>
          </>
        ) : (
          <>
            <strong>Get notified when your order is ready</strong>
            <p>Tap the button below and choose Allow in the browser popup.</p>
          </>
        )}
      </div>
      <div className="order-notification-prompt__actions">
        {!granted && (
          <button
            type="button"
            className="order-notification-prompt__enable"
            onClick={onEnable}
            disabled={enabling}
          >
            {enabling ? "Enabling…" : "Turn on notifications"}
          </button>
        )}
        {!granted && (
          <button
            type="button"
            className="order-notification-prompt__dismiss"
            onClick={onDismiss}
            disabled={enabling}
          >
            Not now
          </button>
        )}
      </div>
      {enableMessage && (
        <p
          className={`order-notification-prompt__feedback${
            granted ? " order-notification-prompt__feedback--success" : ""
          }`}
          role="status"
        >
          {enableMessage}
        </p>
      )}
    </div>
  );
};

export default OrderNotificationPrompt;
