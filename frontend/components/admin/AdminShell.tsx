"use client";

import { ApiError, apiRequest } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronLeft,
  CircleDollarSign,
  Droplets,
  Gauge,
  LogOut,
  Menu,
  PackageCheck,
  ReceiptText,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";

const logoUrl =
  "https://res.cloudinary.com/deayevwds/image/upload/v1791205176/Numayr_Arch_and_Droplet_Logo_dt4yg5.png";

const navigation = [
  { href: "/admin", label: "لوحة التحكم", icon: Gauge },
  { href: "/admin/orders", label: "الطلبات", icon: PackageCheck },
  { href: "/admin/customers", label: "العملاء", icon: Users },
  { href: "/admin/coolers", label: "البرادات", icon: Droplets },
  { href: "/admin/services", label: "الخدمات والأسعار", icon: SlidersHorizontal },
  { href: "/admin/subscriptions", label: "الاشتراكات", icon: ReceiptText },
  { href: "/admin/payments", label: "المدفوعات", icon: CircleDollarSign },
  { href: "/admin/invoices", label: "الفواتير", icon: WalletCards },
  { href: "/admin/notifications", label: "الإشعارات", icon: Bell },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
];

type MeResponse = {
  success: true;
  data: {
    user: {
      id: number;
      name: string;
      email: string;
      role: string;
    };
  };
};

type NotificationsResponse = {
  success: true;
  data: {
    unread_count: number;
  };
};

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function pageTitle(pathname: string) {
  const item = navigation.find((entry) => isActive(pathname, entry.href));
  return item?.label || "لوحة الإدارة";
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminName, setAdminName] = useState("NUMAYR Admin");
  const [unreadCount, setUnreadCount] = useState(0);
  const [checking, setChecking] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadSession = useCallback(async () => {
    const token = getAuthToken();

    if (!token) {
      router.replace("/login?portal=admin");
      return;
    }

    try {
      const me = await apiRequest<MeResponse>("/auth/me", { token });

      if (me.data.user.role !== "admin") {
        router.replace("/role");
        return;
      }

      setAdminName(me.data.user.name || "NUMAYR Admin");

      try {
        const notifications =
          await apiRequest<NotificationsResponse>("/notifications?per_page=1", {
            token,
          });
        setUnreadCount(Number(notifications.data.unread_count || 0));
      } catch {
        setUnreadCount(0);
      }
    } catch {
      router.replace("/login?portal=admin");
    } finally {
      setChecking(false);
    }
  }, [router]);

  useEffect(() => {
    void loadSession();

    const update = () => void loadSession();
    window.addEventListener("numayr:notifications-updated", update);

    return () => {
      window.removeEventListener("numayr:notifications-updated", update);
    };
  }, [loadSession]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const currentTitle = useMemo(() => pageTitle(pathname), [pathname]);

  async function handleLogout() {
    if (loggingOut) return;

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
      try {
        localStorage.removeItem("numayr_token");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("token");
      } catch {
      }

      window.location.href = "/role";
    }
  }

  if (checking) {
    return (
      <div dir="rtl" className="grid min-h-screen place-items-center bg-[#edf7fa]">
        <div className="text-center">
          <span className="mx-auto block h-11 w-11 animate-spin rounded-full border-[3px] border-[#d8e8ec] border-t-[#16a6c9]" />
          <p className="mt-4 text-sm font-extrabold text-[#738896]">
            جاري تجهيز لوحة الإدارة...
          </p>
        </div>
      </div>
    );
  }

  const sidebar = (
    <div className="relative z-10 flex h-full flex-col">
      <div className="mb-6 flex items-center gap-3 px-1">
        <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[18px] bg-[#dff4f8] shadow-[0_10px_28px_rgba(0,0,0,.08)]">
          <Image
            src={logoUrl}
            alt="نمير"
            width={46}
            height={46}
            className="h-[45px] w-[45px] object-contain"
          />
        </div>

        <div className="min-w-0">
          <p className="truncate text-[17px] font-extrabold leading-7 text-white">
            نمير
          </p>
          <p className="text-[10px] font-bold tracking-[.16em] text-[#67d8ed]/70">
            NUMAYR ADMIN
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-[17px] border border-white/[0.06] bg-white/[0.045] px-4 py-3">
        <p className="text-[9px] font-bold text-white/40">المسؤول الحالي</p>
        <p className="mt-1 truncate text-[12px] font-extrabold leading-6 text-white">
          {adminName}
        </p>
      </div>

      <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          const showBadge =
            item.href === "/admin/notifications" && unreadCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex min-h-[50px] items-center justify-between overflow-hidden rounded-[15px] px-3.5 text-[12px] font-extrabold leading-6 transition-all ${
                active
                  ? "bg-white/[0.115] text-white shadow-[0_8px_24px_rgba(0,0,0,.08)]"
                  : "bg-white/[0.035] text-white/72 hover:bg-white/[0.075] hover:text-white"
              }`}
            >
              {active ? (
                <span className="absolute inset-y-2 right-0 w-[3px] rounded-l-full bg-[#64d8ef]" />
              ) : null}

              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] transition ${
                    active
                      ? "bg-[#64d8ef]/15 text-[#78e4f7]"
                      : "bg-white/[0.035] text-[#64d8ef]"
                  }`}
                >
                  <Icon className="h-[17px] w-[17px]" />
                </div>

                <span className="truncate whitespace-nowrap">{item.label}</span>
              </div>

              <div className="flex items-center gap-2">
                {showBadge ? (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#e53935] px-1.5 py-0.5 text-[9px] font-black text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}

                <ChevronLeft className="h-3.5 w-3.5 shrink-0 text-white/25 transition group-hover:text-white/45" />
              </div>
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="mt-5 flex h-[50px] w-full shrink-0 items-center justify-center gap-2 rounded-[15px] border border-red-300/10 bg-red-400/10 text-[12px] font-extrabold text-red-100 transition hover:bg-red-400/15 hover:text-white disabled:opacity-50"
      >
        <LogOut className="h-[17px] w-[17px]" />
        {loggingOut ? "جاري الخروج..." : "تسجيل الخروج"}
      </button>
    </div>
  );

  return (
    <div dir="rtl" className="min-h-screen bg-[#edf7fa] text-[#0d2b4e]">
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-[292px] overflow-hidden bg-[#0b2746] p-5 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_8%,rgba(22,166,201,.22),transparent_27%),linear-gradient(180deg,#0d2b4e,#071a31)]" />
        {sidebar}
      </aside>

      <div className="min-h-screen lg:mr-[292px]">
        <header className="sticky top-0 z-30 border-b border-[#dfecef] bg-white/92 backdrop-blur-2xl">
          <div className="flex h-[76px] w-full items-center gap-3 px-4 sm:px-7 lg:px-10">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-[#dfebef] bg-white text-[#0d2b4e] shadow-sm transition hover:border-[#16a6c9]/35 hover:bg-[#f3fbfd] lg:hidden"
              aria-label="فتح القائمة"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold leading-5 text-[#8aa0ad]">
                إدارة وتشغيل المنصة
              </p>
              <h1 className="truncate text-[16px] font-extrabold leading-7 text-[#0d2b4e] sm:text-[17px]">
                {currentTitle}
              </h1>
            </div>

            <Link
              href="/admin/notifications"
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-[#dfebef] bg-white text-[#0d2b4e] shadow-sm transition hover:border-[#16a6c9]/35 hover:bg-[#f3fbfd] hover:text-[#16a6c9]"
              aria-label="الإشعارات"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 ? (
                <span className="absolute -left-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#e53935] px-1 text-[8px] font-black text-white ring-2 ring-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </Link>

            <div className="hidden h-11 items-center gap-2 rounded-[14px] border border-[#dfebef] bg-white px-3 text-[12px] font-extrabold text-[#0d2b4e] shadow-sm sm:flex">
              <ShieldCheck className="h-[18px] w-[18px] text-[#16a6c9]" />
              <span>Admin</span>
            </div>
          </div>
        </header>

        <main className="px-4 pb-10 pt-6 sm:px-7 lg:px-10">
          <div className="mx-auto w-full max-w-[1500px]">{children}</div>
        </main>
      </div>

      <AnimatePresence>
        {mobileMenuOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="إغلاق القائمة"
              onClick={() => setMobileMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#06192f]/35 backdrop-blur-[2px] lg:hidden"
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 right-0 z-[60] w-[86%] max-w-[350px] overflow-hidden bg-[#0b2746] p-5 lg:hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_12%,rgba(22,166,201,.19),transparent_28%),linear-gradient(180deg,#0d2b4e,#071a31)]" />

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="absolute left-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-[13px] bg-white/[0.08] text-white transition hover:bg-white/[0.12]"
                aria-label="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>

              {sidebar}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
