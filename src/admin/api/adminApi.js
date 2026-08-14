import axios from "axios";
import { RESTAURANT_API_BASE_URL } from "../../api/baseUrl";
import { clearStoredAdminAuth, getStoredAdminAuth } from "../utils/adminAuthStorage";
import { adminRoutes } from "../../utils/routes";

export const PLATFORM_SUPER_ROLE = "platform_super";
export const PLATFORM_ADMIN_ROLE = "platform_admin";

export { isSuperAdminRole } from "../constants/auth";

export const adminClient = axios.create({
  baseURL: RESTAURANT_API_BASE_URL,
});

adminClient.interceptors.request.use((config) => {
  const auth = getStoredAdminAuth();
  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

adminClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredAdminAuth();
      if (!window.location.pathname.startsWith(adminRoutes.login)) {
        window.location.assign(adminRoutes.login);
      }
    }
    return Promise.reject(error);
  }
);

export const adminSignIn = async ({ email, password }) => {
  const { data } = await adminClient.post("/admin/auth/signin", {
    email: email.trim(),
    password,
  });
  return data;
};

export const getAdminMe = async () => {
  const { data } = await adminClient.get("/admin/auth/me");
  return data;
};

export const adminLogout = async () => {
  try {
    await adminClient.post("/admin/auth/logout");
  } catch {
    // Session may already be invalid; still clear local auth.
  }
};

export const getPlatformOverview = async () => {
  const { data } = await adminClient.get("/admin/platform/overview");
  return data;
};

export const listPlatformRestaurants = async (status) => {
  const params = status ? { status } : {};
  const { data } = await adminClient.get("/admin/platform/restaurants", { params });
  return data;
};

export const updatePlatformRestaurantStatus = async (clientId, status) => {
  const { data } = await adminClient.patch(
    `/admin/platform/restaurants/${clientId}/status`,
    { status }
  );
  return data;
};

export const getPlatformPaymentsOverview = async () => {
  const { data } = await adminClient.get("/admin/platform/payments/overview");
  return data;
};

export const lookupSupportOrders = async (customerPhone) => {
  const { data } = await adminClient.post("/admin/platform/support/orders/lookup", {
    customerPhone,
  });
  return data;
};

export const getRestaurantSupportProfile = async (clientId) => {
  const { data } = await adminClient.get(`/admin/platform/support/restaurants/${clientId}`);
  return data;
};

export const updateRestaurantSupportProfile = async (clientId, payload) => {
  const { data } = await adminClient.patch(
    `/admin/platform/support/restaurants/${clientId}`,
    payload
  );
  return data;
};

export const uploadRestaurantDocuments = async (clientId, files) => {
  const formData = new FormData();
  Object.entries(files).forEach(([field, file]) => {
    if (file) formData.append(field, file);
  });

  const { data } = await adminClient.post(
    `/admin/platform/support/restaurants/${clientId}/documents`,
    formData
  );
  return data;
};

export const getSupportOrder = async (orderId, { signal } = {}) => {
  const { data } = await adminClient.get(`/admin/platform/support/orders/${orderId}`, {
    signal,
  });
  return data;
};

export const listAdminUsers = async () => {
  const { data } = await adminClient.get("/admin/users");
  return data;
};

export const createAdminUser = async (payload) => {
  const { data } = await adminClient.post("/admin/users", payload);
  return data;
};

export const updateAdminUser = async (id, payload) => {
  const { data } = await adminClient.patch(`/admin/users/${id}`, payload);
  return data;
};

export const deactivateAdminUser = async (id) => {
  const { data } = await adminClient.delete(`/admin/users/${id}`);
  return data;
};

export const getAdminApiBaseUrl = () => RESTAURANT_API_BASE_URL;

// Subscription plans
export const listSubscriptionPlans = async () => {
  const { data } = await adminClient.get("/admin/platform/subscription-plans");
  return data;
};

export const getSubscriptionPlan = async (id) => {
  const { data } = await adminClient.get(`/admin/platform/subscription-plans/${id}`);
  return data;
};

export const createSubscriptionPlan = async (payload) => {
  const { data } = await adminClient.post("/admin/platform/subscription-plans", payload);
  return data;
};

export const updateSubscriptionPlan = async (id, payload) => {
  const { data } = await adminClient.patch(`/admin/platform/subscription-plans/${id}`, payload);
  return data;
};

export const deactivateSubscriptionPlan = async (id) => {
  const { data } = await adminClient.delete(`/admin/platform/subscription-plans/${id}`);
  return data;
};

// Restaurant subscriptions
export const listPlatformSubscriptions = async ({ status, clientId } = {}) => {
  const params = {};
  if (status) params.status = status;
  if (clientId) params.clientId = clientId;
  const { data } = await adminClient.get("/admin/platform/subscriptions", { params });
  return data;
};

export const getPlatformSubscription = async (id) => {
  const { data } = await adminClient.get(`/admin/platform/subscriptions/${id}`);
  return data;
};

export const createPlatformSubscription = async (payload) => {
  const { data } = await adminClient.post("/admin/platform/subscriptions", payload);
  return data;
};

export const updatePlatformSubscription = async (id, payload) => {
  const { data } = await adminClient.patch(`/admin/platform/subscriptions/${id}`, payload);
  return data;
};

export const cancelPlatformSubscription = async (id) => {
  const { data } = await adminClient.delete(`/admin/platform/subscriptions/${id}`);
  return data;
};

export const listExpiringSubscriptions = async (days = 7) => {
  const { data } = await adminClient.get("/admin/platform/subscriptions/expiring", {
    params: { days },
  });
  return data;
};

// Refunds
export const listRefundCandidates = async ({ includeManual, includeRefunded } = {}) => {
  const params = {};
  if (includeManual) params.includeManual = "true";
  if (includeRefunded) params.includeRefunded = "true";
  const { data } = await adminClient.get("/admin/platform/refunds/candidates", { params });
  return data;
};

export const getRefundCandidate = async (orderId, { signal } = {}) => {
  const { data } = await adminClient.get(`/admin/platform/refunds/candidates/${orderId}`, {
    signal,
  });
  return data;
};

export const processRefund = async (orderId, payload) => {
  const { data } = await adminClient.post(
    `/admin/platform/refunds/candidates/${orderId}/refund`,
    payload
  );
  return data;
};

export const getRefundStatus = async (orderId, { signal } = {}) => {
  const { data } = await adminClient.get(
    `/admin/platform/refunds/candidates/${orderId}/status`,
    { signal }
  );
  return data;
};

export const listSupportConversations = async ({ status, search, page, limit } = {}) => {
  const params = {};
  if (status) params.status = status;
  if (search) params.search = search;
  if (page) params.page = page;
  if (limit) params.limit = limit;

  const { data } = await adminClient.get("/admin/platform/support/conversations", { params });
  return data;
};

export const getSupportUnreadCount = async () => {
  const { data } = await adminClient.get("/admin/platform/support/conversations/unread-count");
  return data;
};

export const fetchSupportMediaBlob = async (mediaId) => {
  const { data } = await adminClient.get(`/admin/platform/support/media/${mediaId}`, {
    responseType: "blob",
  });
  return data;
};

export const getSupportConversation = async (conversationId) => {
  const { data } = await adminClient.get(
    `/admin/platform/support/conversations/${conversationId}`
  );
  return data;
};

export const assignSupportConversation = async (conversationId) => {
  const { data } = await adminClient.post(
    `/admin/platform/support/conversations/${conversationId}/assign`
  );
  return data;
};

export const replySupportConversation = async (conversationId, message) => {
  const { data } = await adminClient.post(
    `/admin/platform/support/conversations/${conversationId}/reply`,
    { message }
  );
  return data;
};

export const sendSupportTemplate = async (conversationId, payload = {}) => {
  const { data } = await adminClient.post(
    `/admin/platform/support/conversations/${conversationId}/reply-template`,
    payload
  );
  return data;
};

export const retrySupportMessage = async (conversationId, messageId) => {
  const { data } = await adminClient.post(
    `/admin/platform/support/conversations/${conversationId}/messages/${messageId}/retry`
  );
  return data;
};

export const replySupportConversationMedia = async (conversationId, file, caption = "") => {
  const formData = new FormData();
  formData.append("file", file);
  if (caption.trim()) {
    formData.append("caption", caption.trim());
  }

  const { data } = await adminClient.post(
    `/admin/platform/support/conversations/${conversationId}/reply-media`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return data;
};

export const resolveSupportConversation = async (conversationId) => {
  const { data } = await adminClient.post(
    `/admin/platform/support/conversations/${conversationId}/resolve`
  );
  return data;
};

export const reopenSupportConversation = async (conversationId) => {
  const { data } = await adminClient.post(
    `/admin/platform/support/conversations/${conversationId}/reopen`
  );
  return data;
};
