import { useEffect, useRef } from "react";
import { getOrder } from "../api/orderApi";
import { getFulfillmentUpdateMessage } from "../utils/fulfillmentStatus";

export const FULFILLMENT_POLL_MS = 5000;

export const useFulfillmentPolling = ({
  orderIds = [],
  orders = [],
  enabled = true,
  onOrderUpdate,
  onNotify,
}) => {
  const prevStatusRef = useRef({});
  const callbacksRef = useRef({ onOrderUpdate, onNotify });
  const orderIdsKey = [...orderIds].sort().join("|");

  callbacksRef.current = { onOrderUpdate, onNotify };

  useEffect(() => {
    if (!enabled || !orderIdsKey) return;

    const trackedIds = new Set(orderIdsKey.split("|").filter(Boolean));
    const orderMap = new Map(orders.map((order) => [order.orderId, order]));

    for (const trackedId of Object.keys(prevStatusRef.current)) {
      if (!trackedIds.has(trackedId)) {
        delete prevStatusRef.current[trackedId];
      }
    }

    for (const orderId of trackedIds) {
      if (prevStatusRef.current[orderId] === undefined) {
        prevStatusRef.current[orderId] =
          orderMap.get(orderId)?.fulfillmentStatus ?? null;
      }
    }
  }, [enabled, orderIdsKey, orders]);

  useEffect(() => {
    if (!enabled || !orderIdsKey) return undefined;

    const ids = orderIdsKey.split("|").filter(Boolean);

    const poll = async () => {
      for (const orderId of ids) {
        try {
          const data = await getOrder(orderId);
          if (!data?.orderId) continue;

          const previousStatus = prevStatusRef.current[orderId];
          const nextStatus = data.fulfillmentStatus ?? null;

          if (
            previousStatus !== undefined &&
            previousStatus !== nextStatus &&
            nextStatus
          ) {
            const message = getFulfillmentUpdateMessage(
              data,
              previousStatus,
              nextStatus
            );
            if (message) {
              callbacksRef.current.onNotify?.({
                order: data,
                previousStatus,
                status: nextStatus,
                message,
              });
            }
          }

          prevStatusRef.current[orderId] = nextStatus;
          callbacksRef.current.onOrderUpdate?.(data);
        } catch {
          /* keep polling other orders */
        }
      }
    };

    poll();
    const timer = setInterval(poll, FULFILLMENT_POLL_MS);

    return () => clearInterval(timer);
  }, [enabled, orderIdsKey]);
};
