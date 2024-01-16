import { createSlice } from "@reduxjs/toolkit";

const intialState = {
  isAuth: false,
  role: "admin",
  email: "",
};

const AuthSlice = createSlice({
  name: "auth",
  initialState: intialState,
  reducers: {
    login: (state, action) => {
      console.log(action.payload);
      state.isAuth = true;
      state.email = action.payload.email;
      state.role = action.payload.role;
    },
    resetPassword: (state, action) => {
      state.email = action.payload.email;
    },
    logout: (state) => {
      state.isAuth = false;
      state.email = "";
      state.role = "";
    },
  },
});

export const { login, logout, resetPassword } = AuthSlice.actions;

export default AuthSlice.reducer;
