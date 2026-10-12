"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Droplets,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const logoUrl =
  "https://res.cloudinary.com/deayevwds/image/upload/v1791205176/Numayr_Arch_and_Droplet_Logo_dt4yg5.png";

const choices = [
  {
    href: "/login?portal=customer",
    title: "أنا صاحب برادة",
    description: "إدارة البرادات وطلب التعبئة والصيانة ومتابعة الخدمات.",
    icon: Droplets,
    badge: "حساب المستخدم",
  },
  {
    href: "/login?portal=admin",
    title: "أنا Admin",
    description: "إدارة المنصة والطلبات والعملاء والخدمات ومتابعة التشغيل.",
    icon: ShieldCheck,
    badge: "بوابة الإدارة",
  },
];

export default function RolePage() {
  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#edf7fa]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_12%,rgba(22,166,201,.16),transparent_28%),radial-gradient(circle_at_8%_86%,rgba(13,43,78,.08),transparent_30%),linear-gradient(145deg,#f7fcfd_0%,#edf7fa_55%,#e5f3f7_100%)]" />

      <motion.div
        className="pointer-events-none absolute -right-32 top-10 h-96 w-96 rounded-full bg-[#16a6c9]/10 blur-[100px]"
        animate={{
          x: [0, -25, 8, 0],
          y: [0, 20, 48, 0],
          scale: [1, 1.08, 0.97, 1],
        }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="pointer-events-none absolute -bottom-36 -left-24 h-[430px] w-[430px] rounded-full bg-[#0d2b4e]/6 blur-[110px]"
        animate={{
          x: [0, 36, -8, 0],
          y: [0, -28, -48, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1180px] items-center px-5 py-8 sm:px-8 lg:px-10">
        <div className="grid w-full overflow-hidden rounded-[34px] border border-white bg-white/70 shadow-[0_35px_100px_rgba(13,43,78,.11)] backdrop-blur-2xl lg:grid-cols-[.92fr_1.08fr]">
          <section className="relative hidden min-h-[720px] overflow-hidden bg-[#0d2b4e] p-10 lg:flex lg:flex-col lg:items-center lg:justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(73,213,239,.19),transparent_33%),linear-gradient(150deg,#123a65_0%,#0d2b4e_52%,#071a31_100%)]" />

            <motion.div
              className="absolute h-[470px] w-[470px] rounded-full border border-white/[0.05]"
              animate={{ rotate: 360 }}
              transition={{ duration: 65, repeat: Infinity, ease: "linear" }}
            />

            <motion.div
              className="absolute h-[350px] w-[350px] rounded-full border border-[#5bd9f1]/10"
              animate={{ rotate: -360 }}
              transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
            />

            <div className="relative z-10 flex max-w-md flex-col items-center text-center">
              <motion.div
                initial={{ opacity: 0, y: 55, scale: 0.82 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex h-[230px] w-[230px] items-center justify-center"
              >
                <motion.div
                  className="absolute h-[222px] w-[222px] rounded-full bg-[#def5f9] shadow-[0_30px_85px_rgba(0,0,0,.28),0_0_70px_rgba(73,213,239,.18)]"
                  animate={{
                    scale: [0.98, 1.03, 0.98],
                    boxShadow: [
                      "0 30px 85px rgba(0,0,0,.28),0 0 48px rgba(73,213,239,.14)",
                      "0 30px 85px rgba(0,0,0,.24),0 0 86px rgba(73,213,239,.27)",
                      "0 30px 85px rgba(0,0,0,.28),0 0 48px rgba(73,213,239,.14)",
                    ],
                  }}
                  transition={{
                    duration: 4.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative z-10 w-[168px]"
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

              <div className="mt-7 flex items-center gap-2 text-xs font-extrabold text-[#69ddf4]">
                <Sparkles className="h-4 w-4" />
                <span>بوابة نمير الموحدة</span>
              </div>

              <h1 className="mt-4 text-[38px] font-extrabold leading-tight text-white">
                ابدأ من المكان المناسب
              </h1>

              <p className="mt-4 max-w-sm text-sm font-bold leading-7 text-[#bfd9e4]/75">
                تجربة منفصلة للمستخدم ولوحة إدارة أوسع للمسؤول مع الحفاظ
                على نفس هوية نمير.
              </p>
            </div>
          </section>

          <section className="flex min-h-[720px] items-center px-5 py-8 sm:px-9 lg:px-12">
            <div className="mx-auto w-full max-w-[560px]">
              <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-right">
                <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-[28px] bg-white shadow-[0_18px_45px_rgba(13,43,78,.08)] lg:hidden">
                  <Image
                    src={logoUrl}
                    alt="نمير"
                    width={150}
                    height={150}
                    priority
                    className="h-16 w-16 object-contain"
                  />
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-[#16a6c9]/15 bg-white/80 px-3.5 py-2 text-xs font-extrabold text-[#1599b9] shadow-sm">
                  <UserRound className="h-4 w-4" />
                  اختر نوع الدخول
                </div>

                <h2 className="mt-4 text-[31px] font-extrabold tracking-[-0.035em] text-[#0d2b4e] sm:text-[36px]">
                  كيف تريد استخدام نمير؟
                </h2>

                <p className="mt-3 text-sm font-bold leading-7 text-[#718197]">
                  اختر البوابة المناسبة لحسابك، وبعد تسجيل الدخول يتم
                  التحقق من صلاحية الحساب من الخادم.
                </p>
              </div>

              <div className="space-y-4">
                {choices.map((choice, index) => {
                  const Icon = choice.icon;

                  return (
                    <motion.div
                      key={choice.href}
                      initial={{ opacity: 0, y: 22 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.1 + index * 0.1,
                        duration: 0.65,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <Link
                        href={choice.href}
                        className="group flex min-h-[132px] w-full items-center gap-4 rounded-[26px] border border-[#dce9ed] bg-white/90 p-5 text-right shadow-[0_14px_36px_rgba(13,43,78,.055)] transition-all hover:-translate-y-1 hover:border-[#16a6c9]/35 hover:shadow-[0_20px_50px_rgba(13,43,78,.09)] sm:p-6"
                      >
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-[#e9f8fb] text-[#16a6c9] transition-colors group-hover:bg-[#16a6c9] group-hover:text-white">
                          <Icon className="h-7 w-7" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className="inline-flex rounded-full bg-[#f2f8fa] px-2.5 py-1 text-[10px] font-extrabold text-[#7a909f]">
                            {choice.badge}
                          </span>

                          <h3 className="mt-2 text-lg font-extrabold text-[#0d2b4e]">
                            {choice.title}
                          </h3>

                          <p className="mt-1 text-xs font-bold leading-6 text-[#8194a2] sm:text-[13px]">
                            {choice.description}
                          </p>
                        </div>

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e0ecef] text-[#16a6c9] transition-all group-hover:border-[#16a6c9] group-hover:bg-[#16a6c9] group-hover:text-white">
                          <ArrowLeft className="h-4 w-4" />
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              <p className="mt-7 text-center text-[11px] font-bold leading-6 text-[#94a5b1]">
                اختيار بوابة الإدارة لا يمنح صلاحيات إدارية تلقائيًا؛
                يتم التحقق من دور الحساب عند تسجيل الدخول.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
