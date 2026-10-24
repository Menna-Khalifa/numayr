"use client";

import { apiRequest } from "@/lib/api";
import { getAuthToken, removeAuthToken } from "@/lib/auth";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronLeft,
  CircleUserRound,
  Home,
  LogOut,
  Menu,
  PackageCheck,
  ReceiptText,
  Settings,
  Snowflake,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

const logoUrl =
  "https://res.cloudinary.com/deayevwds/image/upload/v1791205176/Numayr_Arch_and_Droplet_Logo_dt4yg5.png";

type AppShellProps = {
  children: ReactNode;
  userName?: string;
};

type NotificationsCountResponse = {
  success: true;
  data: {
    unread_count: number;
  };
};

const navigation = [
  {
    label: "الرئيسية",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "براداتي",
    href: "/coolers",
    icon: Snowflake,
  },
  {
    label: "طلباتي",
    href: "/orders",
    icon: PackageCheck,
  },
  {
    label: "فواتيري",
    href: "/invoices",
    icon: ReceiptText,
  },
  {
    label: "حسابي",
    href: "/account",
    icon: CircleUserRound,
  },
];

export default function AppShell({
  children,
  userName,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const loadUnreadCount = useCallback(
    async () => {
      const token = getAuthToken();

      if (!token) {
        setUnreadCount(0);
        return;
      }

      try {
        const response =
          await apiRequest<NotificationsCountResponse>(
            "/notifications?unread_only=1&per_page=1",
            {
              token,
            }
          );

        setUnreadCount(
          Number(
            response.data.unread_count ?? 0
          )
        );
      } catch {
        setUnreadCount(0);
      }
    },
    []
  );

  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      return;
    }

    let active = true;

    apiRequest<NotificationsCountResponse>(
      "/notifications?unread_only=1&per_page=1",
      {
        token,
      }
    )
      .then((response) => {
        if (!active) {
          return;
        }

        setUnreadCount(
          Number(response.data.unread_count ?? 0)
        );
      })
      .catch(() => {
        if (active) {
          setUnreadCount(0);
        }
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    function handleNotificationsUpdated() {
      void loadUnreadCount();
    }

    window.addEventListener(
      "numayr:notifications-updated",
      handleNotificationsUpdated
    );

    return () => {
      window.removeEventListener(
        "numayr:notifications-updated",
        handleNotificationsUpdated
      );
    };
  }, [loadUnreadCount]);

  async function handleLogout() {
    const token = getAuthToken();

    if (!token) {
      removeAuthToken();
      router.replace("/login");
      return;
    }

    setLoggingOut(true);

    try {
      await apiRequest("/auth/logout", {
        method: "POST",
        token,
      });
    } catch {
    } finally {
      removeAuthToken();
      router.replace("/login");
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f9fb]">
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-[286px] overflow-hidden border-l border-white/5 bg-[#0b2746] lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(22,166,201,.18),transparent_30%),linear-gradient(180deg,#0d2b4e_0%,#091f39_100%)]" />

        <motion.div
          className="pointer-events-none absolute -right-24 top-[12%] h-64 w-64 rounded-full bg-[#16a6c9]/15 blur-[80px]"
          animate={{
            y: [0, 35, 0],
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div className="relative z-10 flex h-full flex-col p-5">
          <Link
            href="/dashboard"
            className="mb-8 flex items-center gap-3 rounded-[22px] px-3 py-2"
          >
            <div className="flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-[#dff4f8] shadow-[0_12px_30px_rgba(0,0,0,.16)]">
              <Image
                src={logoUrl}
                alt="نمير"
                width={48}
                height={48}
                priority
                className="h-[46px] w-[46px] object-contain"
              />
            </div>

            <div>
              <p className="text-lg font-extrabold text-white">
                نمير
              </p>

              <p className="mt-0.5 text-[10px] font-bold tracking-[0.15em] text-[#69d7ed]/70">
                NUMAYR
              </p>
            </div>
          </Link>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;

              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(
                    item.href
                  ));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex h-[54px] items-center gap-3 overflow-hidden rounded-[17px] px-4 text-sm font-extrabold transition-all ${
                    active
                      ? "bg-white/[0.11] text-white shadow-[0_10px_28px_rgba(0,0,0,.10)]"
                      : "text-white/55 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  {active ? (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute inset-y-2 right-0 w-[3px] rounded-l-full bg-[#4ed4ee]"
                    />
                  ) : null}

                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                      active
                        ? "bg-[#16a6c9]/20 text-[#68dff5]"
                        : "bg-white/[0.045] text-white/45 group-hover:text-[#68dff5]"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </div>

                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto">
            <div className="mb-4 rounded-[22px] border border-white/[0.07] bg-white/[0.045] p-4">
              <p className="text-[11px] font-bold text-white/40">
                مسجل الدخول باسم
              </p>

              <p className="mt-1 truncate text-sm font-extrabold text-white">
                {userName || "مستخدم نمير"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex h-[50px] w-full items-center gap-3 rounded-[16px] px-4 text-sm font-extrabold text-white/55 transition hover:bg-red-500/10 hover:text-red-200 disabled:opacity-50"
            >
              <LogOut className="h-[18px] w-[18px]" />

              <span>
                {loggingOut
                  ? "جاري الخروج..."
                  : "تسجيل الخروج"}
              </span>
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pr-[286px]">
        <header className="sticky top-0 z-30 border-b border-[#e4eef2] bg-[#f4f9fb]/85 backdrop-blur-2xl">
          <div className="flex h-[76px] items-center justify-between px-4 sm:px-7 lg:px-10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(true)
                }
                className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-[#dfebef] bg-white text-[#0d2b4e] shadow-sm lg:hidden"
                aria-label="فتح القائمة"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div>
                <p className="text-[11px] font-bold text-[#8ca0ad]">
                  مرحبًا بك
                </p>

                <p className="mt-0.5 text-sm font-extrabold text-[#0d2b4e] sm:text-base">
                  {userName || "في نمير"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/notifications"
                className={`group relative flex h-11 w-11 items-center justify-center rounded-[14px] border bg-white text-[#0d2b4e] shadow-sm transition ${
                  pathname.startsWith(
                    "/notifications"
                  )
                    ? "border-[#16a6c9] bg-[#eaf8fb]"
                    : "border-[#dfebef] hover:border-[#bce2eb]"
                }`}
                aria-label={
                  unreadCount > 0
                    ? `الإشعارات، ${unreadCount} غير مقروء`
                    : "الإشعارات"
                }
              >
                <Bell
                  className={`h-[19px] w-[19px] transition ${
                    pathname.startsWith(
                      "/notifications"
                    )
                      ? "text-[#16a6c9]"
                      : ""
                  }`}
                />

                {unreadCount > 0 ? (
                  <motion.span
                    initial={{
                      scale: 0,
                      opacity: 0,
                    }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                    }}
                    className="absolute -right-1.5 -top-1.5 flex min-h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-[#f4f9fb] bg-[#16a6c9] px-1 text-[8px] font-extrabold leading-none text-white shadow-[0_4px_12px_rgba(22,166,201,.35)]"
                  >
                    {unreadCount > 99
                      ? "99+"
                      : unreadCount}
                  </motion.span>
                ) : null}

                {unreadCount > 0 ? (
                  <motion.span
                    className="pointer-events-none absolute inset-0 rounded-[14px] border border-[#16a6c9]/30"
                    animate={{
                      scale: [1, 1.14, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                ) : null}
              </Link>

              <Link
                href="/account"
                className="hidden h-11 items-center gap-2 rounded-[14px] border border-[#dfebef] bg-white px-3 text-sm font-extrabold text-[#0d2b4e] shadow-sm sm:flex"
              >
                <CircleUserRound className="h-[18px] w-[18px] text-[#16a6c9]" />

                <span>حسابي</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="px-4 pb-28 pt-6 sm:px-7 lg:px-10 lg:pb-10">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 rounded-[24px] border border-white/80 bg-white/90 px-2 py-2 shadow-[0_18px_60px_rgba(13,43,78,.16)] backdrop-blur-2xl lg:hidden">
        <div className="grid grid-cols-5">
          {navigation.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(
                  item.href
                ));

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex min-h-[58px] flex-col items-center justify-center gap-1"
              >
                {active ? (
                  <motion.span
                    layoutId="mobile-nav-active"
                    className="absolute inset-1 rounded-[18px] bg-[#e7f7fb]"
                  />
                ) : null}

                <Icon
                  className={`relative z-10 h-[19px] w-[19px] ${
                    active
                      ? "text-[#0d2b4e]"
                      : "text-[#91a3af]"
                  }`}
                />

                <span
                  className={`relative z-10 text-[10px] font-extrabold ${
                    active
                      ? "text-[#0d2b4e]"
                      : "text-[#91a3af]"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="إغلاق القائمة"
              onClick={() =>
                setMobileMenuOpen(false)
              }
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              className="fixed inset-0 z-50 bg-[#06192f]/35 backdrop-blur-[2px] lg:hidden"
            />

            <motion.aside
              initial={{
                x: "100%",
              }}
              animate={{
                x: 0,
              }}
              exit={{
                x: "100%",
              }}
              transition={{
                duration: 0.35,
                ease: [
                  0.16,
                  1,
                  0.3,
                  1,
                ],
              }}
              className="fixed inset-y-0 right-0 z-[60] w-[84%] max-w-[340px] overflow-hidden bg-[#0b2746] p-5 lg:hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_12%,rgba(22,166,201,.19),transparent_28%),linear-gradient(180deg,#0d2b4e,#071a31)]" />

              <div className="relative z-10">
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#dff4f8]">
                      <Image
                        src={logoUrl}
                        alt="نمير"
                        width={45}
                        height={45}
                        className="h-[44px] w-[44px] object-contain"
                      />
                    </div>

                    <div>
                      <p className="font-extrabold text-white">
                        نمير
                      </p>

                      <p className="text-[10px] font-bold text-[#67d8ed]/70">
                        NUMAYR
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setMobileMenuOpen(false)
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-white/[0.08] text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="space-y-2">
                  {navigation.map((item) => {
                    const Icon =
                      item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex h-[54px] items-center justify-between rounded-[17px] bg-white/[0.045] px-4 text-sm font-extrabold text-white/75"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-[18px] w-[18px] text-[#64d8ef]" />

                          <span>
                            {item.label}
                          </span>
                        </div>

                        <ChevronLeft className="h-4 w-4 text-white/30" />
                      </Link>
                    );
                  })}

                  <Link
                    href="/notifications"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex h-[54px] items-center justify-between rounded-[17px] bg-white/[0.045] px-4 text-sm font-extrabold text-white/75"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Bell className="h-[18px] w-[18px] text-[#64d8ef]" />

                        {unreadCount >
                        0 ? (
                          <span className="absolute -right-2 -top-2 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#16a6c9] px-1 text-[7px] font-extrabold text-white">
                            {unreadCount >
                            99
                              ? "99+"
                              : unreadCount}
                          </span>
                        ) : null}
                      </div>

                      <span>
                        الإشعارات
                      </span>
                    </div>

                    <ChevronLeft className="h-4 w-4 text-white/30" />
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex h-[54px] items-center justify-between rounded-[17px] bg-white/[0.045] px-4 text-sm font-extrabold text-white/75"
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="h-[18px] w-[18px] text-[#64d8ef]" />

                      <span>
                        الإعدادات
                      </span>
                    </div>

                    <ChevronLeft className="h-4 w-4 text-white/30" />
                  </Link>
                </nav>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="mt-8 flex h-[52px] w-full items-center justify-center gap-2 rounded-[17px] border border-red-300/10 bg-red-400/10 text-sm font-extrabold text-red-100 disabled:opacity-50"
                >
                  <LogOut className="h-[18px] w-[18px]" />

                  {loggingOut
                    ? "جاري الخروج..."
                    : "تسجيل الخروج"}
                </button>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}