export const PAYMENTS_SCOPES = [
  { value: "today", label: "Today" },
  { value: "overall", label: "All time" },
];

export const getPaymentsScopeSummary = (data, scope) => {
  const scoped = data?.summary?.[scope];
  if (scoped) return scoped;

  const legacy = data?.summary;
  if (!legacy || data?.summary?.today || data?.summary?.overall) {
    return {};
  }

  if (scope === "today") {
    return {
      orderCount: legacy.paidOrdersToday,
      paidOrders: legacy.paidOrdersToday,
      gmv: legacy.gmvToday,
      platformFees: legacy.platformFeesToday,
      pendingPayments: legacy.pendingPaymentsToday,
      failedPayments: legacy.failedPaymentsToday,
    };
  }

  return {
    orderCount: legacy.paidOrdersAllTime,
    paidOrders: legacy.paidOrdersAllTime,
    gmv: legacy.gmvAllTime,
    platformFees: legacy.platformFeesAllTime,
  };
};

export const getPaymentsScopeOrders = (data, scope) => {
  if (Array.isArray(data?.orders?.[scope])) return data.orders[scope];
  if (scope === "today" && Array.isArray(data?.recentOrders)) return data.recentOrders;
  return [];
};

export const getOrderPayAmount = (order) =>
  order?.pricing?.customerPayAmount ?? order?.customerPayAmount;

export const getSummaryCount = (summary, ...keys) => {
  for (const key of keys) {
    const value = summary?.[key];
    if (value != null) return value;
  }
  return 0;
};
