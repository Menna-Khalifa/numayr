"use client";

import { ApiError, apiRequest } from "@/lib/api";
import { saveAuthToken } from "@/lib/auth";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const logoUrl =
  "https://res.cloudinary.com/deayevwds/image/upload/v1791205176/Numayr_Arch_and_Droplet_Logo_dt4yg5.png";

type LoginResponse = {
  success: true;
  message: string;
  data: {
    user: {
      id: number;
      name: string;
      email: string;
      phone: string;
      role: string;
      is_active: boolean;
    };
    token: string;
  };
};

const particles = [
  { left: "10%", top: "18%", size: 5, delay: 0.2, duration: 6.5 },
  { left: "22%", top: "77%", size: 7, delay: 1.1, duration: 7.2 },
  { left: "82%", top: "16%", size: 4, delay: 0.6, duration: 5.8 },
  { left: "89%", top: "64%", size: 6, delay: 1.6, duration: 6.8 },
  { left: "70%", top: "82%", size: 4, delay: 0.9, duration: 7.5 },
  { left: "15%", top: "48%", size: 3, delay: 2, duration: 5.9 },
];

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      saveAuthToken(response.data.token);

      router.push("/dashboard");
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
            className="relative z-10 w-full max-w-[480px]"
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

                <motion.div
                  className="absolute h-[118px] w-[118px] rounded-full bg-white/80 shadow-[0_20px_55px_rgba(13,43,78,.09)]"
                  animate={{
                    boxShadow: [
                      "0 20px 55px rgba(13,43,78,.08), 0 0 0 rgba(22,166,201,0)",
                      "0 20px 55px rgba(13,43,78,.10), 0 0 36px rgba(22,166,201,.17)",
                      "0 20px 55px rgba(13,43,78,.08), 0 0 0 rgba(22,166,201,0)",
                    ],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

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

              <motion.h1
                initial={{
                  opacity: 0,
                  y: 18,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.25,
                  duration: 0.75,
                }}
                className="text-[28px] font-extrabold leading-tight tracking-[-0.035em]"
              >
                <span className="text-[#0d2b4e]">أهلاً بعودتك </span>
                <span className="text-[#16a6c9]">إلى نمير</span>
              </motion.h1>

              <motion.p
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                transition={{
                  delay: 0.48,
                  duration: 0.7,
                }}
                className="mt-2 max-w-xs text-[13px] font-bold leading-6 text-[#718197]"
              >
                كل خدمات برادتك أقرب إليك.
              </motion.p>
            </div>

            <div className="mb-8 hidden lg:block">
              <motion.span
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.1,
                  duration: 0.6,
                }}
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#16a6c9]/15 bg-white/70 px-3.5 py-2 text-xs font-bold text-[#1599b9] shadow-sm backdrop-blur-xl"
              >
                <ShieldCheck className="h-4 w-4" />
                دخول آمن إلى حسابك
              </motion.span>

              <h1 className="text-[38px] font-extrabold tracking-[-0.045em]">
                <span className="text-[#0d2b4e]">أهلاً بعودتك </span>
                <span className="bg-gradient-to-l from-[#16a6c9] to-[#087fa4] bg-clip-text text-transparent">
                  إلى نمير
                </span>
              </h1>

              <p className="mt-3 text-sm font-bold leading-7 text-[#718197]">
                تابع براداتك وطلباتك وخدماتك من مكان واحد.
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

              <div className="relative z-10 space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2.5 block text-[13px] font-extrabold text-[#0d2b4e]"
                  >
                    البريد الإلكتروني
                  </label>

                  <div className="group relative">
                    <div className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl bg-[#f1f8fa] transition-colors group-focus-within:bg-[#e2f6fb]">
                      <Mail className="h-[17px] w-[17px] text-[#8299aa] transition-colors group-focus-within:text-[#16a6c9]" />
                    </div>

                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder="name@example.com"
                      dir="ltr"
                      className="h-[60px] w-full rounded-[18px] border border-[#dbe8ed] bg-white/90 pr-[60px] pl-4 text-left text-sm font-bold text-[#0d2b4e] outline-none transition-all placeholder:font-normal placeholder:text-[#a9b9c4] hover:border-[#c8dde5] focus:border-[#16a6c9] focus:shadow-[0_0_0_4px_rgba(22,166,201,.08)]"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2.5 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-[13px] font-extrabold text-[#0d2b4e]"
                    >
                      كلمة المرور
                    </label>

                    <Link
                      href="/forgot-password"
                      className="text-xs font-extrabold text-[#16a6c9] transition-colors hover:text-[#0d2b4e]"
                    >
                      نسيت كلمة المرور؟
                    </Link>
                  </div>

                  <div className="group relative">
                    <div className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl bg-[#f1f8fa] transition-colors group-focus-within:bg-[#e2f6fb]">
                      <LockKeyhole className="h-[17px] w-[17px] text-[#8299aa] transition-colors group-focus-within:text-[#16a6c9]" />
                    </div>

                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      placeholder="أدخل كلمة المرور"
                      className="h-[60px] w-full rounded-[18px] border border-[#dbe8ed] bg-white/90 pr-[60px] pl-14 text-sm font-bold text-[#0d2b4e] outline-none transition-all placeholder:font-normal placeholder:text-[#a9b9c4] hover:border-[#c8dde5] focus:border-[#16a6c9] focus:shadow-[0_0_0_4px_rgba(22,166,201,.08)]"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((current) => !current)
                      }
                      aria-label={
                        showPassword
                          ? "إخفاء كلمة المرور"
                          : "إظهار كلمة المرور"
                      }
                      className="absolute left-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-[#8ca0b2] transition-all hover:bg-[#f0f7f9] hover:text-[#0d2b4e]"
                    >
                      {showPassword ? (
                        <EyeOff className="h-[18px] w-[18px]" />
                      ) : (
                        <Eye className="h-[18px] w-[18px]" />
                      )}
                    </button>
                  </div>
                </div>

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
                    boxShadow:
                      "0 18px 36px rgba(13,43,78,.24)",
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
                      <span className="relative z-10">
                        تسجيل الدخول
                      </span>

                      <ArrowLeft className="relative z-10 h-[18px] w-[18px] transition-transform group-hover:-translate-x-1" />
                    </>
                  )}
                </motion.button>
              </div>
            </motion.form>

            <motion.p
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              transition={{
                delay: 0.65,
                duration: 0.7,
              }}
              className="mt-6 text-center text-[13px] font-bold text-[#718197]"
            >
              ليس لديك حساب؟{" "}
              <Link
                href="/register"
                className="font-extrabold text-[#16a6c9] transition-colors hover:text-[#0d2b4e]"
              >
                أنشئ حسابك
              </Link>
            </motion.p>
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

          <motion.div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.045]"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 70,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          <motion.div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[470px] w-[470px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#54d5ef]/10"
            animate={{
              rotate: -360,
            }}
            transition={{
              duration: 46,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {[0, 1, 2].map((ring) => (
            <motion.div
              key={ring}
              className="pointer-events-none absolute left-1/2 top-[49%] h-[230px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-[#6bdff5]/20"
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
                boxShadow:
                  "0 0 20px rgba(99,222,245,.55)",
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
                  boxShadow: [
                    "0 35px 95px rgba(0,0,0,.28), 0 0 55px rgba(64,207,235,.16)",
                    "0 35px 95px rgba(0,0,0,.24), 0 0 90px rgba(64,207,235,.30)",
                    "0 35px 95px rgba(0,0,0,.28), 0 0 55px rgba(64,207,235,.16)",
                  ],
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
                  rotateY: [0, 2, 0, -2, 0],
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
                  className="h-auto w-full object-contain drop-shadow-[0_13px_16px_rgba(13,43,78,.16)]"
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
                <span>تجربة رعاية أذكى</span>
              </div>

              <h2 className="mt-4 text-[38px] font-extrabold leading-tight tracking-[-0.045em]">
                <span className="text-white">برادتك </span>

                <span className="bg-gradient-to-l from-[#63dff6] via-[#27bfdf] to-[#9becfb] bg-clip-text text-transparent">
                  أقرب إليك
                </span>
              </h2>

              <p className="mx-auto mt-4 max-w-sm text-sm font-bold leading-7 text-[#bed8e5]/80">
                إدارة أبسط ومتابعة أوضح، وكل خدمات نمير
                في تجربة واحدة مصممة لراحتك.
              </p>
            </motion.div>

            <motion.div
              initial={{
                opacity: 0,
                scaleX: 0,
              }}
              animate={{
                opacity: 1,
                scaleX: 1,
              }}
              transition={{
                delay: 1.25,
                duration: 0.8,
              }}
              className="mt-7 h-px w-28 origin-center bg-gradient-to-r from-transparent via-[#4dd5ee]/70 to-transparent"
            />
          </div>
        </section>
      </div>
    </main>
  );
}