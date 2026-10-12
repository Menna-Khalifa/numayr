"use client";

import { ApiError, apiRequest } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CircleDollarSign,
  Clock3,
  Filter,
  PackageCheck,
  RefreshCw,
  Search,
  SlidersHorizontal,
  UserRound,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Pagination<T> = {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
};

type Order = {
  id: number;
  order_number?: string | null;
  service_code?: string | null;
  service_name?: string | null;
  status: string;
  payment_status?: string | null;
  priority?: string | null;
  total_amount?: number | string | null;
  currency?: string | null;
  created_at?: string | null;
  preferred_date?: string | null;
  preferred_time_slot?: string | null;
  user?: {
    id: number;
    name: string;
    email: string;
    phone: string;
  } | null;
  cooler?: {
    id: number;
    name?: string | null;
  } | null;
};

type OrdersResponse = {
  success: true;
  data: {
    orders: Pagination<Order>;
  };
};

const statuses = [
  { value: "", label: "كل الحالات" },
  { value: "pending", label: "جديد" },
  { value: "confirmed", label: "مؤكد" },
  { value: "in_progress", label: "جاري التنفيذ" },
  { value: "completed", label: "مكتمل" },
  { value: "cancelled", label: "ملغي" },
];

const paymentStatuses = [
  { value: "", label: "كل حالات الدفع" },
  { value: "pending", label: "بانتظار الدفع" },
  { value: "processing", label: "قيد المعالجة" },
  { value: "paid", label: "مدفوع" },
  { value: "failed", label: "فشل الدفع" },
  { value: "refunded", label: "مسترد" },
];

const statusMeta: Record<string, { label: string; className: string }> = {
  pending: {
    label: "جديد",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  confirmed: {
    label: "مؤكد",
    className: "bg-sky-50 text-sky-700 ring-sky-200",
  },
  in_progress: {
    label: "جاري التنفيذ",
    className: "bg-violet-50 text-violet-700 ring-violet-200",
  },
  completed: {
    label: "مكتمل",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  cancelled: {
    label: "ملغي",
    className: "bg-red-50 text-red-700 ring-red-200",
  },
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatMoney(value?: number | string | null, currency?: string | null) {
  const amount = Number(value ?? 0);

  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)} ${currency || "SAR"}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Pagination<Order> | null>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    const token = getAuthToken();

    if (!token) return;

    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    params.set("per_page", "15");
    params.set("page", String(page));

    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (paymentStatus) params.set("payment_status", paymentStatus);

    try {
      const response = await apiRequest<OrdersResponse>(
        `/admin/orders?${params.toString()}`,
        { token },
      );

      setOrders(response.data.orders);
    } catch (exception) {
      if (exception instanceof ApiError) {
        setError(exception.message);
      } else {
        setError("تعذر تحميل الطلبات");
      }
    } finally {
      setLoading(false);
    }
  }, [page, paymentStatus, search, status]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(query.trim());
  }

  function clearFilters() {
    setQuery("");
    setSearch("");
    setStatus("");
    setPaymentStatus("");
    setPage(1);
  }

  const hasFilters = Boolean(search || status || paymentStatus);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(125deg,#0d2b4e_0%,#123e68_58%,#0d607a_100%)] p-6 shadow-[0_24px_70px_rgba(13,43,78,.12)] sm:p-8">
        <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-[#16a6c9]/20 blur-[70px]" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-extrabold text-[#72e0f5]">
              <PackageCheck className="h-3.5 w-3.5" />
              مركز إدارة الطلبات
            </span>

            <h1 className="mt-4 text-[27px] font-extrabold leading-[1.45] text-white sm:text-[32px]">
              كل طلبات نمير في مكان واحد
            </h1>

            <p className="mt-2 max-w-2xl text-[13px] font-bold leading-7 text-white/70 sm:text-sm">
              تابع الطلبات الجديدة وحالة التنفيذ والدفع، وافتح تفاصيل أي طلب لإدارته.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadOrders()}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-[14px] border border-white/10 bg-white/[0.08] px-4 text-xs font-extrabold text-white transition hover:bg-white/[0.14] disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </button>
        </div>
      </section>

      <section className="rounded-[25px] border border-[#dfecef] bg-white p-4 shadow-[0_12px_34px_rgba(13,43,78,.045)] sm:p-5">
        <div className="mb-4 flex items-center gap-2 text-[#0d2b4e]">
          <SlidersHorizontal className="h-[18px] w-[18px] text-[#16a6c9]" />
          <h2 className="text-sm font-extrabold">البحث والتصفية</h2>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1.4fr_.8fr_.8fr_auto]">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute right-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#93a6b2]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="رقم الطلب أو اسم الخدمة"
              className="h-12 w-full rounded-[16px] border border-[#dce9ed] bg-[#fbfdfe] pr-11 pl-4 text-[13px] font-bold text-[#0d2b4e] outline-none transition placeholder:text-[#9babb5] focus:border-[#16a6c9] focus:shadow-[0_0_0_4px_rgba(22,166,201,.08)]"
            />
          </form>

          <select
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
            className="h-12 rounded-[16px] border border-[#dce9ed] bg-[#fbfdfe] px-4 text-[12px] font-extrabold text-[#38536a] outline-none focus:border-[#16a6c9]"
          >
            {statuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={paymentStatus}
            onChange={(event) => {
              setPage(1);
              setPaymentStatus(event.target.value);
            }}
            className="h-12 rounded-[16px] border border-[#dce9ed] bg-[#fbfdfe] px-4 text-[12px] font-extrabold text-[#38536a] outline-none focus:border-[#16a6c9]"
          >
            {paymentStatuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setPage(1);
                setSearch(query.trim());
              }}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-[16px] bg-[#0d2b4e] px-5 text-xs font-extrabold text-white transition hover:bg-[#123e68] xl:flex-none"
            >
              <Filter className="h-4 w-4" />
              تطبيق
            </button>

            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-12 items-center justify-center rounded-[16px] border border-[#dce9ed] bg-white px-4 text-xs font-extrabold text-[#708491] transition hover:bg-[#f6fafb]"
              >
                مسح
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-[22px] border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
          {error}
        </section>
      ) : null}

      <section className="overflow-hidden rounded-[26px] border border-[#dfecef] bg-white shadow-[0_14px_38px_rgba(13,43,78,.04)]">
        <div className="flex items-center justify-between border-b border-[#edf2f4] px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-[15px] font-extrabold text-[#0d2b4e]">
              الطلبات
            </h2>
            <p className="mt-1 text-[10px] font-bold text-[#94a5af]">
              {orders ? `${formatNumber(orders.total)} طلب` : "جاري التحميل..."}
            </p>
          </div>
        </div>

        {loading && !orders ? (
          <div className="grid min-h-[360px] place-items-center">
            <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#d9e8ec] border-t-[#16a6c9]" />
          </div>
        ) : orders?.data.length ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1050px] border-collapse text-right">
                <thead>
                  <tr className="border-b border-[#edf2f4] bg-[#f8fbfc] text-[10px] font-extrabold text-[#879aa7]">
                    <th className="px-5 py-4">رقم الطلب</th>
                    <th className="px-5 py-4">العميل</th>
                    <th className="px-5 py-4">الخدمة</th>
                    <th className="px-5 py-4">البرادة</th>
                    <th className="px-5 py-4">الحالة</th>
                    <th className="px-5 py-4">الدفع</th>
                    <th className="px-5 py-4">الإجمالي</th>
                    <th className="px-5 py-4">التاريخ</th>
                    <th className="px-5 py-4" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#edf2f4]">
                  {orders.data.map((order) => {
                    const meta = statusMeta[order.status] || {
                      label: order.status,
                      className:
                        "bg-slate-50 text-slate-700 ring-slate-200",
                    };

                    return (
                      <tr
                        key={order.id}
                        className="transition hover:bg-[#fbfdfe]"
                      >
                        <td className="px-5 py-4">
                          <p className="text-[11px] font-black tabular-nums text-[#0d2b4e]">
                            {order.order_number || `#${order.id}`}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-[11px] font-extrabold text-[#29475f]">
                            {order.user?.name || "—"}
                          </p>
                          <p className="mt-1 text-[9px] font-bold tabular-nums text-[#98a8b2]">
                            {order.user?.phone || "—"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-[11px] font-extrabold text-[#38536a]">
                          {order.service_name || order.service_code || "—"}
                        </td>

                        <td className="px-5 py-4 text-[11px] font-bold text-[#718592]">
                          {order.cooler?.name || "—"}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1.5 text-[9px] font-extrabold ring-1 ${meta.className}`}
                          >
                            {meta.label}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`text-[10px] font-extrabold ${
                              order.payment_status === "paid"
                                ? "text-emerald-600"
                                : "text-amber-600"
                            }`}
                          >
                            {order.payment_status === "paid"
                              ? "مدفوع"
                              : "بانتظار الدفع"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-[10px] font-black tabular-nums text-[#0d2b4e]">
                          {formatMoney(order.total_amount, order.currency)}
                        </td>

                        <td className="px-5 py-4 text-[10px] font-bold text-[#8597a3]">
                          {formatDate(order.created_at)}
                        </td>

                        <td className="px-5 py-4">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="inline-flex h-9 items-center gap-1.5 rounded-[12px] bg-[#eaf8fb] px-3 text-[10px] font-extrabold text-[#108baa] transition hover:bg-[#16a6c9] hover:text-white"
                          >
                            التفاصيل
                            <ArrowLeft className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-[#edf2f4] lg:hidden">
              {orders.data.map((order) => {
                const meta = statusMeta[order.status] || {
                  label: order.status,
                  className: "bg-slate-50 text-slate-700 ring-slate-200",
                };

                return (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="block p-5 transition hover:bg-[#fbfdfe]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[11px] font-black tabular-nums text-[#0d2b4e]">
                            {order.order_number || `#${order.id}`}
                          </p>
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-[9px] font-extrabold ring-1 ${meta.className}`}
                          >
                            {meta.label}
                          </span>
                        </div>

                        <p className="mt-2 truncate text-[13px] font-extrabold text-[#29475f]">
                          {order.service_name || "طلب خدمة"}
                        </p>

                        <p className="mt-1 text-[10px] font-bold text-[#8ea0ab]">
                          {order.user?.name || "عميل"} ·{" "}
                          {order.cooler?.name || "بدون برادة"}
                        </p>
                      </div>

                      <ArrowLeft className="mt-1 h-4 w-4 shrink-0 text-[#16a6c9]" />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-[15px] bg-[#f7fafb] p-3">
                      <div>
                        <p className="text-[9px] font-bold text-[#97a7b1]">
                          الإجمالي
                        </p>
                        <p className="mt-1 text-[10px] font-black tabular-nums text-[#0d2b4e]">
                          {formatMoney(order.total_amount, order.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-[#97a7b1]">
                          التاريخ
                        </p>
                        <p className="mt-1 text-[10px] font-extrabold text-[#506b7d]">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 border-t border-[#edf2f4] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-[10px] font-bold text-[#91a2ad]">
                صفحة {formatNumber(orders.current_page)} من{" "}
                {formatNumber(orders.last_page)}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={orders.current_page <= 1 || loading}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="h-10 rounded-[13px] border border-[#dce9ed] bg-white px-4 text-[10px] font-extrabold text-[#38536a] transition hover:bg-[#f5fafb] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  السابق
                </button>

                <button
                  type="button"
                  disabled={
                    orders.current_page >= orders.last_page || loading
                  }
                  onClick={() => setPage((current) => current + 1)}
                  className="h-10 rounded-[13px] bg-[#0d2b4e] px-4 text-[10px] font-extrabold text-white transition hover:bg-[#123e68] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  التالي
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="grid min-h-[360px] place-items-center px-5 py-12 text-center">
            <div>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#edf8fa] text-[#16a6c9]">
                <PackageCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-extrabold text-[#0d2b4e]">
                لا توجد طلبات مطابقة
              </h3>
              <p className="mt-2 text-xs font-bold leading-6 text-[#8da0ab]">
                غيّر البحث أو الفلاتر وحاول مرة أخرى.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
