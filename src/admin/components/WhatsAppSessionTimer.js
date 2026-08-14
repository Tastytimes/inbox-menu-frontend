import { useEffect, useMemo, useState } from "react";

function formatCountdown(remainingMs) {
  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getTimerState(remainingMs, windowMinutes) {
  if (remainingMs <= 0) {
    return {
      status: "expired",
      label: "Session expired — send template to reply",
    };
  }

  const windowMs = (windowMinutes || 15) * 60 * 1000;
  const warningThresholdMs = Math.min(3 * 60 * 1000, windowMs * 0.25);

  if (remainingMs <= warningThresholdMs) {
    return {
      status: "warning",
      label: `${formatCountdown(remainingMs)} left — session ending soon`,
    };
  }

  return {
    status: "active",
    label: `${formatCountdown(remainingMs)} left in session`,
  };
}

export function useWhatsAppSessionTimer(sessionExpiresAt, sessionWindowMinutes) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!sessionExpiresAt) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [sessionExpiresAt]);

  return useMemo(() => {
    if (!sessionExpiresAt) {
      return { isActive: false, status: "none", label: null };
    }

    const remainingMs = new Date(sessionExpiresAt).getTime() - now;
    const { status, label } = getTimerState(remainingMs, sessionWindowMinutes);

    return {
      isActive: remainingMs > 0,
      status,
      label,
    };
  }, [now, sessionExpiresAt, sessionWindowMinutes]);
}

const WhatsAppSessionTimer = ({ sessionExpiresAt, sessionWindowMinutes }) => {
  const timer = useWhatsAppSessionTimer(sessionExpiresAt, sessionWindowMinutes);

  if (!timer.label) {
    return null;
  }

  return (
    <div
      className={`admin-support-inbox__session-timer admin-support-inbox__session-timer--${timer.status}`}
      role="status"
      aria-live="polite"
    >
      <span className="admin-support-inbox__session-timer-dot" aria-hidden="true" />
      <span>{timer.label}</span>
    </div>
  );
};

export default WhatsAppSessionTimer;
