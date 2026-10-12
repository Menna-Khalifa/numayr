"use client";

import { ApiError, apiRequest } from "@/lib/api";
import { motion } from "framer-motion";
import { ArrowLeft, Phone, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const logoUrl =
  "https://res.cloudinary.com/deayevwds/image/upload/v1791205176/Numayr_Arch_and_Droplet_Logo_dt4yg5.png";

type ForgotResponse = {
  success: true;
  message: string;
  data?: {
    expires_in_minutes: number;

  };
};

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await apiRequest<ForgotResponse>(
        "/auth/password/forgot",
        {
          method: "POST",
          body: JSON.stringify({
            phone: phone.trim(),
          }),
        }
      );

      sessionStorage.setItem("numayr_reset_phone", phone.trim());

      router.push("/verify-otp");
    } catch (exception) {
      if (exception instanceof ApiError) {
        setError(exception.message);
      } else {
        setError("تعذر الاتصال بالخادم، حاول مرة أخرى");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#edf7fa] px-5 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(22,166,201,.12),transparent_30%),radial-gradient(circle_at_12%_90%,rgba(13,43,78,.05),transparent_32%),linear-gradient(145deg,#f6fbfc_0%,#edf7fa_55%,#e5f3f7_100%)]" />

      <motion.div
        className="pointer-events-none absolute -right-24 top-16 h-72 w-72 rounded-full bg-[#16a6c9]/10 blur-[90px]"
        animate={{
          x: [0, -25, 8, 0],
          y: [0, 18, 42, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[520px] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="w-full"
        >
          <div className="mb-7 flex flex-col items-center text-center">
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.85,
                y: 25,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              transition={{
                duration: 0.8,
              }}
              className="relative mb-5 flex h-[135px] w-[135px] items-center justify-center"
            >
              <div className="absolute h-[118px] w-[118px] rounded-full bg-white/85 shadow-[0_20px_55px_rgba(13,43,78,.09)]" />

              <motion.div
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 4.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative z-10 w-[90px]"
              >
                <Image
                  src={logoUrl}
                  alt="نمير"
                  width={220}
                  height={220}
                  priority
                  className="h-auto w-full object-contain"
                />
              </motion.div>
            </motion.div>

            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#16a6c9]/15 bg-white/70 px-3.5 py-2 text-xs font-bold text-[#1599b9]">
              <ShieldCheck className="h-4 w-4" />
              استعادة آمنة للحساب
            </span>

            <h1 className="text-[30px] font-extrabold tracking-[-0.04em] sm:text-[36px]">
              <span className="text-[#0d2b4e]">نسيت كلمة </span>
              <span className="text-[#16a6c9]">المرور؟</span>
            </h1>

            <p className="mt-3 max-w-md text-sm font-bold leading-7 text-[#718197]">
              اكتب رقم الجوال المسجل بحسابك وسنرسل لك رمز تحقق مكوّن من 4 أرقام.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-[32px] border border-white bg-white/82 p-5 shadow-[0_28px_80px_rgba(13,43,78,.09)] backdrop-blur-2xl sm:p-7"
          >
            <label
              htmlFor="phone"
              className="mb-2.5 block text-[13px] font-extrabold text-[#0d2b4e]"
            >
              رقم الجوال
            </label>

            <div className="group relative">
              <div className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl bg-[#f1f8fa]">
                <Phone className="h-[17px] w-[17px] text-[#8299aa] group-focus-within:text-[#16a6c9]" />
              </div>

              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="05xxxxxxxx"
                dir="ltr"
                className="h-[60px] w-full rounded-[18px] border border-[#dbe8ed] bg-white/90 pr-[60px] pl-4 text-left text-sm font-bold text-[#0d2b4e] outline-none transition-all placeholder:text-[#a9b9c4] focus:border-[#16a6c9] focus:shadow-[0_0_0_4px_rgba(22,166,201,.08)]"
              />
            </div>

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
              className="mt-5 flex h-[60px] w-full items-center justify-center gap-3 rounded-[18px] bg-[linear-gradient(110deg,#0d2b4e_0%,#123e68_55%,#0e5672_100%)] text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(13,43,78,.19)] disabled:opacity-60"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
              ) : (
                <>
                  <span>إرسال رمز التحقق</span>
                  <ArrowLeft className="h-[18px] w-[18px]" />
                </>
              )}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-[13px] font-bold text-[#718197]">
            تذكرت كلمة المرور؟{" "}
            <Link
              href="/login"
              className="font-extrabold text-[#16a6c9]"
            >
              تسجيل الدخول
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}