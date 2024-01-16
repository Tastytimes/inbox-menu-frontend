import { axiosInstance } from "./baseUrl";

const apiCall = {
  login: async (reqBody) => {
    return axiosInstance.post("/user-management/login", reqBody);
  },
  register: async (reqBody) => {
    return axiosInstance.post("/user-management");
  },
};

export default apiCall;
