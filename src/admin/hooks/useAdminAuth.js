import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  adminLogout,
  adminSignIn,
  getAdminMe,
} from "../api/adminApi";
import { PLATFORM_SUPER_ROLE } from "../constants/auth";
import {
  clearStoredAdminAuth,
  getStoredAdminAuth,
  setStoredAdminAuth,
} from "../utils/adminAuthStorage";
import { login, logout, selectIsSuperAdmin } from "../../store/Auth-Slice";

const toSession = (authPayload, token) => ({
  token: token || authPayload.token,
  email: authPayload.email,
  name: authPayload.name,
  role: authPayload.role,
});

export const useAdminAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const isSuperAdmin = useSelector(selectIsSuperAdmin);

  const restoreSession = useCallback(async () => {
    const stored = getStoredAdminAuth();
    if (!stored?.token) return false;

    dispatch(login(toSession(stored, stored.token)));

    try {
      const me = await getAdminMe();
      const session = toSession(
        {
          email: me.email,
          name: me.name,
          role: me.role,
        },
        stored.token
      );
      setStoredAdminAuth(session);
      dispatch(login(session));
      return true;
    } catch {
      clearStoredAdminAuth();
      dispatch(logout());
      return false;
    }
  }, [dispatch]);

  const signIn = useCallback(
    async ({ email, password }) => {
      const response = await adminSignIn({ email, password });
      const session = toSession(
        {
          email: response.email,
          name: response.name,
          role: response.role,
        },
        response.access_token
      );

      setStoredAdminAuth(session);
      dispatch(login(session));
      return session;
    },
    [dispatch]
  );

  const signOut = useCallback(async () => {
    await adminLogout();
    clearStoredAdminAuth();
    dispatch(logout());
  }, [dispatch]);

  return {
    ...auth,
    isSuperAdmin,
    isPlatformSuper: auth.role === PLATFORM_SUPER_ROLE,
    restoreSession,
    signIn,
    signOut,
  };
};
