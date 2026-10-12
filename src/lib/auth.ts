import { useState, useEffect, useCallback } from "react";

const AUTH_KEY = "akki_student_auth_cache_v2";
const BYPASS_KEY = "akki_admin_bypass_cache_v2";
const LEGACY_AUTH_KEY = "akki_student_auth_v1";
const LEGACY_BYPASS_KEY = "akki_admin_bypass_v1";
const EVENT_AUTH_CHANGED = "akki-auth-changed";

const COOKIE_AUTH = "akki_auth_session";
const COOKIE_BYPASS = "akki_bypass_session";

export type AuthUser = {
  phone: string;
  token?: string;
  role?: string;
  name?: string;
  cachedAt?: number;
};

export type AuthState = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isAdmin: boolean;
};

// 1 Year Cache Helper
function setCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1); // 1 year persistent session cache
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const matches = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)"),
  );
  return matches ? decodeURIComponent(matches[1]) : null;
}

function removeCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export function getStoredAuthState(): AuthState {
  if (typeof window === "undefined") {
    return { isAuthenticated: false, user: null, isAdmin: false };
  }

  try {
    // 1. Check Admin Bypass in localStorage, sessionStorage, or Cookie
    const isBypass =
      localStorage.getItem(BYPASS_KEY) === "true" ||
      localStorage.getItem(LEGACY_BYPASS_KEY) === "true" ||
      sessionStorage.getItem(BYPASS_KEY) === "true" ||
      getCookie(COOKIE_BYPASS) === "true";

    if (isBypass) {
      return {
        isAuthenticated: true,
        isAdmin: true,
        user: { phone: "Admin", role: "admin", name: "Administrator" },
      };
    }

    // 2. Check Student Auth in localStorage, sessionStorage, or Cookie
    const raw =
      localStorage.getItem(AUTH_KEY) ||
      localStorage.getItem(LEGACY_AUTH_KEY) ||
      sessionStorage.getItem(AUTH_KEY) ||
      getCookie(COOKIE_AUTH);

    if (raw) {
      const parsed = typeof raw === "string" && raw.startsWith("{") ? JSON.parse(raw) : null;
      if (parsed && (parsed.phone || parsed.token || parsed.isAuthenticated)) {
        return {
          isAuthenticated: true,
          isAdmin: false,
          user: parsed,
        };
      }
    }
  } catch (e) {
    console.error("Auth state read error:", e);
  }

  return { isAuthenticated: false, user: null, isAdmin: false };
}

export function setStudentAuth(phone: string, token?: string, extra?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const data: AuthUser = {
    phone,
    token: token || `student_${Date.now()}`,
    role: "student",
    cachedAt: Date.now(),
    ...extra,
  };

  const serialized = JSON.stringify(data);

  // Cache in multiple persistent stores so session doesn't expire or get lost
  try {
    localStorage.setItem(AUTH_KEY, serialized);
    sessionStorage.setItem(AUTH_KEY, serialized);
    localStorage.removeItem(BYPASS_KEY);
    sessionStorage.removeItem(BYPASS_KEY);
  } catch (e) {
    console.warn("Storage write error:", e);
  }

  setCookie(COOKIE_AUTH, serialized);
  removeCookie(COOKIE_BYPASS);

  window.dispatchEvent(new Event(EVENT_AUTH_CHANGED));
}

export function setAdminBypassAuth() {
  if (typeof window === "undefined") return;

  // Cache bypass flag in localStorage, sessionStorage and 1-year Cookie
  try {
    localStorage.setItem(BYPASS_KEY, "true");
    sessionStorage.setItem(BYPASS_KEY, "true");
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_KEY);
  } catch (e) {
    console.warn("Storage write error:", e);
  }

  setCookie(COOKIE_BYPASS, "true");
  removeCookie(COOKIE_AUTH);

  window.dispatchEvent(new Event(EVENT_AUTH_CHANGED));
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(BYPASS_KEY);
    localStorage.removeItem(LEGACY_AUTH_KEY);
    localStorage.removeItem(LEGACY_BYPASS_KEY);
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(BYPASS_KEY);
  } catch (e) {
    console.warn("Storage clear error:", e);
  }

  removeCookie(COOKIE_AUTH);
  removeCookie(COOKIE_BYPASS);

  window.dispatchEvent(new Event(EVENT_AUTH_CHANGED));
}

export function checkIsAuthenticated(): boolean {
  return getStoredAuthState().isAuthenticated;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(getStoredAuthState);

  useEffect(() => {
    const sync = () => {
      setAuthState(getStoredAuthState());
    };

    window.addEventListener(EVENT_AUTH_CHANGED, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(EVENT_AUTH_CHANGED, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const loginStudent = useCallback(
    (phone: string, token?: string, extra?: Record<string, unknown>) => {
      setStudentAuth(phone, token, extra);
    },
    [],
  );

  const loginAdminBypass = useCallback(() => {
    setAdminBypassAuth();
  }, []);

  const logout = useCallback(() => {
    clearAuth();
  }, []);

  return {
    ...authState,
    loginStudent,
    loginAdminBypass,
    logout,
  };
}
