import { configureStore } from "@reduxjs/toolkit";
import AuthSlice from "./Auth-Slice";

const store = configureStore({
  reducer: {
    auth: AuthSlice,
  },
});

export default store;
