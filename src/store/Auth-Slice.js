import { createSlice } from "@reduxjs/toolkit";
import { isSuperAdminRole } from "../admin/constants/auth";

const initialState = {
  isAuth: false,
  token: "",
  email: "",
  name: "",
  role: "",
};

const AuthSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      state.isAuth = true;
      state.token = action.payload.token || "";
      state.email = action.payload.email || "";
      state.name = action.payload.name || "";
      state.role = action.payload.role || "";
    },
    logout: (state) => {
      state.isAuth = false;
      state.token = "";
      state.email = "";
      state.name = "";
      state.role = "";
    },
  },
});

export const { login, logout } = AuthSlice.actions;

export const selectIsSuperAdmin = (state) => isSuperAdminRole(state.auth.role);

export default AuthSlice.reducer;
