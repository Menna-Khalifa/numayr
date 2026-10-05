"use client";

import { ApiError, apiRequest } from "@/lib/api";
import { motion } from "framer-motion";
import { ArrowLeft, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type VerifyResponse = {
  success: true;
  message: string;
  data: {
    reset_token: string;
    expires_in_minutes: number;
  };
};

export default function VerifyOtpPage() {
  const router = useRouter();
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    const storedPhone = sessionStorage.getItem("numayr_reset_phone");

    if (!storedPhone) {
      router.replace("/forgot-password");
      return;
    }

    const interval = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [router]);

  function getStoredPhone() {
    if (typeof window === "undefined") {
      return "";
    }

    return sessionStorage.getItem("numayr_reset_phone") ?? "";
  }

  function handleChange(
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const value = event.target.value.replace(/\D/g, "").slice(-1);

    setDigits((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });

    if (value && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>
  ) {
    if (
      event.key === "Backspace" &&
      !digits[index] &&
      index > 0
    ) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();

    const value = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 4);

    if (!value) {
      return;
    }

    const next = ["", "", "", ""];

    value.split("").forEach((digit, index) => {
      next[index] = digit;
    });

    setDigits(next);

    inputsRef.current[Math.min(value.length, 4) - 1]?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const phone = getStoredPhone();
    const otp = digits.join("");

    if (!phone) {
      router.replace("/forgot-password");
      return;
    }

    if (otp.length !== 4) {
      setError("أدخل رمز التحقق المكوّن من 4 أرقام");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await apiRequest<VerifyResponse>(
        "/auth/password/verify-otp",
        {
          method: "POST",
          body: JSON.stringify({
            phone,
            otp,
          }),
        }
      );

      sessionStorage.setItem(
        "numayr_reset_token",
        response.data.reset_token
      );

      router.push("/reset-password");
    } catch (exception) {
      if (exception instanceof ApiError) {
        setError(exception.message);
      } else {
        setError("تعذر التحقق من الرمز");
      }
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    const phone = getStoredPhone();

    if (seconds > 0 || !phone) {
      return;
    }

    setError("");

    try {
      await apiRequest("/auth/password/forgot", {
        method: "POST",
        body: JSON.stringify({
          phone,
        }),
      });

      setSeconds(60);
      setDigits(["", "", "", ""]);
      inputsRef.current[0]?.focus();
    } catch (exception) {
      if (exception instanceof ApiError) {
        setError(exception.message);
      }
    }
  }

  const displayPhone =
    typeof window !== "undefined" ? getStoredPhone() : "";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#edf7fa] px-5 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(22,166,201,.13),transparent_35%),linear-gradient(145deg,#f5fbfc,#edf7fa_55%,#e4f2f6)]" />

      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative z-10 w-full max-w-[510px]"
      >
        <div className="mb-7 text-center">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#0d2b4e] shadow-[0_18px_45px_rgba(13,43,78,.18)]"
          >
            <KeyRound className="h-8 w-8 text-[#62d8ef]" />
          </motion.div>

          <h1 className="text-[30px] font-extrabold tracking-[-0.04em]">
            <span className="text-[#0d2b4e]">أدخل رمز </span>
            <span className="text-[#16a6c9]">التحقق</span>
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-sm font-bold leading-7 text-[#718197]">
            أدخل الرمز المكوّن من 4 أرقام المرسل إلى رقم جوالك.
          </p>

          {displayPhone ? (
            <p
              dir="ltr"
              suppressHydrationWarning
              className="mt-2 text-sm font-extrabold text-[#0d2b4e]"
            >
              {displayPhone}
            </p>
          ) : null}
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[32px] border border-white bg-white/82 p-6 shadow-[0_28px_80px_rgba(13,43,78,.09)] backdrop-blur-2xl sm:p-8"
        >
          <div
            dir="ltr"
            className="flex items-center justify-center gap-3 sm:gap-4"
          >
            {digits.map((digit, index) => (
              <motion.input
                key={index}
                ref={(element) => {
                  inputsRef.current[index] = element;
                }}
                whileFocus={{
                  y: -3,
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(event) => handleChange(index, event)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                onPaste={handlePaste}
                className="h-[68px] w-[58px] rounded-[20px] border border-[#dbe8ed] bg-[#fbfdfe] text-center text-2xl font-extrabold text-[#0d2b4e] outline-none transition-all focus:border-[#16a6c9] focus:bg-white focus:shadow-[0_0_0_5px_rgba(22,166,201,.08)] sm:h-[76px] sm:w-[68px]"
              />
            ))}
          </div>

          {error ? (
            <div className="mt-5 rounded-[16px] border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-bold text-red-600">
              {error}
            </div>
          ) : null}

          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
            disabled={loading}
            type="submit"
            className="mt-6 flex h-[60px] w-full items-center justify-center gap-3 rounded-[18px] bg-[linear-gradient(110deg,#0d2b4e,#123e68_55%,#0e5672)] text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(13,43,78,.19)] disabled:opacity-60"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
            ) : (
              <>
                <span>تأكيد الرمز</span>
                <ArrowLeft className="h-[18px] w-[18px]" />
              </>
            )}
          </motion.button>

          <div className="mt-6 text-center text-[13px] font-bold text-[#718197]">
            {seconds > 0 ? (
              <span>
                يمكنك إعادة إرسال الرمز بعد{" "}
                <span className="font-extrabold text-[#0d2b4e]">
                  {seconds}
                </span>{" "}
                ثانية
              </span>
            ) : (
              <button
                type="button"
                onClick={resendOtp}
                className="font-extrabold text-[#16a6c9]"
              >
                إعادة إرسال رمز التحقق
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </main>
  );
}
