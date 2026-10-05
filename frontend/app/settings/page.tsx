"use client";

import AppShell from "@/components/app/AppShell";
import { apiRequest } from "@/lib/api";
import { getAuthToken, removeAuthToken } from "@/lib/auth";
import { motion } from "framer-motion";
import {
  BellRing,
  ChevronLeft,
  CircleHelp,
  CircleUserRound,
  FileText,
  Info,
  Languages,
  LockKeyhole,
  LogOut,
  MapPin,
  ReceiptText,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
};

type MeResponse = {
  success: true;
  data: {
    user: User;
  };
};

const accountItems = [
  {
    title: "البيانات الشخصية",
    description: "الاسم والجوال والمدينة والبيانات الأساسية",
    href: "/account",
    icon: UserRound,
  },
  {
    title: "العناوين",
    description: "إدارة مواقع تنفيذ الخدمات والعنوان الافتراضي",
    href: "/account",
    icon: MapPin,
  },
  {
    title: "الإشعارات",
    description: "التنبيهات وتفضيلات SMS والتنبيهات الذكية",
    href: "/notifications",
    icon: BellRing,
  },
];

const serviceItems = [
  {
    title: "الاشتراكات",
    description: "عرض باقات نمير والاشتراكات الحالية",
    href: "/subscriptions",
    icon: Sparkles,
  },
  {
    title: "طلباتي",
    description: "متابعة طلبات التعبئة والصيانة والفلاتر",
    href: "/orders",
    icon: ReceiptText,
  },
  {
    title: "الفواتير",
    description: "عرض وتنزيل ومشاركة الفواتير",
    href: "/invoices",
    icon: FileText,
  },
];

export default function SettingsPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    async function loadUser() {
      try {
        const response = await apiRequest<MeResponse>(
          "/auth/me",
          {
            token,
          }
        );

        setUser(response.data.user);
      } catch {
        removeAuthToken();
        router.replace("/login");
      }
    }

    void loadUser();
  }, [router]);

  async function logout() {
    const token = getAuthToken();

    setLoggingOut(true);

    try {
      if (token) {
        await apiRequest("/auth/logout", {
          method: "POST",
          token,
        });
      }
    } catch {
    } finally {
      removeAuthToken();
      router.replace("/login");
      setLoggingOut(false);
    }
  }

  return (
    <AppShell userName={user?.name}>
      <div className="mx-auto max-w-[1450px]">
        <motion.section
          initial={{
            opacity: 0,
            y: 16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="relative overflow-hidden rounded-[30px] bg-[#0d2b4e] px-6 py-8 shadow-[0_24px_70px_rgba(13,43,78,.15)] sm:px-8"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(22,166,201,.30),transparent_30%),radial-gradient(circle_at_90%_100%,rgba(87,218,243,.10),transparent_30%),linear-gradient(135deg,#123d67,#0d2b4e_55%,#081f39)]" />

          <motion.div
            className="absolute -left-20 -top-20 h-72 w-72 rounded-full border border-white/[0.06]"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 55,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[21px] bg-white/10 text-[#67dcf3]">
              <Settings className="h-7 w-7" />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-1.5 text-[10px] font-extrabold text-[#69dcf3]">
                <ShieldCheck className="h-3.5 w-3.5" />
                إدارة حسابك
              </div>

              <h1 className="mt-3 text-[29px] font-extrabold text-white sm:text-[36px]">
                الإعدادات
              </h1>

              <p className="mt-2 text-sm font-bold text-white/50">
                كل ما تحتاجه لإدارة حساب نمير في مكان واحد.
              </p>
            </div>
          </div>
        </motion.section>

        <section className="mt-7 grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <SettingsSection
              eyebrow="الحساب"
              title="الحساب والبيانات"
            >
              <div className="grid gap-3 md:grid-cols-3">
                {accountItems.map((item, index) => (
                  <SettingsCard
                    key={item.title}
                    {...item}
                    index={index}
                  />
                ))}
              </div>
            </SettingsSection>

            <SettingsSection
              eyebrow="الخدمات"
              title="خدماتي"
            >
              <div className="grid gap-3 md:grid-cols-3">
                {serviceItems.map((item, index) => (
                  <SettingsCard
                    key={item.title}
                    {...item}
                    index={index}
                  />
                ))}
              </div>
            </SettingsSection>

            <SettingsSection
              eyebrow="الأمان"
              title="الأمان والخصوصية"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href="/forgot-password"
                  className="group flex items-center gap-4 rounded-[20px] border border-[#e0ebef] bg-[#fbfdfe] p-4 transition hover:border-[#bce1e9] hover:bg-[#f2fafc]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#eaf8fb] text-[#16a6c9]">
                    <LockKeyhole className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-extrabold text-[#0d2b4e]">
                      تغيير كلمة المرور
                    </h3>

                    <p className="mt-1 text-[10px] font-bold leading-5 text-[#8497a4]">
                      تأكيد الهوية بالكود ثم اختيار كلمة مرور جديدة.
                    </p>
                  </div>

                  <ChevronLeft className="h-4 w-4 text-[#a0b0b9] transition-transform group-hover:-translate-x-1" />
                </Link>

                <div className="flex items-center gap-4 rounded-[20px] border border-[#e0ebef] bg-[#fbfdfe] p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#eaf8fb] text-[#16a6c9]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-[#0d2b4e]">
                      حماية الحساب
                    </h3>

                    <p className="mt-1 text-[10px] font-bold leading-5 text-[#8497a4]">
                      الدخول والخدمات المحمية تعمل باستخدام جلسة الحساب.
                    </p>
                  </div>
                </div>
              </div>
            </SettingsSection>

            <SettingsSection
              eyebrow="عام"
              title="تفضيلات التطبيق"
            >
              <div className="space-y-3">
                <StaticSetting
                  icon={<Languages className="h-5 w-5" />}
                  title="لغة التطبيق"
                  description="العربية"
                  value="AR"
                />

                <StaticSetting
                  icon={<CircleHelp className="h-5 w-5" />}
                  title="مركز المساعدة"
                  description="الأسئلة المتكررة والمساعدة في استخدام نمير"
                />

                <StaticSetting
                  icon={<Info className="h-5 w-5" />}
                  title="عن نمير"
                  description="معلومات المنصة وسياسات الخدمة"
                />
              </div>
            </SettingsSection>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-[100px] xl:h-fit">
            <div className="overflow-hidden rounded-[27px] border border-[#e0ecef] bg-white shadow-[0_15px_50px_rgba(13,43,78,.06)]">
              <div className="relative bg-[#0d2b4e] p-5">
                <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[#16a6c9]/20 blur-[35px]" />

                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-white/10 text-[#67dcf3]">
                    <CircleUserRound className="h-6 w-6" />
                  </div>

                  <h2 className="mt-4 text-lg font-extrabold text-white">
                    {user?.name || "مستخدم نمير"}
                  </h2>

                  <p
                    dir="ltr"
                    className="mt-1 w-fit text-xs font-bold text-white/40"
                  >
                    {user?.email || ""}
                  </p>
                </div>
              </div>

              <div className="p-5">
                <Link
                  href="/account"
                  className="flex h-[48px] w-full items-center justify-between rounded-[15px] bg-[#f4f9fb] px-4 text-xs font-extrabold text-[#0d2b4e]"
                >
                  <span>إدارة الملف الشخصي</span>
                  <ChevronLeft className="h-4 w-4 text-[#16a6c9]" />
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  disabled={loggingOut}
                  className="mt-3 flex h-[48px] w-full items-center justify-center gap-2 rounded-[15px] bg-red-50 text-xs font-extrabold text-red-500 transition hover:bg-red-100 disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />

                  {loggingOut
                    ? "جاري تسجيل الخروج..."
                    : "تسجيل الخروج"}
                </button>
              </div>
            </div>

            <div className="rounded-[23px] border border-[#d9eaf0] bg-[#edf9fb] p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#16a6c9]" />

                <div>
                  <p className="text-xs font-extrabold text-[#0d2b4e]">
                    إعدادات حقيقية فقط
                  </p>

                  <p className="mt-2 text-[10px] font-bold leading-5 text-[#7f949f]">
                    الخصائص غير المدعومة حاليًا من النظام لن تظهر كأزرار وهمية.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}

function SettingsSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[27px] border border-[#e0ecef] bg-white p-5 shadow-[0_12px_38px_rgba(13,43,78,.045)] sm:p-6">
      <div className="mb-5">
        <p className="text-[10px] font-extrabold text-[#16a6c9]">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-lg font-extrabold text-[#0d2b4e]">
          {title}
        </h2>
      </div>

      {children}
    </section>
  );
}

function SettingsCard({
  title,
  description,
  href,
  icon: Icon,
  index,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  index: number;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: index * 0.05,
      }}
    >
      <Link
        href={href}
        className="group flex h-full min-h-[150px] flex-col rounded-[20px] border border-[#e1ecef] bg-[#fbfdfe] p-4 transition hover:-translate-y-1 hover:border-[#bce1e9] hover:bg-[#f2fafc]"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#eaf8fb] text-[#16a6c9]">
          <Icon className="h-5 w-5" />
        </div>

        <h3 className="mt-4 text-sm font-extrabold text-[#0d2b4e]">
          {title}
        </h3>

        <p className="mt-2 text-[10px] font-bold leading-5 text-[#8497a4]">
          {description}
        </p>

        <ChevronLeft className="mt-auto h-4 w-4 self-end text-[#9dabb4] transition-transform group-hover:-translate-x-1 group-hover:text-[#16a6c9]" />
      </Link>
    </motion.div>
  );
}

function StaticSetting({
  icon,
  title,
  description,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  value?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] bg-[#f7fbfc] p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white text-[#16a6c9]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-extrabold text-[#0d2b4e]">
          {title}
        </p>

        <p className="mt-1 text-[10px] font-bold text-[#879aa7]">
          {description}
        </p>
      </div>

      {value ? (
        <span className="rounded-[10px] bg-white px-3 py-2 text-[10px] font-extrabold text-[#16a6c9]">
          {value}
        </span>
      ) : null}
    </div>
  );
}