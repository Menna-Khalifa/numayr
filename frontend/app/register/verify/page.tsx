"use client";

import { ApiError, apiRequest } from "@/lib/api";
import { saveAuthToken } from "@/lib/auth";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, ShieldCheck, Smartphone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

type VerifyResponse = {
  success: true;
  message: string;
  data: {
    user: {
      id: number;
      role: string;
      is_active: boolean;
    };
    token: string;
  };
};

export default function RegistrationVerifyPage() {
  const router = useRouter();
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [seconds, setSeconds] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("numayr_registration_phone");

    if (!stored) {
      router.replace("/register");
      return;
    }

    setPhone(stored);
  }, [router]);

  useEffect(() => {
    if (seconds <= 0 || success) return;

    const timer = window.setTimeout(() => {
      setSeconds((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [seconds, success]);

  function updateDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);

    setDigits((current) => {
      const updated = [...current];
      updated[index] = digit;
      return updated;
    });

    if (digit && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();

    const value = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 4);

    if (!value) return;

    const updated = ["", "", "", ""];

    value.split("").forEach((digit, index) => {
      updated[index] = digit;
    });

    setDigits(updated);
    inputsRef.current[Math.min(value.length, 4) - 1]?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading || success) return;

    const otp = digits.join("");

    if (otp.length !== 4) {
      setError("أدخل رمز التحقق المكوّن من 4 أرقام");
      return;
    }

    if (!phone) {
      setError("رقم الجوال غير متوفر. يرجى إعادة التسجيل");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<VerifyResponse>(
        "/auth/register/verify-otp",
        {
          method: "POST",
          body: JSON.stringify({ phone, otp }),
        }
      );

      if (
        !response.data.token ||
        response.data.user.role !== "customer" ||
        !response.data.user.is_active
      ) {
        throw new Error("Unexpected verification response");
      }

      saveAuthToken(response.data.token);
      sessionStorage.removeItem("numayr_registration_phone");

      setSuccess(true);
      router.replace("/dashboard");
    } catch (exception) {
      setError(
        exception instanceof ApiError
          ? exception.message
          : "تعذر تأكيد الحساب، حاول مرة أخرى"
      );
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    if (!phone || seconds > 0 || resending || success) return;

    setResending(true);
    setError("");

    try {
      await apiRequest("/auth/register/resend-otp", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });

      setDigits(["", "", "", ""]);
      setSeconds(60);
      inputsRef.current[0]?.focus();
    } catch (exception) {
      setError(
        exception instanceof ApiError
          ? exception.message
          : "تعذر إعادة إرسال الرمز"
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#edf7fa] px-5 py-10"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(22,166,201,.14),transparent_38%),linear-gradient(145deg,#f5fbfc,#edf7fa_55%,#e5f3f7)]" />

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[510px]"
      >
        {success ? (
          <div className="rounded-[32px] border border-white bg-white/85 p-9 text-center shadow-[0_28px_80px_rgba(13,43,78,.09)]">
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
            <h1 className="mt-5 text-2xl font-extrabold text-[#0d2b4e]">
              تم تفعيل حسابك بنجاح
            </h1>
            <p className="mt-3 text-sm text-[#718197]">
              جاري تحويلك إلى لوحة التحكم
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#0d2b4e] shadow-[0_18px_45px_rgba(13,43,78,.18)]"
              >
                <Smartphone className="h-9 w-9 text-[#62d8ef]" />
              </motion.div>

              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#16a6c9]/15 bg-white/75 px-4 py-2 text-xs font-bold text-[#1599b9]">
                <ShieldCheck className="h-4 w-4" />
                تأكيد رقم الجوال
              </div>

              <h1 className="text-3xl font-extrabold text-[#0d2b4e]">
                تفعيل <span className="text-[#16a6c9]">حسابك</span>
              </h1>

              <p className="mt-4 text-sm font-bold leading-7 text-[#718197]">
                أدخل رمز التحقق المكوّن من 4 أرقام المرسل إلى جوالك
              </p>

              <p dir="ltr" className="mt-2 font-extrabold text-[#0d2b4e]">
                {phone}
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-[32px] border border-white bg-white/85 p-6 shadow-[0_28px_80px_rgba(13,43,78,.09)] backdrop-blur-2xl sm:p-8"
            >
              <div dir="ltr" className="flex justify-center gap-3 sm:gap-4">
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      inputsRef.current[index] = element;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    maxLength={1}
                    value={digit}
                    onChange={(event) =>
                      updateDigit(index, event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Backspace" &&
                        !digits[index] &&
                        index > 0
                      ) {
                        inputsRef.current[index - 1]?.focus();
                      }
                    }}
                    onPaste={handlePaste}
                    aria-label={`رقم ${index + 1} من رمز التحقق`}
                    className="h-[68px] w-[58px] rounded-[20px] border border-[#dbe8ed] bg-[#fbfdfe] text-center text-2xl font-extrabold text-[#0d2b4e] outline-none transition-all focus:border-[#16a6c9] focus:bg-white focus:shadow-[0_0_0_5px_rgba(22,166,201,.08)] sm:h-[76px] sm:w-[68px]"
                  />
                ))}
              </div>

              {error && (
                <div className="mt-5 rounded-[16px] border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-bold text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex h-[60px] w-full items-center justify-center gap-3 rounded-[18px] bg-[linear-gradient(110deg,#0d2b4e,#123e68_55%,#0e5672)] text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(13,43,78,.19)] disabled:opacity-60"
              >
                {loading ? "جاري التحقق..." : "تأكيد وتفعيل الحساب"}
                {!loading && <ArrowLeft className="h-5 w-5" />}
              </button>

              <div className="mt-6 text-center text-sm font-bold text-[#718197]">
                {seconds > 0 ? (
                  <span>
                    إعادة إرسال الرمز بعد{" "}
                    <span className="text-[#0d2b4e]">{seconds}</span> ثانية
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={resending}
                    className="font-extrabold text-[#16a6c9] disabled:opacity-50"
                  >
                    {resending ? "جاري الإرسال..." : "إعادة إرسال الرمز"}
                  </button>
                )}
              </div>
            </form>

            <p className="mt-6 text-center text-sm text-[#718197]">
              رقم جوال غير صحيح؟{" "}
              <Link href="/register" className="font-bold text-[#16a6c9]">
                العودة للتسجيل
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </main>
  );
}