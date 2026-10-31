"use client";

import AppShell from "@/components/app/AppShell";
import { ApiError, apiRequest } from "@/lib/api";
import { getAuthToken, removeAuthToken } from "@/lib/auth";
import { motion } from "framer-motion";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  ChevronLeft,
  CircleDollarSign,
  CreditCard,
  Inbox,
  PackageCheck,
  Search,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type NotificationData = {
  order_id?: number;
  cooler_id?: number;
  customer_id?: number;
  order_number?: string;
  payment_id?: number;
  subscription_id?: number;
  plan_code?: string;
  status?: string;
  payment_status?: string;
  subscription_status?: string;
  amount?: string;
  currency?: string;
  [key: string]: unknown;
};

type Notification = {
  id: number;
  user_id: number;
  type: string;
  title: string;
  body: string;
  data: NotificationData | null;
  channels: string[];
  read_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

type Pagination<T> = {
  current_page: number;
  data: T[];
  last_page: number;
  total: number;
};

type NotificationsResponse = {
  success: true;
  data: {
    notifications:
      | Pagination<Notification>
      | Notification[];
    unread_count: number;
  };
};

type MarkOneResponse = {
  success: true;
  message: string;
  data: {
    notification: Notification;
  };
};

type MarkAllResponse = {
  success: true;
  message: string;
  data: {
    updated_count: number;
  };
};

type FilterMode =
  | "all"
  | "unread"
  | "order_status"
  | "payment"
  | "subscription";

const filters: {
  value: FilterMode;
  label: string;
}[] = [
  {
    value: "all",
    label: "الكل",
  },
  {
    value: "unread",
    label: "غير المقروءة",
  },
  {
    value: "order_status",
    label: "الطلبات",
  },
  {
    value: "payment",
    label: "الدفع",
  },
  {
    value: "subscription",
    label: "الاشتراكات",
  },
];

export default function NotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  const [unreadCount, setUnreadCount] = useState(0);
  const [nextPage, setNextPage] = useState(2);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [loading, setLoading] = useState(true);
  const [readingId, setReadingId] =
    useState<number | null>(null);
  const [readingAll, setReadingAll] = useState(false);

  const [filter, setFilter] =
    useState<FilterMode>("all");

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    async function loadNotifications() {
      try {
        const response =
          await apiRequest<NotificationsResponse>(
            "/notifications?per_page=100",
            {
              token,
            }
          );

        const payload =
          response.data.notifications;

        if (Array.isArray(payload)) {
          setNotifications(payload);
        } else if (
          payload &&
          Array.isArray(payload.data)
        ) {
          setNotifications(payload.data);
          setHasMore(payload.current_page < payload.last_page);
          setNextPage(payload.current_page + 1);
        } else {
          setNotifications([]);
        }

        setUnreadCount(
          response.data.unread_count ?? 0
        );
      } catch (exception) {
        if (
          exception instanceof ApiError &&
          exception.status === 401
        ) {
          removeAuthToken();
          router.replace("/login");
          return;
        }

        setError(
          "تعذر تحميل الإشعارات"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadNotifications();
  }, [router]);

  const filteredNotifications = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return notifications.filter(
      (notification) => {
        let matchesFilter = true;

        if (filter === "unread") {
          matchesFilter =
            notification.read_at === null;
        } else if (filter !== "all") {
          matchesFilter =
            notification.type === filter;
        }

        const matchesSearch =
          !query ||
          notification.title
            .toLowerCase()
            .includes(query) ||
          notification.body
            .toLowerCase()
            .includes(query) ||
          String(
            notification.data
              ?.order_number ?? ""
          )
            .toLowerCase()
            .includes(query);

        return (
          matchesFilter &&
          matchesSearch
        );
      }
    );
  }, [filter, notifications, search]);

  async function markAsRead(
    notification: Notification,
    navigate = false
  ) {
    const token = getAuthToken();

    if (!token) {
      return;
    }

    setError("");
    setMessage("");

    if (!notification.read_at) {
      setReadingId(notification.id);

      try {
        const response =
          await apiRequest<MarkOneResponse>(
            `/notifications/${notification.id}/read`,
            {
              method: "PATCH",
              token,
            }
          );

        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? response.data.notification
              : item
          )
        );

        setUnreadCount((current) =>
          Math.max(0, current - 1)
        );

        window.dispatchEvent(
  new Event(
    "numayr:notifications-updated"
  )
);
      } catch (exception) {
        if (exception instanceof ApiError) {
          setError(exception.message);
        } else {
          setError(
            "تعذر تحديث الإشعار"
          );
        }

        setReadingId(null);
        return;
      } finally {
        setReadingId(null);
      }
    }

    if (navigate) {
      openNotification(notification);
    }
  }

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    const token = getAuthToken();
    if (!token) { router.replace("/login"); return; }
    setLoadingMore(true);
    try {
      const result = await apiRequest<NotificationsResponse>(
        `/notifications?per_page=100&page=${nextPage}`, { token }
      );
      const payload = result.data.notifications;
      if (!Array.isArray(payload)) {
        setNotifications((current) => {
          const ids = new Set(current.map((item) => item.id));
          return [...current, ...payload.data.filter((item) => !ids.has(item.id))];
        });
        setHasMore(payload.current_page < payload.last_page);
        setNextPage(payload.current_page + 1);
      } else {
        setHasMore(false);
      }
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : "تعذر تحميل بقية الإشعارات");
    } finally {
      setLoadingMore(false);
    }
  }

  async function markAllAsRead() {
    const token = getAuthToken();

    if (!token || unreadCount === 0) {
      return;
    }

    setReadingAll(true);
    setError("");
    setMessage("");

    try {
      const response =
        await apiRequest<MarkAllResponse>(
          "/notifications/read-all",
          {
            method: "PATCH",
            token,
          }
        );

      const now =
        new Date().toISOString();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read_at:
            notification.read_at ?? now,
        }))
      );

      setUnreadCount(0);

      window.dispatchEvent(
  new Event(
    "numayr:notifications-updated"
  )
);

      setMessage(
        response.data.updated_count > 0
          ? `تم تحديد ${response.data.updated_count} إشعار كمقروء`
          : "لا توجد إشعارات جديدة"
      );
    } catch (exception) {
      if (exception instanceof ApiError) {
        setError(exception.message);
      } else {
        setError(
          "تعذر تحديث الإشعارات"
        );
      }
    } finally {
      setReadingAll(false);
    }
  }

  function openNotification(
    notification: Notification
  ) {
    const data =
      notification.data ?? {};

    if (data.order_id) {
      router.push(
        `/orders/${data.order_id}`
      );
      return;
    }

    if (data.cooler_id) {
      router.push(data.customer_id ? `/admin/coolers/${data.cooler_id}` : `/coolers/${data.cooler_id}`);
      return;
    }

    if (notification.type === "customer_registration") {
      router.push("/admin/customers");
      return;
    }

    if (
      notification.type ===
        "subscription" ||
      data.subscription_id
    ) {
      router.push("/subscriptions");
      return;
    }

    if (
      notification.type ===
      "payment"
    ) {
      router.push("/orders");
      return;
    }

    // Never leave a clickable notification without a destination.
    router.push("/coolers");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f9fb]">
        <div className="flex flex-col items-center">
          <span className="h-11 w-11 animate-spin rounded-full border-[3px] border-[#d4e8ed] border-t-[#16a6c9]" />

          <p className="mt-4 text-sm font-extrabold text-[#718197]">
            جاري تحميل الإشعارات...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[1500px]">
        <motion.section
          initial={{
            opacity: 0,
            y: 16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="relative overflow-hidden rounded-[30px] bg-[#0d2b4e] px-5 py-8 shadow-[0_24px_70px_rgba(13,43,78,.15)] sm:px-8 lg:px-10"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(22,166,201,.32),transparent_30%),radial-gradient(circle_at_90%_100%,rgba(54,214,243,.10),transparent_30%),linear-gradient(135deg,#123d67,#0d2b4e_55%,#081f39)]" />

          <motion.div
            className="absolute -left-24 -top-24 h-72 w-72 rounded-full border border-white/[0.06]"
            animate={{
              scale: [
                0.94,
                1.05,
                0.94,
              ],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-2 text-[11px] font-extrabold text-[#70dff5]">
                <BellRing className="h-4 w-4" />
                مركز التنبيهات
              </div>

              <h1 className="mt-4 text-[30px] font-extrabold text-white sm:text-[36px]">
                إشعاراتي
              </h1>

              <p className="mt-3 max-w-xl text-sm font-bold leading-7 text-white/55">
                تابع تحديثات الطلبات
                والمدفوعات والاشتراكات في
                مكان واحد.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="min-w-[130px] rounded-[18px] border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-xl">
                <p className="text-[10px] font-bold text-white/40">
                  غير مقروءة
                </p>

                <p className="mt-1 text-xl font-extrabold text-white">
                  {unreadCount}
                </p>
              </div>

              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={() =>
                    void markAllAsRead()
                  }
                  disabled={readingAll}
                  className="flex h-[54px] items-center gap-2 rounded-[17px] bg-white px-4 text-xs font-extrabold text-[#0d2b4e] disabled:opacity-60"
                >
                  <CheckCheck className="h-4 w-4 text-[#16a6c9]" />

                  {readingAll
                    ? "جاري التحديث..."
                    : "قراءة الكل"}
                </button>
              ) : null}
            </div>
          </div>
        </motion.section>

        {error ? (
          <div className="mt-5 rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mt-5 rounded-[18px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {message}
          </div>
        ) : null}

        <section className="mt-7 rounded-[25px] border border-[#e0ecef] bg-white p-4 shadow-[0_10px_35px_rgba(13,43,78,.04)] sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-[390px]">
              <Search className="absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#94a6b2]" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="ابحث في الإشعارات..."
                className="h-[50px] w-full rounded-[16px] border border-[#dfeaed] bg-[#f9fcfd] pr-11 pl-4 text-sm font-bold text-[#0d2b4e] outline-none focus:border-[#16a6c9]"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {filters.map((item) => {
                const active =
                  filter === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() =>
                      setFilter(
                        item.value
                      )
                    }
                    className={`shrink-0 rounded-[13px] px-4 py-2.5 text-[11px] font-extrabold transition ${
                      active
                        ? "bg-[#0d2b4e] text-white"
                        : "bg-[#f2f7f9] text-[#8295a2]"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {notifications.length === 0 ? (
          <EmptyNotifications />
        ) : filteredNotifications.length ===
          0 ? (
          <div className="mt-6 rounded-[28px] border border-dashed border-[#d6e5e9] bg-white px-6 py-16 text-center">
            <Search className="mx-auto h-8 w-8 text-[#9aabb5]" />

            <h2 className="mt-4 text-base font-extrabold text-[#0d2b4e]">
              لا توجد نتائج
            </h2>

            <p className="mt-2 text-xs font-bold text-[#8799a6]">
              جرّب تغيير البحث أو نوع
              الإشعار.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {filteredNotifications.map(
              (notification, index) => (
                <NotificationCard
                  key={notification.id}
                  notification={
                    notification
                  }
                  index={index}
                  reading={
                    readingId ===
                    notification.id
                  }
                  onRead={() =>
                    void markAsRead(
                      notification
                    )
                  }
                  onOpen={() =>
                    void markAsRead(
                      notification,
                      true
                    )
                  }
                />
              )
            )}
          </div>
        )}
        {hasMore && !loading ? (
          <div className="mt-6 flex justify-center">
            <button type="button" onClick={() => void loadMore()} disabled={loadingMore}
              className="rounded-2xl border border-[#c9e3e9] bg-white px-7 py-3 text-xs font-extrabold text-[#0d2b4e] disabled:opacity-50">
              {loadingMore ? "جاري تحميل المزيد..." : "عرض إشعارات أقدم"}
            </button>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

function NotificationCard({
  notification,
  index,
  reading,
  onRead,
  onOpen,
}: {
  notification: Notification;
  index: number;
  reading: boolean;
  onRead: () => void;
  onOpen: () => void;
}) {
  const unread =
    notification.read_at === null;

  const presentation =
    getNotificationPresentation(
      notification.type
    );

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: index * 0.035,
      }}
      className={`relative overflow-hidden rounded-[23px] border p-4 transition sm:p-5 ${
        unread
          ? "border-[#bfe4ec] bg-[linear-gradient(110deg,#ffffff,#f3fbfd)] shadow-[0_12px_36px_rgba(22,166,201,.07)]"
          : "border-[#e1ecef] bg-white shadow-[0_8px_28px_rgba(13,43,78,.035)]"
      }`}
    >
      {unread ? (
        <span className="absolute right-0 top-0 h-full w-[3px] bg-[#16a6c9]" />
      ) : null}

      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] ${presentation.className}`}
        >
          {presentation.icon}
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 text-right"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-extrabold text-[#0d2b4e]">
              {notification.title}
            </h2>

            {unread ? (
              <span className="h-2 w-2 rounded-full bg-[#16a6c9] shadow-[0_0_0_4px_rgba(22,166,201,.10)]" />
            ) : null}
          </div>

          <p className="mt-2 text-xs font-bold leading-6 text-[#7f929f]">
            {notification.body}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-bold text-[#9aabb5]">
              {formatRelativeDate(
                notification.created_at
              )}
            </span>

            {notification.data
              ?.order_number ? (
              <span
                dir="ltr"
                className="text-[9px] font-extrabold text-[#16a6c9]"
              >
                {
                  notification.data
                    .order_number
                }
              </span>
            ) : null}
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          {unread ? (
            <button
              type="button"
              onClick={onRead}
              disabled={reading}
              title="تحديد كمقروء"
              className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-[#dbe8ec] bg-white text-[#16a6c9] transition hover:bg-[#eaf8fb] disabled:opacity-50"
            >
              {reading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#16a6c9]/20 border-t-[#16a6c9]" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </button>
          ) : null}

          <button
            type="button"
            onClick={onOpen}
            className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#f2f7f9] text-[#8396a3] transition hover:bg-[#0d2b4e] hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function EmptyNotifications() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 18,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="relative mt-7 overflow-hidden rounded-[30px] border border-[#deebef] bg-white px-6 py-16 text-center shadow-[0_18px_60px_rgba(13,43,78,.05)]"
    >
      <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-[#16a6c9]/8 blur-[80px]" />

      <div className="relative">
        <motion.div
          animate={{
            rotate: [-4, 4, -4],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-[25px] bg-[#eaf8fb]"
        >
          <Bell className="h-8 w-8 text-[#16a6c9]" />
        </motion.div>

        <h2 className="mt-5 text-xl font-extrabold text-[#0d2b4e]">
          لا توجد إشعارات حتى الآن
        </h2>

        <p className="mx-auto mt-3 max-w-md text-sm font-bold leading-7 text-[#8094a2]">
          عندما يحدث تحديث على طلباتك أو
          اشتراكك ستظهر التنبيهات هنا.
        </p>
      </div>
    </motion.div>
  );
}

function getNotificationPresentation(
  type: string
) {
  if (type === "order_status") {
    return {
      icon: (
        <PackageCheck className="h-5 w-5" />
      ),
      className:
        "bg-[#eaf8fb] text-[#16a6c9]",
    };
  }

  if (type === "payment") {
    return {
      icon: (
        <CreditCard className="h-5 w-5" />
      ),
      className:
        "bg-emerald-50 text-emerald-600",
    };
  }

  if (type === "subscription") {
    return {
      icon: (
        <Sparkles className="h-5 w-5" />
      ),
      className:
        "bg-violet-50 text-violet-600",
    };
  }

  return {
    icon: (
      <BellRing className="h-5 w-5" />
    ),
    className:
      "bg-[#f2f7f9] text-[#8296a3]",
  };
}

function formatRelativeDate(
  value: string
) {
  const date = new Date(value);
  const now = new Date();

  const diff =
    now.getTime() - date.getTime();

  const minutes = Math.floor(
    diff / 60_000
  );

  if (minutes < 1) {
    return "الآن";
  }

  if (minutes < 60) {
    return `منذ ${minutes} دقيقة`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  if (hours < 24) {
    return `منذ ${hours} ساعة`;
  }

  const days = Math.floor(
    hours / 24
  );

  if (days < 7) {
    return `منذ ${days} يوم`;
  }

  return new Intl.DateTimeFormat(
    "ar-SA",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  ).format(date);
}