import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { setStudentAuth, useAuth } from "@/lib/auth";
import { ArrowLeft, Check, AlertCircle, BookOpen, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export const Route = createFileRoute("/login/")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Student Login — Akki Study" },
      {
        name: "description",
        content: "Sign in with your mobile number to access study batches, lectures, and notes.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const redirectTo = search.redirect || "/";
  const { isAuthenticated, isMounted } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1 = phone, 2 = otp, 3 = success
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const isLoggingInRef = useRef(false);

  // If already authenticated and visits /login, redirect right away
  useEffect(() => {
    if (isMounted && isAuthenticated && step !== 3) {
      navigate({ to: redirectTo as string });
    }
  }, [isMounted, isAuthenticated, navigate, redirectTo, step]);

  // Support smart ?api= parameter from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const apiParam = urlParams.get("api");
      if (apiParam) {
        localStorage.setItem("TOKENBASE_API_URL", apiParam.replace(/\/+$/, ""));
      }
    }
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const getBaseUrl = () => {
    if (typeof window === "undefined") return "";
    const stored = localStorage.getItem("TOKENBASE_API_URL");
    if (stored) return stored.replace(/\/+$/, "");
    return window.location.origin;
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = phoneNumber.trim().replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setOtpError("Please enter a valid 10-digit mobile number");
      return;
    }

    setOtpError("");
    setIsSendingOtp(true);

    try {
      const baseUrl = getBaseUrl();
      let res = await fetch(`${baseUrl}/api/get-otp?number=${cleanPhone}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      let data = await res.json().catch(() => ({}));

      // Resilient fallback: direct call to tokenbase if proxy failed
      if (!res.ok && !data.success) {
        try {
          const directRes = await fetch(
            `https://tokenbase.pimaxer.in/api/get-otp?number=${cleanPhone}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            },
          );
          const directData = await directRes.json().catch(() => ({}));
          if (directRes.ok && directData.success) {
            res = directRes;
            data = directData;
          }
        } catch {
          // ignore
        }
      }

      if (res.ok && (data.success || data.status === "success" || data.message)) {
        setStep(2);
        setResendTimer(30);
        setTimeout(() => {
          otpInputsRef.current[0]?.focus();
        }, 100);
      } else {
        let msg =
          data?.message ||
          data?.error?.error?.message ||
          data?.error?.message ||
          "Failed to send OTP. Please try again.";
        if (msg === "User does not exist") {
          msg = "This number is not registered. Please sign in or verify your mobile number.";
        }
        setOtpError(msg);
      }
    } catch {
      setOtpError("Network error. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // OTP Input handlers
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto advance
    if (digit && index < 3) {
      otpInputsRef.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== "")) {
      // Auto verify when all 4 digits filled
      executeLogin(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      executeLogin(otp.join(""));
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;

    const newOtp = ["", "", "", ""];
    pasted.split("").forEach((ch, i) => {
      newOtp[i] = ch;
    });
    setOtp(newOtp);

    const nextIndex = Math.min(pasted.length, 3);
    otpInputsRef.current[nextIndex]?.focus();

    if (pasted.length === 4) {
      executeLogin(pasted);
    }
  };

  // Step 2: Verify & Login
  const executeLogin = async (otpCode: string) => {
    if (otpCode.length !== 4) return;
    if (isLoggingInRef.current) return;
    isLoggingInRef.current = true;
    setLoginError("");
    setIsLoggingIn(true);

    try {
      const baseUrl = getBaseUrl();
      let res = await fetch(`${baseUrl}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: phoneNumber,
          otp: otpCode,
        }),
      });
      let data = await res.json().catch(() => ({}));

      // Resilient fallback: direct call to tokenbase if proxy failed
      if (!res.ok && !data.success && !data.token) {
        try {
          const directRes = await fetch("https://tokenbase.pimaxer.in/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: phoneNumber,
              otp: otpCode,
            }),
          });
          const directData = await directRes.json().catch(() => ({}));
          if (directRes.ok && (directData.success || directData.token)) {
            res = directRes;
            data = directData;
          }
        } catch {
          // ignore
        }
      }

      const isSuccess =
        (res.ok && data.success !== false) ||
        data.success === true ||
        data.status === "success" ||
        data.status === true ||
        Boolean(data.token) ||
        Boolean(data.jwt) ||
        Boolean(data.accessToken) ||
        Boolean(data.access_token) ||
        Boolean(data.data?.token) ||
        Boolean(data.user) ||
        Boolean(data.data?.user);

      if (isSuccess) {
        const token =
          data.token ||
          data.jwt ||
          data.accessToken ||
          data.access_token ||
          data.data?.token ||
          `student_${Date.now()}`;

        setStudentAuth(phoneNumber, token, data);
        setStep(3);
        setTimeout(() => {
          navigate({ to: redirectTo as string });
        }, 800);
      } else {
        const msg =
          data?.message ||
          data?.error?.error?.message ||
          data?.error?.message ||
          data?.pw_response?.message ||
          "Invalid OTP. Please try again.";
        setLoginError(msg);
        setOtp(["", "", "", ""]);
        setTimeout(() => {
          otpInputsRef.current[0]?.focus();
        }, 50);
      }
    } catch {
      setLoginError("Network error. Please try again.");
      setOtp(["", "", "", ""]);
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 50);
    } finally {
      setIsLoggingIn(false);
      isLoggingInRef.current = false;
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoginError("");
    setOtp(["", "", "", ""]);
    otpInputsRef.current[0]?.focus();

    try {
      const baseUrl = getBaseUrl();
      await fetch(`${baseUrl}/api/get-otp?number=${phoneNumber}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      setResendTimer(30);
    } catch {
      setResendTimer(30);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors">
      {/* Top Bar with Home Link & Theme Toggle */}
      <div className="absolute top-4 left-4 right-4 max-w-sm mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </Link>

        <button
          type="button"
          onClick={toggleTheme}
          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-2xs"
          title={isDark ? "Light mode" : "Dark mode"}
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-slate-600" />
          )}
        </button>
      </div>

      <div className="w-full max-w-sm mt-8">
        {/* Logo / Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 mb-3 shadow-lg shadow-indigo-500/25 text-white">
            <BookOpen className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Welcome back
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Sign in to continue learning
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              step === 1 ? "bg-indigo-600 w-4" : "bg-indigo-400 dark:bg-indigo-500"
            }`}
          />
          <div
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              step >= 2 ? "bg-indigo-600 w-4" : "bg-slate-200 dark:bg-slate-800"
            }`}
          />
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 p-6 transition-all">
          {/* STEP 1: Phone Input */}
          {step === 1 && (
            <div className="animate-in fade-in duration-200">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-0.5">
                Enter your phone number
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">
                We'll send an OTP to verify it's you
              </p>

              <form onSubmit={handleSendOtp}>
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Mobile Number
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm font-semibold select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                      placeholder="9876543210"
                      autoFocus
                      className="flex-1 px-3.5 py-2.5 border border-slate-200 dark:border-slate-750 rounded-r-xl text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15 bg-white dark:bg-slate-850 transition"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 ml-0.5">
                    Use your PhysicsWallah registered mobile number
                  </p>
                </div>

                {otpError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/60">
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{otpError}</span>
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSendingOtp || phoneNumber.length !== 10}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  {isSendingOtp ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <span>Send OTP</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 2 && (
            <div className="animate-in fade-in duration-200">
              <div className="flex items-center gap-2 mb-5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer"
                  title="Change phone number"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                    Enter OTP
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Sent to +91{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {phoneNumber}
                    </span>
                  </p>
                </div>
              </div>

              {/* 4 Digit OTP Boxes */}
              <div className="flex justify-center gap-2.5 mb-5" onPaste={handleOtpPaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputsRef.current[index] = el)}
                    type="tel"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-13 h-13 sm:w-14 sm:h-14 border border-slate-200 dark:border-slate-750 rounded-xl text-center text-xl font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-850 focus:border-indigo-500 focus:outline-none focus:ring-3 focus:ring-indigo-500/15 transition"
                  />
                ))}
              </div>

              {loginError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/60">
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{loginError}</span>
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => executeLogin(otp.join(""))}
                disabled={isLoggingIn || otp.some((d) => d === "")}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition cursor-pointer"
              >
                {isLoggingIn ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify & Sign In</span>
                )}
              </button>

              <div className="text-center mt-4">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Didn't receive it?
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0}
                    className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline ml-1 disabled:opacity-40 disabled:no-underline cursor-pointer"
                  >
                    Resend
                  </button>
                  {resendTimer > 0 && (
                    <span className="text-slate-400 ml-1 text-xs">({resendTimer}s)</span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Success State */}
          {step === 3 && (
            <div className="text-center py-4 animate-in fade-in duration-200">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mb-4">
                <Check className="w-7 h-7 stroke-3" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                You're in! 🎉
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Login successful. Redirecting you to your batch...
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-6">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
