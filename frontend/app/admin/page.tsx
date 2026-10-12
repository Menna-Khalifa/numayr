"use client";

import { ApiError, apiRequest } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Droplets,
  PackageCheck,
  ReceiptText,
  RefreshCw,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type DashboardResponse = {
  success: true;
  data: {
    stats: {
      customers: {
        total: number;
        active: number;
        inactive: number;
      };
      coolers: {
        total: number;
      };
      orders: {
        total: number;
        pending: number;
        confirmed: number;
        in_progress: number;
        completed: number;
        cancelled: number;
      };
      subscriptions: {
        total: number;
        active: number;
      };
      payments: {
        total: number;
        pending: number;
        processing: number;
        paid: number;
        failed: number;
        refunded: number;
      };
    };
    daily_orders: Array<{
      date: string;
      label: string;
      total: number;
    }>;
    service_distribution: Array<{
      service_code: string | null;
      service_name: string | null;
      total: number;
    }>;
    recent_orders: Array<{
      id: number;
      order_number?: string | null;
      service_name?: string | null;
      status: string;
      created_at?: string | null;
      user?: {
        id: number;
        name: string;
        phone: string;
        email: string;
      } | null;
      cooler?: {
        id: number;
        name?: string | null;
      } | null;
    }>;
    recent_customers: Array<{
      id: number;
      name: string;
      email: string;
      phone: string;
      is_active: boolean;
      created_at: string;
      coolers_count: number;
      orders_count: number;
    }>;
  };
};

const statusMeta: Record<
  string,
  { label: string; className: string }
> = {
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

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function date(value?: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    const token = getAuthToken();

    if (!token) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<DashboardResponse>(
        "/admin/dashboard",
        { token },
      );
      setData(response.data);
    } catch (exception) {
      if (exception instanceof ApiError) {
        setError(exception.message);
      } else {
        setError("تعذر تحميل بيانات لوحة الإدارة");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const maxDaily = useMemo(() => {
    if (!data?.daily_orders.length) {
      return 1;
    }

    return Math.max(
      1,
      ...data.daily_orders.map((item) => Number(item.total) || 0),
    );
  }, [data]);

  const maxService = useMemo(() => {
    if (!data?.service_distribution.length) {
      return 1;
    }

    return Math.max(
      1,
      ...data.service_distribution.map((item) => Number(item.total) || 0),
    );
  }, [data]);

  if (loading && !data) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="text-center">
          <span className="mx-auto block h-12 w-12 animate-spin rounded-full border-[3px] border-[#d9e8ec] border-t-[#16a6c9]" />
          <p className="mt-4 text-sm font-extrabold text-[#7f929e]">
            جاري تحميل بيانات لوحة الإدارة...
          </p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-xl rounded-[26px] border border-red-100 bg-white p-7 text-center shadow-sm">
        <XCircle className="mx-auto h-10 w-10 text-red-500" />
        <h2 className="mt-4 text-lg font-extrabold text-[#0d2b4e]">
          تعذر تحميل لوحة الإدارة
        </h2>
        <p className="mt-2 text-sm font-bold leading-7 text-[#7d919e]">
          {error}
        </p>
        <button
          type="button"
          onClick={() => void loadDashboard()}
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-[14px] bg-[#0d2b4e] px-5 text-xs font-extrabold text-white"
        >
          <RefreshCw className="h-4 w-4" />
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const stats = data.stats;

  const statCards = [
    {
      label: "إجمالي العملاء",
      value: stats.customers.total,
      helper: `${number(stats.customers.active)} نشط`,
      icon: Users,
    },
    {
      label: "إجمالي البرادات",
      value: stats.coolers.total,
      helper: "كل البرادات المسجلة",
      icon: Droplets,
    },
    {
      label: "إجمالي الطلبات",
      value: stats.orders.total,
      helper: `${number(stats.orders.pending)} طلب جديد`,
      icon: PackageCheck,
    },
    {
      label: "الاشتراكات النشطة",
      value: stats.subscriptions.active,
      helper: `من ${number(stats.subscriptions.total)} اشتراك`,
      icon: ReceiptText,
    },
  ];

  return (
    <div className="space-y-6 [text-rendering:optimizeLegibility]">
      <section className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(125deg,#0d2b4e_0%,#123e68_60%,#0c5c77_100%)] p-6 shadow-[0_24px_70px_rgba(13,43,78,.13)] sm:p-8">
        <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-[#16a6c9]/18 blur-[70px]" />
        <div className="pointer-events-none absolute -bottom-24 right-[20%] h-56 w-56 rounded-full bg-white/[0.04] blur-[50px]" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-extrabold text-[#72e0f5]">
              نظرة تشغيلية مباشرة
            </span>
            <h2 className="mt-4 text-[26px] font-extrabold leading-[1.45] text-white sm:text-[32px]">
              لوحة تحكم نمير
            </h2>
            <p className="mt-2 max-w-2xl text-[13px] font-bold leading-7 text-white/70 sm:text-sm">
              متابعة العملاء والبرادات والطلبات والاشتراكات من بيانات
              النظام الفعلية.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadDashboard()}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-[14px] border border-white/10 bg-white/[0.08] px-4 text-xs font-extrabold text-white transition hover:bg-white/[0.12] disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            تحديث البيانات
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;

          return (
            <motion.article
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="rounded-[24px] border border-[#e2ecef] bg-white p-5 shadow-[0_12px_34px_rgba(13,43,78,.045)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-extrabold text-[#91a2ad]">
                    {card.label}
                  </p>
                  <strong className="mt-2 block text-[30px] font-black tabular-nums tracking-normal text-[#0d2b4e]">
                    {number(card.value)}
                  </strong>
                  <p className="mt-1 text-[11px] font-bold text-[#8da0ac]">
                    {card.helper}
                  </p>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#eaf8fb] text-[#16a6c9]">
                  <Icon className="h-[22px] w-[22px]" />
                </div>
              </div>
            </motion.article>
          );
        })}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          {
            label: "جديدة",
            value: stats.orders.pending,
            icon: Clock3,
          },
          {
            label: "مؤكدة",
            value: stats.orders.confirmed,
            icon: CheckCircle2,
          },
          {
            label: "تحت التنفيذ",
            value: stats.orders.in_progress,
            icon: RefreshCw,
          },
          {
            label: "مكتملة",
            value: stats.orders.completed,
            icon: PackageCheck,
          },
          {
            label: "ملغاة",
            value: stats.orders.cancelled,
            icon: XCircle,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.label}
              className="flex items-center gap-3 rounded-[20px] border border-[#e4edf0] bg-white px-4 py-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#f1f8fa] text-[#16a6c9]">
                <Icon className="h-[18px] w-[18px]" />
              </div>
              <div>
                <strong className="block text-lg font-black tabular-nums text-[#0d2b4e]">
                  {number(item.value)}
                </strong>
                <span className="text-[10px] font-extrabold text-[#91a2ad]">
                  {item.label}
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_.85fr]">
        <article className="rounded-[26px] border border-[#e2ecef] bg-white p-5 shadow-[0_12px_36px_rgba(13,43,78,.04)] sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[16px] font-extrabold text-[#0d2b4e]">
                حركة الطلبات
              </h3>
              <p className="mt-1 text-[11px] font-bold text-[#96a6b0]">
                آخر 7 أيام
              </p>
            </div>
            <PackageCheck className="h-5 w-5 text-[#16a6c9]" />
          </div>

          <div className="mt-7 flex h-[230px] items-end gap-2 sm:gap-4">
            {data.daily_orders.map((item) => {
              const height =
                item.total === 0
                  ? 4
                  : Math.max(12, (item.total / maxDaily) * 100);

              return (
                <div
                  key={item.date}
                  className="flex min-w-0 flex-1 flex-col items-center justify-end"
                >
                  <span className="mb-2 text-[10px] font-extrabold tabular-nums text-[#637b8c]">
                    {number(item.total)}
                  </span>
                  <div className="flex h-[155px] w-full items-end justify-center rounded-[14px] bg-[#f4f8fa] px-1.5 pb-1.5">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 0.65 }}
                      className="w-full max-w-[34px] rounded-[10px] bg-[linear-gradient(180deg,#39c7e3_0%,#16a6c9_100%)] shadow-[0_7px_18px_rgba(22,166,201,.18)]"
                    />
                  </div>
                  <span className="mt-2 truncate text-[10px] font-extrabold text-[#8b9da8]">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-[26px] border border-[#e2ecef] bg-white p-5 shadow-[0_12px_36px_rgba(13,43,78,.04)] sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[16px] font-extrabold text-[#0d2b4e]">
                توزيع الخدمات
              </h3>
              <p className="mt-1 text-[11px] font-bold text-[#96a6b0]">
                حسب الطلبات المسجلة
              </p>
            </div>
            <Droplets className="h-5 w-5 text-[#16a6c9]" />
          </div>

          <div className="mt-6 space-y-4">
            {data.service_distribution.length ? (
              data.service_distribution.map((item) => (
                <div key={`${item.service_code}-${item.service_name}`}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="truncate text-[12px] font-extrabold text-[#38536a]">
                      {item.service_name || item.service_code || "خدمة"}
                    </span>
                    <span className="text-[11px] font-black tabular-nums text-[#16a6c9]">
                      {number(item.total)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#eef4f6]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.max(
                          7,
                          (item.total / maxService) * 100,
                        )}%`,
                      }}
                      transition={{ duration: 0.65 }}
                      className="h-full rounded-full bg-[#16a6c9]"
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="py-12 text-center text-xs font-bold text-[#9aabb5]">
                لا توجد طلبات لعرض توزيع الخدمات بعد.
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="overflow-hidden rounded-[26px] border border-[#e2ecef] bg-white shadow-[0_12px_36px_rgba(13,43,78,.04)]">
          <div className="flex items-center justify-between border-b border-[#edf2f4] px-5 py-4 sm:px-6">
            <div>
              <h3 className="text-[15px] font-extrabold text-[#0d2b4e]">
                أحدث الطلبات
              </h3>
              <p className="mt-1 text-[10px] font-bold text-[#9aaab4]">
                آخر نشاط تم تسجيله
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#16a6c9]"
            >
              عرض الكل
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#edf2f4]">
            {data.recent_orders.length ? (
              data.recent_orders.map((order) => {
                const meta = statusMeta[order.status] || {
                  label: order.status,
                  className: "bg-slate-50 text-slate-700 ring-slate-200",
                };

                return (
                  <div
                    key={order.id}
                    className="flex items-center gap-3 px-5 py-4 sm:px-6"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#edf8fa] text-[#16a6c9]">
                      <PackageCheck className="h-[18px] w-[18px]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[12px] font-extrabold text-[#173b59]">
                          {order.service_name || "طلب خدمة"}
                        </p>
                        <span
                          className={`inline-flex shrink-0 rounded-full px-2 py-1 text-[9px] font-extrabold ring-1 ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-[10px] font-bold text-[#91a3ae]">
                        {order.user?.name || "عميل"} ·{" "}
                        {order.cooler?.name || "برادة"}
                      </p>
                    </div>

                    <div className="text-left">
                      <p className="text-[10px] font-black text-[#5e7788]">
                        {order.order_number || `#${order.id}`}
                      </p>
                      <p className="mt-1 text-[9px] font-bold text-[#a0afb8]">
                        {date(order.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="px-6 py-12 text-center text-xs font-bold text-[#9aabb5]">
                لا توجد طلبات حتى الآن.
              </p>
            )}
          </div>
        </article>

        <article className="overflow-hidden rounded-[26px] border border-[#e2ecef] bg-white shadow-[0_12px_36px_rgba(13,43,78,.04)]">
          <div className="flex items-center justify-between border-b border-[#edf2f4] px-5 py-4 sm:px-6">
            <div>
              <h3 className="text-[15px] font-extrabold text-[#0d2b4e]">
                أحدث العملاء
              </h3>
              <p className="mt-1 text-[10px] font-bold text-[#9aaab4]">
                أحدث الحسابات المسجلة
              </p>
            </div>
            <Link
              href="/admin/customers"
              className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#16a6c9]"
            >
              عرض الكل
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#edf2f4]">
            {data.recent_customers.length ? (
              data.recent_customers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center gap-3 px-5 py-4 sm:px-6"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#f0f7f9] text-[#0d2b4e]">
                    <Users className="h-[18px] w-[18px]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[12px] font-extrabold text-[#173b59]">
                        {customer.name}
                      </p>
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          customer.is_active
                            ? "bg-emerald-500"
                            : "bg-red-500"
                        }`}
                      />
                    </div>
                    <p className="mt-1 truncate text-[10px] font-bold text-[#91a3ae]">
                      {customer.phone} · {number(customer.coolers_count)} برادة ·{" "}
                      {number(customer.orders_count)} طلب
                    </p>
                  </div>

                  <p className="text-[9px] font-bold text-[#a0afb8]">
                    {date(customer.created_at)}
                  </p>
                </div>
              ))
            ) : (
              <p className="px-6 py-12 text-center text-xs font-bold text-[#9aabb5]">
                لا يوجد عملاء حتى الآن.
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-[22px] border border-[#e2ecef] bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-emerald-50 text-emerald-600">
              <CircleDollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-[#95a5af]">
                عمليات دفع ناجحة
              </p>
              <strong className="mt-1 block text-xl font-black tabular-nums text-[#0d2b4e]">
                {number(stats.payments.paid)}
              </strong>
            </div>
          </div>
        </article>

        <article className="rounded-[22px] border border-[#e2ecef] bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-amber-50 text-amber-600">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-[#95a5af]">
                مدفوعات معلقة
              </p>
              <strong className="mt-1 block text-xl font-black tabular-nums text-[#0d2b4e]">
                {number(stats.payments.pending)}
              </strong>
            </div>
          </div>
        </article>

        <article className="rounded-[22px] border border-[#e2ecef] bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-red-50 text-red-600">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-[#95a5af]">
                مدفوعات فاشلة
              </p>
              <strong className="mt-1 block text-xl font-black tabular-nums text-[#0d2b4e]">
                {number(stats.payments.failed)}
              </strong>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
