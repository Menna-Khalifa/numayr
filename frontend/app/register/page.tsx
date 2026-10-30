"use client";

import { ApiError, apiRequest } from "@/lib/api";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const logoUrl =
  "https://res.cloudinary.com/deayevwds/image/upload/v1791205176/Numayr_Arch_and_Droplet_Logo_dt4yg5.png";

type RegisterResponse = {
  success: true;
  message: string;
  data: {
    phone: string;
    requires_phone_verification: boolean;
    expires_in_minutes: number;
  };
};

const particles = [
  { left: "11%", top: "16%", size: 5, delay: 0.3, duration: 6.7 },
  { left: "19%", top: "78%", size: 7, delay: 1.2, duration: 7.4 },
  { left: "83%", top: "17%", size: 4, delay: 0.7, duration: 5.9 },
  { left: "88%", top: "67%", size: 6, delay: 1.5, duration: 6.6 },
  { left: "69%", top: "85%", size: 4, delay: 0.95, duration: 7.2 },
  { left: "14%", top: "49%", size: 3, delay: 2.1, duration: 5.8 },
];

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] =
    useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (password !== passwordConfirmation) {
      setError("تأكيد كلمة المرور غير مطابق");
      return;
    }

    setLoading(true);

    try {
      const response = await apiRequest<RegisterResponse>(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim() || undefined,
            phone: phone.trim(),
            password,
            password_confirmation: passwordConfirmation,
          }),
        }
      );

      if (!response.data.requires_phone_verification) {
        throw new Error("Unexpected registration response");
      }

      sessionStorage.setItem(
        "numayr_registration_phone",
        response.data.phone
      );

      router.push("/register/verify");
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
    <main className="min-h-screen overflow-hidden bg-[#edf7fa]">
      <div className="grid min-h-screen lg:grid-cols-[1.02fr_.98fr]">
        <section className="relative order-2 flex min-h-screen items-center justify-center overflow-hidden px-5 py-8 sm:px-8 lg:order-1 lg:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_12%,rgba(22,166,201,.12),transparent_28%),radial-gradient(circle_at_10%_90%,rgba(13,43,78,.05),transparent_32%),linear-gradient(145deg,#f5fbfc_0%,#edf7fa_55%,#e5f3f7_100%)]" />

          <motion.div
            className="pointer-events-none absolute -right-32 top-16 h-80 w-80 rounded-full bg-[#16a6c9]/10 blur-[90px]"
            animate={{
              x: [0, -28, 8, 0],
              y: [0, 18, 45, 0],
              scale: [1, 1.07, 0.96, 1],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.div
            className="pointer-events-none absolute -bottom-28 -left-24 h-96 w-96 rounded-full bg-[#0d2b4e]/5 blur-[100px]"
            animate={{
              x: [0, 30, -10, 0],
              y: [0, -20, -40, 0],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.div
            initial={{
              opacity: 0,
              y: 24,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative z-10 w-full max-w-[510px]"
          >
            <div className="mb-7 flex flex-col items-center text-center lg:hidden">
              <motion.div
                initial={{
                  opacity: 0,
                  y: 35,
                  scale: 0.82,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                transition={{
                  duration: 0.85,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative mb-5 flex h-[142px] w-[142px] items-center justify-center"
              >
                <motion.div
                  className="absolute h-[142px] w-[142px] rounded-full border border-[#16a6c9]/15"
                  animate={{
                    scale: [0.92, 1.08, 0.92],
                    opacity: [0.3, 0.7, 0.3],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                <div className="absolute h-[118px] w-[118px] rounded-full bg-white/85 shadow-[0_20px_55px_rgba(13,43,78,.09)]" />

                <motion.div
                  animate={{
                    y: [0, -5, 0],
                  }}
                  transition={{
                    duration: 4.3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative z-10 w-[92px]"
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

              <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.035em]">
                <span className="text-[#0d2b4e]">ابدأ رحلتك </span>
                <span className="text-[#16a6c9]">مع نمير</span>
              </h1>

              <p className="mt-2 max-w-xs text-[13px] font-bold leading-6 text-[#718197]">
                حساب واحد يجمع خدمات برادتك كلها.
              </p>
            </div>

            <div className="mb-8 hidden lg:block">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#16a6c9]/15 bg-white/70 px-3.5 py-2 text-xs font-bold text-[#1599b9] shadow-sm backdrop-blur-xl">
                <ShieldCheck className="h-4 w-4" />
                إنشاء حساب جديد
              </span>

              <h1 className="text-[38px] font-extrabold tracking-[-0.045em]">
                <span className="text-[#0d2b4e]">ابدأ رحلتك </span>
                <span className="bg-gradient-to-l from-[#16a6c9] to-[#087fa4] bg-clip-text text-transparent">
                  مع نمير
                </span>
              </h1>

              <p className="mt-3 text-sm font-bold leading-7 text-[#718197]">
                أنشئ حسابك وابدأ إدارة خدمات برادتك بسهولة.
              </p>
            </div>

            <motion.form
              onSubmit={handleSubmit}
              initial={{
                opacity: 0,
                y: 25,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              transition={{
                delay: 0.22,
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative overflow-hidden rounded-[32px] border border-white bg-white/80 p-5 shadow-[0_28px_80px_rgba(13,43,78,.09)] backdrop-blur-2xl sm:p-7"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#16a6c9]/8 blur-[45px]" />

              <div className="relative z-10 space-y-4">
                <Field
                  label="الاسم"
                  icon={<UserRound className="h-[17px] w-[17px]" />}
                >
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="الاسم الكامل"
                    className="h-[58px] w-full rounded-[18px] border border-[#dbe8ed] bg-white/90 pr-[60px] pl-4 text-sm font-bold text-[#0d2b4e] outline-none transition-all placeholder:font-normal placeholder:text-[#a9b9c4] hover:border-[#c8dde5] focus:border-[#16a6c9] focus:shadow-[0_0_0_4px_rgba(22,166,201,.08)]"
                  />
                </Field>

                <Field
                  label="البريد الإلكتروني"
                  icon={<Mail className="h-[17px] w-[17px]" />}
                >
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    dir="ltr"
                    className="h-[58px] w-full rounded-[18px] border border-[#dbe8ed] bg-white/90 pr-[60px] pl-4 text-left text-sm font-bold text-[#0d2b4e] outline-none transition-all placeholder:font-normal placeholder:text-[#a9b9c4] hover:border-[#c8dde5] focus:border-[#16a6c9] focus:shadow-[0_0_0_4px_rgba(22,166,201,.08)]"
                  />
                </Field>

                <Field
                  label="رقم الجوال"
                  icon={<Phone className="h-[17px] w-[17px]" />}
                >
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                    className="h-[58px] w-full rounded-[18px] border border-[#dbe8ed] bg-white/90 pr-[60px] pl-4 text-left text-sm font-bold text-[#0d2b4e] outline-none transition-all placeholder:font-normal placeholder:text-[#a9b9c4] hover:border-[#c8dde5] focus:border-[#16a6c9] focus:shadow-[0_0_0_4px_rgba(22,166,201,.08)]"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <PasswordField
                    label="كلمة المرور"
                    value={password}
                    onChange={setPassword}
                    show={showPassword}
                    onToggle={() => setShowPassword((current) => !current)}
                    autoComplete="new-password"
                  />

                  <PasswordField
                    label="تأكيد كلمة المرور"
                    value={passwordConfirmation}
                    onChange={setPasswordConfirmation}
                    show={showPasswordConfirmation}
                    onToggle={() =>
                      setShowPasswordConfirmation((current) => !current)
                    }
                    autoComplete="new-password"
                  />
                </div>

                <p className="text-[11px] font-bold leading-5 text-[#8a9eae]">
                  يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.
                </p>

                {error ? (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: -6,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    className="rounded-[16px] border border-red-100 bg-red-50/90 px-4 py-3 text-sm font-bold text-red-600"
                  >
                    {error}
                  </motion.div>
                ) : null}

                <motion.button
                  whileHover={{
                    y: -2,
                    boxShadow: "0 18px 36px rgba(13,43,78,.24)",
                  }}
                  whileTap={{
                    scale: 0.985,
                  }}
                  type="submit"
                  disabled={loading}
                  className="group relative flex h-[60px] w-full items-center justify-center gap-3 overflow-hidden rounded-[18px] bg-[linear-gradient(110deg,#0d2b4e_0%,#123e68_55%,#0e5672_100%)] px-5 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(13,43,78,.19)] transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(60,211,241,.22),transparent_38%)]" />

                  <motion.span
                    className="pointer-events-none absolute inset-y-0 w-20 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/15 to-transparent"
                    animate={{
                      right: ["-35%", "125%"],
                    }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      repeatDelay: 3,
                      ease: "easeInOut",
                    }}
                  />

                  {loading ? (
                    <span className="relative z-10 h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                  ) : (
                    <>
                      <span className="relative z-10">إنشاء الحساب</span>
                      <ArrowLeft className="relative z-10 h-[18px] w-[18px] transition-transform group-hover:-translate-x-1" />
                    </>
                  )}
                </motion.button>
              </div>
            </motion.form>

            <p className="mt-6 text-center text-[13px] font-bold text-[#718197]">
              لديك حساب بالفعل؟{" "}
              <Link
                href="/login"
                className="font-extrabold text-[#16a6c9] transition-colors hover:text-[#0d2b4e]"
              >
                تسجيل الدخول
              </Link>
            </p>
          </motion.div>
        </section>

        <section className="relative order-1 hidden min-h-screen overflow-hidden lg:flex lg:items-center lg:justify-center">
          <div className="absolute inset-0 bg-[linear-gradient(150deg,#123a65_0%,#0d2b4e_47%,#071a31_100%)]" />

          <motion.div
            className="pointer-events-none absolute left-[12%] top-[7%] h-[520px] w-[520px] rounded-full bg-[#16a6c9]/15 blur-[120px]"
            animate={{
              x: [0, 45, 4, 0],
              y: [0, 28, 65, 0],
              scale: [1, 1.08, 0.95, 1],
              opacity: [0.5, 0.8, 0.55, 0.5],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.div
            className="pointer-events-none absolute -bottom-[20%] -right-[15%] h-[650px] w-[650px] rounded-full bg-[#2bc5e7]/10 blur-[130px]"
            animate={{
              x: [0, -55, -20, 0],
              y: [0, -40, 10, 0],
              scale: [0.92, 1.12, 0.98, 0.92],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {[0, 1, 2].map((ring) => (
            <motion.div
              key={ring}
              className="pointer-events-none absolute left-1/2 top-[48%] h-[230px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-[#6bdff5]/20"
              style={{
                rotateX: 72,
              }}
              initial={{
                scale: 0.62,
                opacity: 0,
              }}
              animate={{
                scale: [0.62, 1, 1.65],
                opacity: [0, 0.4, 0],
              }}
              transition={{
                delay: ring * 1.5,
                duration: 5,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}

          {particles.map((particle, index) => (
            <motion.span
              key={index}
              className="pointer-events-none absolute rounded-full bg-[#63def5]"
              style={{
                left: particle.left,
                top: particle.top,
                width: particle.size,
                height: particle.size,
                boxShadow: "0 0 20px rgba(99,222,245,.55)",
              }}
              animate={{
                y: [12, -16, -44],
                x: [0, 5, -4],
                opacity: [0, 0.7, 0],
                scale: [0.6, 1, 0.6],
              }}
              transition={{
                delay: particle.delay,
                duration: particle.duration,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_45%,rgba(3,13,28,.4)_100%)]" />

          <div className="relative z-10 flex w-full max-w-xl flex-col items-center px-10 text-center">
            <motion.div
              initial={{
                opacity: 0,
                y: 80,
                scale: 0.75,
                filter: "blur(8px)",
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                filter: "blur(0px)",
              }}
              transition={{
                duration: 1.15,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative flex h-[250px] w-[250px] items-center justify-center"
            >
              <motion.div
                className="absolute h-[245px] w-[245px] rounded-full bg-[#d9f3f8]/90 shadow-[0_35px_95px_rgba(0,0,0,.28),0_0_70px_rgba(64,207,235,.20)]"
                animate={{
                  scale: [0.97, 1.025, 0.97],
                }}
                transition={{
                  duration: 4.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <motion.div
                animate={{
                  y: [0, -8, 0],
                }}
                transition={{
                  delay: 1.15,
                  duration: 5.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative z-10 w-[185px]"
              >
                <Image
                  src={logoUrl}
                  alt="نمير"
                  width={500}
                  height={500}
                  priority
                  className="h-auto w-full object-contain"
                />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{
                opacity: 0,
                y: 24,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.75,
                duration: 0.85,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div className="mt-7 flex items-center justify-center gap-2 text-xs font-bold text-[#70dff5]">
                <Sparkles className="h-4 w-4" />
                <span>ابدأ بخطوة بسيطة</span>
              </div>

              <h2 className="mt-4 text-[38px] font-extrabold leading-tight tracking-[-0.045em]">
                <span className="text-white">خدماتك </span>

                <span className="bg-gradient-to-l from-[#63dff6] via-[#27bfdf] to-[#9becfb] bg-clip-text text-transparent">
                  أقرب وأسهل
                </span>
              </h2>

              <p className="mx-auto mt-4 max-w-sm text-sm font-bold leading-7 text-[#bed8e5]/80">
                أنشئ حسابك وابدأ استخدام خدمات نمير ومتابعة براداتك وطلباتك من مكان واحد.
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-[13px] font-extrabold text-[#0d2b4e]">
        {label}
      </label>

      <div className="group relative">
        <div className="pointer-events-none absolute right-4 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl bg-[#f1f8fa] text-[#8299aa] transition-colors group-focus-within:bg-[#e2f6fb] group-focus-within:text-[#16a6c9]">
          {icon}
        </div>

        {children}
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-[13px] font-extrabold text-[#0d2b4e]">
        {label}
      </label>

      <div className="group relative">
        <div className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl bg-[#f1f8fa]">
          <LockKeyhole className="h-4 w-4 text-[#8299aa] transition-colors group-focus-within:text-[#16a6c9]" />
        </div>

        <input
          type={show ? "text" : "password"}
          required
          minLength={8}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="••••••••"
          className="h-[58px] w-full rounded-[18px] border border-[#dbe8ed] bg-white/90 pr-13 pl-12 text-sm font-bold text-[#0d2b4e] outline-none transition-all placeholder:text-[#a9b9c4] hover:border-[#c8dde5] focus:border-[#16a6c9] focus:shadow-[0_0_0_4px_rgba(22,166,201,.08)]"
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
          className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-[#8ca0b2] transition-all hover:bg-[#f0f7f9] hover:text-[#0d2b4e]"
        >
          {show ? (
            <EyeOff className="h-[17px] w-[17px]" />
          ) : (
            <Eye className="h-[17px] w-[17px]" />
          )}
        </button>
      </div>
    </div>
  );
}