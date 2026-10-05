"use client";

import AppShell from "@/components/app/AppShell";
import { ApiError, apiRequest } from "@/lib/api";
import { getAuthToken, removeAuthToken } from "@/lib/auth";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  CircleX,
  Clock3,
  Droplets,
  Filter,
  MapPin,
  PackageCheck,
  Search,
  Snowflake,
  TimerReset,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Order = {
  id: number;
  order_number: string;
  cooler_id: number | null;
  service_code: string;
  service_name: string;
  quantity: string | null;
  unit: string | null;
  total_amount: string;
  currency: string;
  priority: "standard" | "urgent";
  preferred_date: string | null;
  preferred_time_slot: string | null;
  status:
    | "pending"
    | "confirmed"
    | "in_progress"
    | "completed"
    | "cancelled";
  payment_status: string;
  created_at: string;
  cooler?: {
    id: number;
    name: string;
  } | null;
  address?: {
    id: number;
    label: string;
    city: string;
    district: string;
    street: string;
  } | null;
};

type OrdersResponse = {
  success: true;
  data: {
    orders: Order[];
  };
};

type FilterMode =
  | "all"
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

const filters: {
  value: FilterMode;
  label: string;
}[] = [
  {
    value: "all",
    label: "الكل",
  },
  {
    value: "pending",
    label: "جديدة",
  },
  {
    value: "confirmed",
    label: "مؤكدة",
  },
  {
    value: "in_progress",
    label: "قيد التنفيذ",
  },
  {
    value: "completed",
    label: "مكتملة",
  },
  {
    value: "cancelled",
    label: "ملغاة",
  },
];

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState<FilterMode>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    async function loadOrders() {
      try {
        const response = await apiRequest<OrdersResponse>(
          "/orders",
          {
            token,
          }
        );

        setOrders(response.data.orders);
      } catch (exception) {
        if (
          exception instanceof ApiError &&
          exception.status === 401
        ) {
          removeAuthToken();
          router.replace("/login");
          return;
        }

        setError("تعذر تحميل الطلبات");
      } finally {
        setLoading(false);
      }
    }

    void loadOrders();
  }, [router]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesFilter =
        filter === "all" ||
        order.status === filter;

      const matchesSearch =
        !query ||
        order.order_number
          .toLowerCase()
          .includes(query) ||
        order.service_name
          .toLowerCase()
          .includes(query) ||
        order.cooler?.name
          ?.toLowerCase()
          .includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [filter, orders, search]);

  const activeCount = orders.filter((order) =>
    [
      "pending",
      "confirmed",
      "in_progress",
    ].includes(order.status)
  ).length;

  const completedCount = orders.filter(
    (order) => order.status === "completed"
  ).length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f9fb]">
        <div className="flex flex-col items-center">
          <span className="h-11 w-11 animate-spin rounded-full border-[3px] border-[#d4e8ed] border-t-[#16a6c9]" />

          <p className="mt-4 text-sm font-extrabold text-[#718197]">
            جاري تحميل طلباتك...
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
          className="relative overflow-hidden rounded-[30px] bg-[#0d2b4e] px-5 py-7 shadow-[0_24px_70px_rgba(13,43,78,.15)] sm:px-8 lg:px-10"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(22,166,201,.30),transparent_30%),linear-gradient(135deg,#123d67,#0d2b4e_55%,#081f39)]" />

          <motion.div
            className="absolute -left-24 -top-24 h-72 w-72 rounded-full border border-white/[0.06]"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 45,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-2 text-[11px] font-extrabold text-[#70dff5]">
                <PackageCheck className="h-4 w-4" />
                متابعة الطلبات
              </div>

              <h1 className="mt-4 text-[30px] font-extrabold text-white sm:text-[36px]">
                طلباتي
              </h1>

              <p className="mt-3 max-w-xl text-sm font-bold leading-7 text-white/55">
                تابع حالة طلبات التعبئة والصيانة
                والفلاتر من مكان واحد.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex">
              <HeroStat
                label="طلبات نشطة"
                value={activeCount}
              />

              <HeroStat
                label="طلبات مكتملة"
                value={completedCount}
              />
            </div>
          </div>
        </motion.section>

        {error ? (
          <div className="mt-5 rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            {error}
          </div>
        ) : null}

        <section className="mt-7 rounded-[25px] border border-[#e0ecef] bg-white p-4 shadow-[0_10px_35px_rgba(13,43,78,.04)] sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-[390px]">
              <Search className="absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#94a6b2]" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="ابحث برقم الطلب أو الخدمة..."
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
                      setFilter(item.value)
                    }
                    className={`shrink-0 rounded-[13px] px-4 py-2.5 text-[11px] font-extrabold transition ${
                      active
                        ? "bg-[#0d2b4e] text-white"
                        : "bg-[#f2f7f9] text-[#8295a2] hover:text-[#0d2b4e]"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {orders.length === 0 ? (
          <EmptyOrders />
        ) : filteredOrders.length === 0 ? (
          <div className="mt-6 rounded-[27px] border border-dashed border-[#d6e5e9] bg-white px-6 py-16 text-center">
            <Search className="mx-auto h-8 w-8 text-[#9aabb5]" />

            <h2 className="mt-4 text-base font-extrabold text-[#0d2b4e]">
              لا توجد نتائج
            </h2>

            <p className="mt-2 text-xs font-bold text-[#8799a6]">
              جرّب تغيير البحث أو حالة الطلب.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filteredOrders.map((order, index) => (
              <OrderCard
                key={order.id}
                order={order}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function HeroStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="min-w-[135px] rounded-[18px] border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-xl">
      <p className="text-[10px] font-bold text-white/40">
        {label}
      </p>

      <p className="mt-1 text-xl font-extrabold text-white">
        {value}
      </p>
    </div>
  );
}

function OrderCard({
  order,
  index,
}: {
  order: Order;
  index: number;
}) {
  const icon = getServiceIcon(order.service_code);

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 14,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: index * 0.04,
      }}
      className="group rounded-[25px] border border-[#e0ecef] bg-white p-4 shadow-[0_10px_35px_rgba(13,43,78,.045)] transition hover:border-[#bfe3eb] hover:shadow-[0_16px_42px_rgba(13,43,78,.075)] sm:p-5"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-[17px] bg-[#eaf8fb] text-[#16a6c9]">
            {icon}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-extrabold text-[#0d2b4e]">
                {order.service_name}
              </h2>

              <StatusBadge status={order.status} />

              {order.priority === "urgent" ? (
                <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[9px] font-extrabold text-orange-600">
                  عاجل
                </span>
              ) : null}
            </div>

            <p
              dir="ltr"
              className="mt-1.5 w-fit text-[10px] font-extrabold text-[#8b9da9]"
            >
              {order.order_number}
            </p>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-bold text-[#8094a2]">
              {order.cooler ? (
                <span className="flex items-center gap-1.5">
                  <Snowflake className="h-3.5 w-3.5 text-[#16a6c9]" />
                  {order.cooler.name}
                </span>
              ) : null}

              {order.address ? (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#16a6c9]" />
                  {order.address.label}
                </span>
              ) : null}

              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-[#16a6c9]" />
                {order.preferred_date
                  ? formatDate(order.preferred_date)
                  : formatDate(order.created_at)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[410px]">
          <MiniInfo
            label="الدفع"
            value={getPaymentLabel(
              order.payment_status
            )}
          />

          <MiniInfo
            label="القيمة"
            value={
              order.service_code === "maintenance"
                ? "حسب الخدمة"
                : `${Number(
                    order.total_amount
                  ).toFixed(2)} ر.س`
            }
          />

          <MiniInfo
            label="الوقت"
            value={getTimeLabel(
              order.preferred_time_slot
            )}
            hideMobile
          />
        </div>

        <Link
          href={`/orders/${order.id}`}
          className="flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-[14px] bg-[#f3f8fa] px-4 text-xs font-extrabold text-[#0d2b4e] transition group-hover:bg-[#0d2b4e] group-hover:text-white lg:w-auto"
        >
          التفاصيل
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </div>
    </motion.article>
  );
}

function MiniInfo({
  label,
  value,
  hideMobile,
}: {
  label: string;
  value: string;
  hideMobile?: boolean;
}) {
  return (
    <div
      className={`rounded-[15px] bg-[#f7fbfc] px-3 py-3 ${
        hideMobile ? "hidden sm:block" : ""
      }`}
    >
      <p className="text-[9px] font-bold text-[#91a2ad]">
        {label}
      </p>

      <p className="mt-1 truncate text-[11px] font-extrabold text-[#0d2b4e]">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: Order["status"];
}) {
  const config = {
    pending: {
      label: "جديد",
      className:
        "bg-amber-50 text-amber-700",
      icon: <Clock3 className="h-3 w-3" />,
    },

    confirmed: {
      label: "تم التأكيد",
      className:
        "bg-blue-50 text-blue-700",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },

    in_progress: {
      label: "قيد التنفيذ",
      className:
        "bg-[#e8f8fb] text-[#1289a7]",
      icon: <TimerReset className="h-3 w-3" />,
    },

    completed: {
      label: "مكتمل",
      className:
        "bg-emerald-50 text-emerald-700",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },

    cancelled: {
      label: "ملغي",
      className:
        "bg-red-50 text-red-600",
      icon: <CircleX className="h-3 w-3" />,
    },
  };

  const item = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-extrabold ${item.className}`}
    >
      {item.icon}
      {item.label}
    </span>
  );
}

function EmptyOrders() {
  return (
    <motion.section
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

      <div className="relative z-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[25px] bg-[#eaf8fb]">
          <PackageCheck className="h-8 w-8 text-[#16a6c9]" />
        </div>

        <h2 className="mt-5 text-xl font-extrabold text-[#0d2b4e]">
          لا توجد طلبات بعد
        </h2>

        <p className="mx-auto mt-3 max-w-md text-sm font-bold leading-7 text-[#8094a2]">
          عندما تطلب تعبئة أو صيانة أو خدمة فلتر،
          ستجد الطلب هنا ويمكنك متابعة حالته.
        </p>

        <Link
          href="/coolers"
          className="mx-auto mt-6 inline-flex h-[48px] items-center rounded-[15px] bg-[#0d2b4e] px-5 text-xs font-extrabold text-white"
        >
          الذهاب إلى براداتي
        </Link>
      </div>
    </motion.section>
  );
}

function getServiceIcon(code: string) {
  if (code === "water_refill") {
    return <Droplets className="h-6 w-6" />;
  }

  if (code === "maintenance") {
    return <Wrench className="h-6 w-6" />;
  }

  if (code === "filter_change") {
    return <Filter className="h-6 w-6" />;
  }

  return <PackageCheck className="h-6 w-6" />;
}

function getPaymentLabel(status: string) {
  if (status === "paid") {
    return "مدفوع";
  }

  if (status === "failed") {
    return "فشل الدفع";
  }

  if (status === "refunded") {
    return "مسترد";
  }

  return "بانتظار الدفع";
}

function getTimeLabel(value: string | null) {
  if (value === "morning") {
    return "صباحًا";
  }

  if (value === "noon") {
    return "ظهرًا";
  }

  if (value === "evening") {
    return "مساءً";
  }

  return "غير محدد";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}