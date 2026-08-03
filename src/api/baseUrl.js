import axios from "axios";

const normalizeBaseUrl = (url) => (url ? url.replace(/\/+$/, "") : "");

/**
 * Restaurant / QR flows always call the backend API URL from env —
 * never the frontend site origin (e.g. sambhramaa.in) or legacy localhost:8000.
 */
export const RESTAURANT_API_BASE_URL =
  normalizeBaseUrl(process.env.REACT_APP_RESTAURANT_API_URL) || "http://localhost:3000";

export const restaurantClient = axios.create({
  baseURL: RESTAURANT_API_BASE_URL,
});

restaurantClient.interceptors.request.use((config) => {
  if (
    process.env.NODE_ENV === "production" &&
    RESTAURANT_API_BASE_URL.includes("localhost")
  ) {
    console.error(
      "REACT_APP_RESTAURANT_API_URL is missing in production. Set it in Vercel env vars."
    );
  }
  return config;
});

/** @deprecated Legacy user-management client — prefer restaurantClient for /qr routes. */
export const axiosInstance = axios.create({
  baseURL: RESTAURANT_API_BASE_URL,
});

axiosInstance.interceptors.request.use((config) => {
  const authInfo = localStorage.getItem("loginInfo");
  if (authInfo) {
    const { token } = JSON.parse(authInfo);
    config.headers["adminToken"] = token;
  }
  return config;
});
