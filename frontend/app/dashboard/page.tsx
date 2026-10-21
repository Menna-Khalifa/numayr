"use client";

import AppShell from "@/components/app/AppShell";
import { ApiError, apiRequest } from "@/lib/api";
import { getAuthToken, removeAuthToken } from "@/lib/auth";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BellRing,
  ChevronLeft,
  CircleAlert,
  Droplets,
  Filter,
  Gauge,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
};

type MeResponse = {
  success: true;
  data: {
    user: User;
  };
};

type DashboardCooler = {
  id: number;
  name: string;
  approval_status?: string | null;
  health_score?: number | null;
  landmark?: string | null;
  address?: { label?: string | null } | null;
};

type DashboardCoolersResponse = {
  success: true;
  data: { coolers: DashboardCooler[] };
};
type DashboardNotification = {
  id: number;
  title: string;
  body: string;
  read_at?: string | null;
  created_at?: string | null;
};

type DashboardNotificationsResponse = {
  success: true;
  data: {
    notifications: { data: DashboardNotification[] };
    unread_count: number;
  };
};
const services = [
  {
    title: "تعبئة المياه",
    description: "اطلب الكمية المناسبة لبرادتك",
    icon: Droplets,
    href: "/services/refill",
  },
  {
    title: "الصيانة",
    description: "سجل العطل واطلب خدمة الصيانة",
    icon: Wrench,
    href: "/services/maintenance",
  },
  {
    title: "الفلاتر",
    description: "اختر خدمة الفلتر المناسبة",
    icon: Filter,
    href: "/services/filters",
  },
  {
    title: "الاشتراكات",
    description: "خطط عناية دورية لبرادتك",
    icon: ShieldCheck,
    href: "/subscriptions",
  },
];

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [coolers, setCoolers] = useState<DashboardCooler[]>([]);
  const [coolersLoading, setCoolersLoading] = useState(true);
  const [coolersError, setCoolersError] = useState("");
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState("");

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
      } catch (exception) {
        if (
          exception instanceof ApiError &&
          exception.status === 401
        ) {
          removeAuthToken();
          router.replace("/login");
          return;
        }

        setError("تعذر تحميل بيانات الحساب");
      } finally {
        setLoading(false);
      }
    }

    void loadUser();
  }, [router]);

  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      setCoolersLoading(false);
      return;
    }

    let active = true;

    async function loadCoolers() {
      try {
        const response = await apiRequest<DashboardCoolersResponse>(
          "/coolers",
          { token }
        );

        if (active) {
          setCoolers(response.data.coolers ?? []);
        }
      } catch (exception) {
        if (active) {
          setCoolersError(
            exception instanceof ApiError
              ? exception.message
              : "تعذر تحميل البرادات"
          );
        }
      } finally {
        if (active) {
          setCoolersLoading(false);
        }
      }
    }

    void loadCoolers();

    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      setNotificationsLoading(false);
      return;
    }

    let active = true;

    async function loadNotifications() {
      try {
        const response = await apiRequest<DashboardNotificationsResponse>(
          "/notifications?per_page=3",
          { token }
        );

        if (!active) return;

        setNotifications(response.data.notifications.data ?? []);
        setUnreadCount(response.data.unread_count ?? 0);
        setNotificationsError("");
      } catch (exception) {
        if (!active) return;

        setNotificationsError(
          exception instanceof ApiError
            ? exception.message
            : "تعذر تحميل الإشعارات"
        );
      } finally {
        if (active) setNotificationsLoading(false);
      }
    }

    void loadNotifications();

    window.addEventListener(
      "numayr:notifications-updated",
      loadNotifications
    );

    return () => {
      active = false;
      window.removeEventListener(
        "numayr:notifications-updated",
        loadNotifications
      );
    };
  }, []);
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f9fb]">
        <div className="flex flex-col items-center">
          <div className="relative h-14 w-14">
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-[#16a6c9]/15"
              animate={{
                scale: [0.8, 1.3],
                opacity: [1, 0],
              }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
              }}
            />

            <span className="absolute inset-[9px] animate-spin rounded-full border-[3px] border-[#d5e9ee] border-t-[#16a6c9]" />
          </div>

          <p className="mt-4 text-sm font-extrabold text-[#718197]">
            جاري تجهيز حسابك...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppShell userName={user?.name}>
      <div className="mx-auto max-w-[1500px]">
        <motion.section
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.7,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative overflow-hidden rounded-[28px] bg-[#0d2b4e] px-5 py-7 shadow-[0_24px_70px_rgba(13,43,78,.16)] sm:px-8 sm:py-9 lg:px-10"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(22,166,201,.25),transparent_28%),radial-gradient(circle_at_85%_90%,rgba(78,212,238,.11),transparent_30%),linear-gradient(135deg,#123b64_0%,#0d2b4e_55%,#081f39_100%)]" />

          <motion.div
            className="pointer-events-none absolute -left-14 -top-20 h-64 w-64 rounded-full border border-white/[0.06]"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 40,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          <motion.div
            className="pointer-events-none absolute -bottom-24 left-[18%] h-72 w-72 rounded-full bg-[#16a6c9]/13 blur-[80px]"
            animate={{
              x: [0, 40, 0],
              scale: [1, 1.12, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3.5 py-2 text-[11px] font-extrabold text-[#7be5f8] backdrop-blur-xl">
                <Sparkles className="h-4 w-4" />
                <span>كل خدمات برادتك في مكان واحد</span>
              </div>

              <h1 className="text-[28px] font-extrabold leading-tight text-white sm:text-[36px]">
                أهلاً{" "}
                <span className="bg-gradient-to-l from-[#71e3f8] to-[#28bddc] bg-clip-text text-transparent">
                  {user?.name || "بك"}
                </span>
              </h1>

              <p className="mt-3 max-w-xl text-sm font-bold leading-7 text-white/55">
                تابع براداتك واطلب الخدمات التي تحتاجها بسهولة من لوحة نمير.
              </p>
            </div>

            <Link
              href="/coolers"
              className="group inline-flex h-[52px] w-fit items-center gap-3 rounded-[17px] bg-white px-5 text-sm font-extrabold text-[#0d2b4e] shadow-[0_15px_35px_rgba(0,0,0,.12)] transition hover:-translate-y-0.5"
            >
              <Snowflake className="h-[18px] w-[18px] text-[#16a6c9]" />
              <span>عرض براداتي</span>
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            </Link>
          </div>
        </motion.section>

        {error ? (
          <div className="mt-5 flex items-center gap-3 rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            <CircleAlert className="h-5 w-5" />
            {error}
          </div>
        ) : null}

        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-extrabold text-[#16a6c9]">
                الخدمات
              </p>

              <h2 className="mt-1 text-xl font-extrabold text-[#0d2b4e] sm:text-2xl">
                ماذا تحتاج اليوم؟
              </h2>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {services.map((service, index) => {
              const Icon = service.icon;

              return (
                <motion.div
                  key={service.title}
                  initial={{
                    opacity: 0,
                    y: 18,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.1 + index * 0.08,
                    duration: 0.55,
                  }}
                >
                  <Link
                    href={service.href}
                    className="group relative flex min-h-[180px] flex-col overflow-hidden rounded-[24px] border border-[#e1edf1] bg-white p-5 shadow-[0_12px_38px_rgba(13,43,78,.05)] transition-all hover:-translate-y-1 hover:border-[#bfe5ed] hover:shadow-[0_20px_45px_rgba(13,43,78,.09)]"
                  >
                    <div className="absolute -left-10 -top-10 h-28 w-28 rounded-full bg-[#16a6c9]/6 blur-2xl transition-all group-hover:bg-[#16a6c9]/12" />

                    <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#eaf8fb] text-[#139cbd]">
                      <Icon className="h-[21px] w-[21px]" />
                    </div>

                    <h3 className="relative z-10 mt-5 text-[15px] font-extrabold text-[#0d2b4e]">
                      {service.title}
                    </h3>

                    <p className="relative z-10 mt-2 text-xs font-bold leading-6 text-[#8294a3]">
                      {service.description}
                    </p>

                    <div className="relative z-10 mt-auto flex justify-end pt-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f4f8fa] text-[#8a9daa] transition group-hover:bg-[#0d2b4e] group-hover:text-white">
                        <ChevronLeft className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
          <div className="rounded-[26px] border border-[#e1edf1] bg-white p-5 shadow-[0_12px_38px_rgba(13,43,78,.045)] sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold text-[#16a6c9]">
                  براداتي
                </p>

                <h2 className="mt-1 text-lg font-extrabold text-[#0d2b4e]">
                  حالة البرادات
                </h2>
              </div>

              <Link
                href="/coolers"
                className="text-xs font-extrabold text-[#16a6c9]"
              >
                عرض الكل
              </Link>
            </div>

            <div className="mt-6">
              {coolersLoading ? (
                <div className="grid min-h-[190px] place-items-center">
                  <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#d8e8ec] border-t-[#16a6c9]" />
                </div>
              ) : coolersError ? (
                <div className="rounded-[18px] border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-600">
                  {coolersError}
                </div>
              ) : coolers.length === 0 ? (
                <div className="flex min-h-[190px] flex-col items-center justify-center rounded-[22px] border border-dashed border-[#d6e6eb] bg-[#f9fcfd] px-5 text-center">
                  <Gauge className="h-9 w-9 text-[#16a6c9]" />
                  <h3 className="mt-4 text-sm font-extrabold text-[#0d2b4e]">
                    لا توجد برادات مسجلة حتى الآن
                  </h3>
                  <Link href="/coolers" className="mt-4 text-xs font-extrabold text-[#16a6c9]">
                    إضافة برادة
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-xl bg-[#edf9fb] px-4 py-2 text-xs font-extrabold text-[#0d2b4e]">
                      إجمالي البرادات: {coolers.length}
                    </span>
                    <span className="rounded-xl bg-emerald-50 px-4 py-2 text-xs font-extrabold text-emerald-700">
                      المعتمدة: {coolers.filter((c) => c.approval_status === "approved").length}
                    </span>
                    <span className="rounded-xl bg-amber-50 px-4 py-2 text-xs font-extrabold text-amber-700">
                      قيد المراجعة: {coolers.filter((c) => c.approval_status === "pending_review").length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {coolers.slice(0, 3).map((cooler) => (
                      <Link
                        key={cooler.id}
                        href={`/coolers/${cooler.id}`}
                        className="flex items-center justify-between gap-3 rounded-[18px] border border-[#e1edf1] bg-[#f9fcfd] p-4 transition hover:border-[#16a6c9]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-[#0d2b4e]">
                            {cooler.name}
                          </p>
                          <p className="mt-1 text-xs font-bold text-[#8294a3]">
                            {cooler.landmark || cooler.address?.label || "الموقع غير محدد"}
                          </p>
                        </div>

                        <span className="shrink-0 text-[11px] font-extrabold text-[#16a6c9]">
                          {cooler.approval_status === "approved"
                            ? "معتمدة"
                            : cooler.approval_status === "pending_review"
                              ? "قيد المراجعة"
                              : cooler.approval_status === "rejected"
                                ? "تحتاج تعديل"
                                : cooler.approval_status === "disabled"
                                  ? "موقوفة"
                                  : "غير محددة"}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="rounded-[26px] border border-[#e1edf1] bg-white p-5 shadow-[0_12px_38px_rgba(13,43,78,.045)] sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#eef8fb]">
                <BellRing className="h-5 w-5 text-[#16a6c9]" />
              </div>

              <div>
                <p className="text-[11px] font-extrabold text-[#16a6c9]">
                  التنبيهات
                </p>

                <h2 className="mt-0.5 text-base font-extrabold text-[#0d2b4e]">
                  آخر التحديثات
                </h2>
              </div>
            </div>

            <div className="mt-6">
              {notificationsLoading ? (
                <div className="grid min-h-[190px] place-items-center">
                  <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#d8e8ec] border-t-[#16a6c9]" />
                </div>
              ) : notificationsError ? (
                <div className="rounded-[18px] border border-red-100 bg-red-50 p-4 text-xs font-bold text-red-600">
                  {notificationsError}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex min-h-[190px] flex-col items-center justify-center text-center">
                  <BellRing className="h-9 w-9 text-[#9aabb6]" />
                  <p className="mt-4 text-sm font-extrabold text-[#0d2b4e]">
                    لا توجد إشعارات حتى الآن
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unreadCount > 0 && (
                    <p className="text-xs font-extrabold text-[#16a6c9]">
                      لديك {unreadCount} إشعار غير مقروء
                    </p>
                  )}

                  {notifications.map((notification) => (
                    <Link
                      key={notification.id}
                      href="/notifications"
                      className={`block rounded-[17px] border p-4 transition hover:border-[#16a6c9] ${
                        notification.read_at
                          ? "border-[#e1edf1] bg-white"
                          : "border-[#bfe5ed] bg-[#f0fbfd]"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!notification.read_at && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#16a6c9]" />
                        )}

                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-[#0d2b4e]">
                            {notification.title}
                          </p>
                          <p className="mt-1 line-clamp-2 text-[11px] font-bold leading-5 text-[#8294a3]">
                            {notification.body}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}

                  <Link
                    href="/notifications"
                    className="block pt-2 text-center text-xs font-extrabold text-[#16a6c9]"
                  >
                    عرض جميع الإشعارات
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}