import { useEffect, useState, useCallback } from "react";
import {
  type AuthUser,
  getStoredAuth,
  saveAuth,
  clearAuth,
  loginAsStudent as loginStudentUtil,
  loginAsAdminBypass as loginAdminUtil,
  AUTH_CHANGE_EVENT,
} from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredAuth());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initial check on mount
    setUser(getStoredAuth());
    setIsReady(true);

    const handleAuthChange = (event: Event) => {
      const custom = event as CustomEvent<AuthUser | null>;
      setUser(custom.detail);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "akki_pw_auth_user") {
        setUser(getStoredAuth());
      }
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const loginStudent = useCallback((identifier: string, name?: string) => {
    const newUser = loginStudentUtil(identifier, name);
    setUser(newUser);
    return newUser;
  }, []);

  const loginAdminBypass = useCallback(() => {
    const newUser = loginAdminUtil();
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  return {
    user,
    isReady,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin" || user?.isBypass === true,
    isBypass: user?.isBypass === true,
    loginStudent,
    loginAdminBypass,
    logout,
  };
}
