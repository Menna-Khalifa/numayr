"use client";

import { ApiError, apiRequest } from "@/lib/api";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const resetToken = sessionStorage.getItem("numayr_reset_token");

    if (!resetToken) {
      router.replace("/forgot-password");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    const token = sessionStorage.getItem("numayr_reset_token");

    if (!token) {
      router.replace("/forgot-password");
      return;
    }

    if (password.length < 8) {
      setError("يجب أن تتكون كلمة المرور من 8 أحرف على الأقل");
      return;
    }

    if (password !== confirmation) {
      setError("تأكيد كلمة المرور غير مطابق");
      return;
    }

    setLoading(true);

    try {
      await apiRequest("/auth/password/reset", {
        method: "POST",
        body: JSON.stringify({
          reset_token: token,
          password,
          password_confirmation: confirmation,
        }),
      });

      sessionStorage.removeItem("numayr_reset_token");
      sessionStorage.removeItem("numayr_reset_phone");


      setSuccess(true);

      window.setTimeout(() => {
        router.replace("/login");
      }, 1800);
    } catch (exception) {
      if (exception instanceof ApiError) {
        setError(exception.message);
      } else {
        setError("تعذر تغيير كلمة المرور");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#edf7fa] px-5 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(22,166,201,.13),transparent_35%),linear-gradient(145deg,#f6fbfc,#edf7fa_55%,#e4f2f6)]" />

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[510px]"
      >
        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[34px] border border-white bg-white/85 p-8 text-center shadow-[0_28px_80px_rgba(13,43,78,.09)] backdrop-blur-2xl"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 170,
                damping: 15,
              }}
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#e7f8f0]"
            >
              <CheckCircle2 className="h-9 w-9 text-[#27ae60]" />
            </motion.div>

            <h1 className="mt-5 text-2xl font-extrabold text-[#0d2b4e]">
              تم تغيير كلمة المرور
            </h1>

            <p className="mt-3 text-sm font-bold text-[#718197]">
              سيتم نقلك إلى صفحة تسجيل الدخول.
            </p>
          </motion.div>
        ) : (
          <>
            <div className="mb-7 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#0d2b4e] shadow-[0_18px_45px_rgba(13,43,78,.18)]">
                <LockKeyhole className="h-8 w-8 text-[#62d8ef]" />
              </div>

              <h1 className="text-[30px] font-extrabold tracking-[-0.04em]">
                <span className="text-[#0d2b4e]">أنشئ كلمة مرور </span>
                <span className="text-[#16a6c9]">جديدة</span>
              </h1>

              <p className="mt-3 text-sm font-bold text-[#718197]">
                اختر كلمة مرور جديدة وآمنة لحسابك.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-[32px] border border-white bg-white/82 p-6 shadow-[0_28px_80px_rgba(13,43,78,.09)] backdrop-blur-2xl sm:p-8"
            >
              <PasswordInput
                label="كلمة المرور الجديدة"
                value={password}
                onChange={setPassword}
                show={showPassword}
                onToggle={() =>
                  setShowPassword((current) => !current)
                }
              />

              <div className="mt-5">
                <PasswordInput
                  label="تأكيد كلمة المرور"
                  value={confirmation}
                  onChange={setConfirmation}
                  show={showConfirmation}
                  onToggle={() =>
                    setShowConfirmation((current) => !current)
                  }
                />
              </div>

              <p className="mt-3 text-[11px] font-bold leading-5 text-[#8a9eae]">
                يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.
              </p>

              {error ? (
                <div className="mt-4 rounded-[16px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                  {error}
                </div>
              ) : null}

              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.985 }}
                type="submit"
                disabled={loading}
                className="mt-6 flex h-[60px] w-full items-center justify-center gap-3 rounded-[18px] bg-[linear-gradient(110deg,#0d2b4e,#123e68_55%,#0e5672)] text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(13,43,78,.19)] disabled:opacity-60"
              >
                {loading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                ) : (
                  <>
                    <span>حفظ كلمة المرور</span>
                    <ArrowLeft className="h-[18px] w-[18px]" />
                  </>
                )}
              </motion.button>
            </form>
          </>
        )}
      </motion.div>
    </main>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  show,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="mb-2.5 block text-[13px] font-extrabold text-[#0d2b4e]">
        {label}
      </label>

      <div className="group relative">
        <div className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl bg-[#f1f8fa]">
          <LockKeyhole className="h-[17px] w-[17px] text-[#8299aa]" />
        </div>

        <input
          type={show ? "text" : "password"}
          minLength={8}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="••••••••"
          className="h-[60px] w-full rounded-[18px] border border-[#dbe8ed] bg-white/90 pr-[60px] pl-14 text-sm font-bold text-[#0d2b4e] outline-none transition-all focus:border-[#16a6c9] focus:shadow-[0_0_0_4px_rgba(22,166,201,.08)]"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute left-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-[#8ca0b2]"
        >
          {show ? (
            <EyeOff className="h-[18px] w-[18px]" />
          ) : (
            <Eye className="h-[18px] w-[18px]" />
          )}
        </button>
      </div>
    </div>
  );
}
