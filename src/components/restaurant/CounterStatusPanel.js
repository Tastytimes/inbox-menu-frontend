import React from "react";
import {
  formatCounterStatus,
  getCounterStatusTone,
  resolveCounterStatuses,
} from "../../utils/orderItemGroups";

const CounterLane = ({ icon, label, ticket }) => {
  if (!ticket) return null;

  const tone = getCounterStatusTone(ticket.statusLabel);

  return (
    <div className={`counter-status-panel__lane counter-status-panel__lane--${tone}`}>
      <div className="counter-status-panel__lane-head">
        <span className="counter-status-panel__icon" aria-hidden>
          {icon}
        </span>
        <div>
          <strong>{label}</strong>
          {ticket.counterName && (
            <span className="counter-status-panel__station">{ticket.counterName}</span>
          )}
        </div>
      </div>
      <span className={`counter-status-panel__badge counter-status-panel__badge--${tone}`}>
        {formatCounterStatus(ticket.statusLabel)}
      </span>
    </div>
  );
};

const CounterStatusPanel = ({ counterTickets = [], title = "Kitchen progress" }) => {
  if (!counterTickets.length) return null;

  const mapped = resolveCounterStatuses(counterTickets);
  const hasMapped = mapped.dinein || mapped.parcel;

  return (
    <section className="counter-status-panel" aria-label={title}>
      <h2 className="counter-status-panel__title">{title}</h2>
      <p className="counter-status-panel__hint">
        Dine-in and takeaway are prepared at different counters — each updates separately.
      </p>

      {hasMapped ? (
        <div className="counter-status-panel__lanes">
          <CounterLane icon="🍽️" label="Dine-in counter" ticket={mapped.dinein} />
          <CounterLane icon="🥡" label="Takeaway counter" ticket={mapped.parcel} />
          {mapped.other.map((ticket, index) => (
            <CounterLane
              key={`${ticket.counterName}-${index}`}
              icon="👨‍🍳"
              label={ticket.counterName || "Kitchen station"}
              ticket={ticket}
            />
          ))}
        </div>
      ) : (
        <div className="counter-status-panel__lanes">
          {counterTickets.map((ticket, index) => (
            <CounterLane
              key={`${ticket.counterName}-${index}`}
              icon="👨‍🍳"
              label={ticket.counterName || "Station"}
              ticket={ticket}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default CounterStatusPanel;
