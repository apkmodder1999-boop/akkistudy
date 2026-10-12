import { useState, useEffect, useCallback } from "react";

const COOKIE_SESSION = "akki_session";
const COOKIE_BYPASS = "akki_bypass";
const COOKIE_LOGGED_IN = "akki_logged_in";
const COOKIE_TOKEN = "akki_token";
const COOKIE_PHONE = "akki_phone";

const STORAGE_SESSION = "akki_session";
const STORAGE_BYPASS = "akki_bypass";
const STORAGE_USER = "akki_student_auth_cache_v2";

const EVENT_AUTH_CHANGED = "akki-auth-changed";

export type AuthUser = {
  phone: string;
  token?: string;
  role?: string;
  name?: string;
};

export type AuthState = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isAdmin: boolean;
  isMounted: boolean;
};

export const DEFAULT_AUTH_STATE: AuthState = {
  isAuthenticated: false,
  user: null,
  isAdmin: false,
  isMounted: false,
};

// Helper to write long-lived cookies (10 years)
function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  const maxAge = 315360000; // 10 years
  const expires = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toUTCString();

  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; expires=${expires}; SameSite=Lax`;
    if (typeof location !== "undefined" && location.protocol === "https:") {
      document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; expires=${expires}; SameSite=None; Secure`;
    }
  } catch (_e) {
    void _e;
  }
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    if (typeof location !== "undefined" && location.protocol === "https:") {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure`;
    }
  } catch (_e) {
    void _e;
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const matches = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)"),
  );
  return matches ? decodeURIComponent(matches[1]) : null;
}

export function checkIsAuthenticated(): boolean {
  if (typeof window === "undefined") return false;

  try {
    // 1. Check cookies
    const cookieStr = typeof document !== "undefined" ? document.cookie : "";
    if (
      cookieStr.includes(`${COOKIE_SESSION}=authenticated`) ||
      cookieStr.includes(`${COOKIE_BYPASS}=true`) ||
      cookieStr.includes(`${COOKIE_LOGGED_IN}=true`) ||
      cookieStr.includes("akki_auth_session") ||
      cookieStr.includes("akki_bypass_session")
    ) {
      return true;
    }

    // 2. Check localStorage / sessionStorage
    if (
      localStorage.getItem(STORAGE_SESSION) === "authenticated" ||
      localStorage.getItem(STORAGE_BYPASS) === "true" ||
      localStorage.getItem("akki_admin_bypass_cache_v2") === "true" ||
      localStorage.getItem("akki_admin_bypass_v1") === "true" ||
      Boolean(localStorage.getItem(STORAGE_USER)) ||
      Boolean(localStorage.getItem("akki_student_auth_v1"))
    ) {
      return true;
    }
  } catch (_e) {
    void _e;
  }

  return false;
}

export function getStoredAuthState(): Omit<AuthState, "isMounted"> {
  if (typeof window === "undefined") {
    return { isAuthenticated: false, user: null, isAdmin: false };
  }

  try {
    const cookieStr = typeof document !== "undefined" ? document.cookie : "";

    // 1. Check Admin Bypass
    const isBypass =
      cookieStr.includes(`${COOKIE_BYPASS}=true`) ||
      cookieStr.includes("akki_bypass_session") ||
      localStorage.getItem(STORAGE_BYPASS) === "true" ||
      localStorage.getItem("akki_admin_bypass_cache_v2") === "true" ||
      localStorage.getItem("akki_admin_bypass_v1") === "true";

    if (isBypass) {
      return {
        isAuthenticated: true,
        isAdmin: true,
        user: { phone: "Admin", role: "admin", name: "Administrator" },
      };
    }

    // 2. Check Student Session
    if (checkIsAuthenticated()) {
      let userData: AuthUser = { phone: "Student", role: "student" };
      try {
        const raw =
          localStorage.getItem(STORAGE_USER) || localStorage.getItem("akki_student_auth_v1");
        if (raw && raw.startsWith("{")) {
          userData = JSON.parse(raw);
        } else {
          const cookiePhone = readCookie(COOKIE_PHONE);
          if (cookiePhone) userData.phone = cookiePhone;
        }
      } catch (_e) {
        void _e;
      }

      return {
        isAuthenticated: true,
        isAdmin: false,
        user: userData,
      };
    }
  } catch (e) {
    console.error("Auth state read error:", e);
  }

  return { isAuthenticated: false, user: null, isAdmin: false };
}

export function setStudentAuth(phone: string, token?: string, extra?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  const userToken = token || `student_${Date.now()}`;
  const data: AuthUser = {
    phone,
    token: userToken,
    role: "student",
    ...extra,
  };

  const serialized = JSON.stringify(data);

  // 1. Write long-lived browser cookies (10 years)
  writeCookie(COOKIE_SESSION, "authenticated");
  writeCookie(COOKIE_LOGGED_IN, "true");
  writeCookie(COOKIE_PHONE, phone);
  writeCookie(COOKIE_TOKEN, userToken);
  clearCookie(COOKIE_BYPASS);

  // 2. Write localStorage & sessionStorage
  try {
    localStorage.setItem(STORAGE_SESSION, "authenticated");
    localStorage.setItem(STORAGE_USER, serialized);
    localStorage.removeItem(STORAGE_BYPASS);
    sessionStorage.setItem(STORAGE_SESSION, "authenticated");
    sessionStorage.setItem(STORAGE_USER, serialized);
    sessionStorage.removeItem(STORAGE_BYPASS);
  } catch (_e) {
    void _e;
  }

  window.dispatchEvent(new Event(EVENT_AUTH_CHANGED));
}

export function setAdminBypassAuth() {
  if (typeof window === "undefined") return;

  // 1. Write cookies
  writeCookie(COOKIE_SESSION, "authenticated");
  writeCookie(COOKIE_BYPASS, "true");
  writeCookie(COOKIE_LOGGED_IN, "true");

  // 2. Write storage
  try {
    localStorage.setItem(STORAGE_SESSION, "authenticated");
    localStorage.setItem(STORAGE_BYPASS, "true");
    sessionStorage.setItem(STORAGE_SESSION, "authenticated");
    sessionStorage.setItem(STORAGE_BYPASS, "true");
  } catch (_e) {
    void _e;
  }

  window.dispatchEvent(new Event(EVENT_AUTH_CHANGED));
}

export function clearAuth() {
  if (typeof window === "undefined") return;

  // Clear all cookies
  clearCookie(COOKIE_SESSION);
  clearCookie(COOKIE_BYPASS);
  clearCookie(COOKIE_LOGGED_IN);
  clearCookie(COOKIE_TOKEN);
  clearCookie(COOKIE_PHONE);
  clearCookie("akki_auth_session");
  clearCookie("akki_bypass_session");

  // Clear storage
  try {
    localStorage.removeItem(STORAGE_SESSION);
    localStorage.removeItem(STORAGE_BYPASS);
    localStorage.removeItem(STORAGE_USER);
    localStorage.removeItem("akki_student_auth_cache_v2");
    localStorage.removeItem("akki_admin_bypass_cache_v2");
    localStorage.removeItem("akki_student_auth_v1");
    localStorage.removeItem("akki_admin_bypass_v1");
    sessionStorage.clear();
  } catch (_e) {
    void _e;
  }

  window.dispatchEvent(new Event(EVENT_AUTH_CHANGED));
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(DEFAULT_AUTH_STATE);

  useEffect(() => {
    // Sync immediately on client mount
    setAuthState({ ...getStoredAuthState(), isMounted: true });

    const sync = () => {
      setAuthState({ ...getStoredAuthState(), isMounted: true });
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
