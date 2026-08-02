import axios from "axios";

export const axiosInstance = axios.create({
 baseURL: "http://localhost:8000/menu-v1/",
  // baseURL:
  //  "https://selfserviceportalbe-production.up.railway.app/api-v1/",
});

axiosInstance.interceptors.request.use((config) => {
  const authInfo = localStorage.getItem("loginInfo");
  if (authInfo) {
    const { token } = JSON.parse(authInfo);
    config.headers["adminToken"] = token;
  }
  // if (token) {
  //   config.headers["adminToken"] = token;
  // }
  return config;
  console.log("config", config);
});
