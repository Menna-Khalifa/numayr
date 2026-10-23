"use client";

import { ApiError, apiRequest } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import {
  ArrowRight,
  CheckCircle2,
  Droplets,
  Home,
  Mail,
  PackageCheck,
  Phone,
  RefreshCw,
  ShieldOff,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  created_at?: string | null;
  addresses_count: number;
  coolers_count: number;
  orders_count: number;
  addresses?: Array<{
    id: number;
    label?: string | null;
    city?: string | null;
    district?: string | null;
    street?: string | null;
  }>;
  coolers?: Array<{
    id: number;
    name?: string | null;
    created_at?: string | null;
  }>;
  orders?: Array<{
    id: number;
    order_number?: string | null;
    service_name?: string | null;
    status: string;
    created_at?: string | null;
  }>;
};

type CustomerResponse = {
  success: true;
  data: {
    customer: Customer;
  };
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

const statusLabels: Record<string, string> = {
  pending: "جديد",
  confirmed: "مؤكد",
  in_progress: "جاري التنفيذ",
  completed: "مكتمل",
  cancelled: "ملغي",
};

export default function AdminCustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const customerId = params.id;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadCustomer = useCallback(async () => {
    const token = getAuthToken();
    if (!token || !customerId) return;

    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<CustomerResponse>(
        `/admin/customers/${customerId}`,
        { token },
      );
      setCustomer(response.data.customer);
    } catch (exception) {
      if (exception instanceof ApiError) {
        setError(exception.message);
      } else {
        setError("تعذر تحميل بيانات العميل");
      }
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    const scheduled = queueMicrotask(() => { void loadCustomer(); });
    void scheduled;
  }, [loadCustomer]);

  async function toggleStatus() {
    if (!customer || saving) return;

    const token = getAuthToken();
    if (!token) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await apiRequest<CustomerResponse>(
        `/admin/customers/${customer.id}/status`,
        {
          method: "PATCH",
          token,
          body: JSON.stringify({
            is_active: !customer.is_active,
          }),
        },
      );

      setCustomer(response.data.customer);
      setMessage(
        response.data.customer.is_active
          ? "تم تفعيل حساب العميل بنجاح."
          : "تم إيقاف حساب العميل وتسجيل خروجه من الجلسات الحالية.",
      );

      window.setTimeout(() => setMessage(""), 5000);
    } catch (exception) {
      if (exception instanceof ApiError) {
        setError(exception.message);
      } else {
        setError("تعذر تحديث حالة الحساب");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading && !customer) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <span className="h-11 w-11 animate-spin rounded-full border-[3px] border-[#d8e8ec] border-t-[#16a6c9]" />
      </div>
    );
  }

  if (error && !customer) {
    return (
      <div className="mx-auto max-w-xl rounded-[26px] border border-red-100 bg-white p-7 text-center">
        <p className="text-sm font-bold text-red-600">{error}</p>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/customers"
          className="inline-flex h-11 items-center gap-2 rounded-[14px] border border-[#dce9ed] bg-white px-4 text-xs font-extrabold text-[#38536a] transition hover:border-[#16a6c9]/30 hover:bg-[#f7fbfc]"
        >
          <ArrowRight className="h-4 w-4" />
          العودة للعملاء
        </Link>

        <button
          type="button"
          onClick={() => void loadCustomer()}
          disabled={loading}
          className="inline-flex h-11 items-center gap-2 rounded-[14px] bg-[#0d2b4e] px-4 text-xs font-extrabold text-white transition hover:bg-[#123e68] disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          تحديث
        </button>
      </div>

      <section className="overflow-hidden rounded-[28px] border border-[#dfecef] bg-white shadow-[0_14px_40px_rgba(13,43,78,.05)]">
        <div className="bg-[linear-gradient(125deg,#0d2b4e_0%,#123e68_62%,#0d5f78_100%)] p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-white/[0.10] text-[#72e0f5]">
                <UserRound className="h-7 w-7" />
              </div>

              <div>
                <p className="text-[10px] font-extrabold text-[#72e0f5]">
                  ملف العميل
                </p>
                <h1 className="mt-1 text-2xl font-extrabold leading-[1.45] text-white">
                  {customer.name}
                </h1>
                <p className="mt-1 text-[11px] font-bold text-white/55">
                  مسجل منذ {formatDate(customer.created_at)}
                </p>
              </div>
            </div>

            <span
              className={`inline-flex self-start items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-extrabold ring-1 ${
                customer.is_active
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-red-50 text-red-700 ring-red-200"
              }`}
            >
              {customer.is_active ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <ShieldOff className="h-4 w-4" />
              )}
              {customer.is_active ? "حساب نشط" : "حساب موقوف"}
            </span>
          </div>
        </div>

        <div className="grid gap-px bg-[#edf2f4] sm:grid-cols-3">
          {[
            {
              label: "رقم الجوال",
              value: customer.phone || "—",
              icon: Phone,
            },
            {
              label: "البريد الإلكتروني",
              value: customer.email || "—",
              icon: Mail,
            },
            {
              label: "رقم المستخدم",
              value: `#${customer.id}`,
              icon: UserRound,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.label} className="bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#edf8fa] text-[#16a6c9]">
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-[#95a6b0]">
                      {item.label}
                    </p>
                    <p className="mt-1 truncate text-[11px] font-extrabold text-[#29475f]">
                      {item.value}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {message ? (
        <div className="rounded-[18px] border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[18px] border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "البرادات",
            value: customer.coolers_count,
            icon: Droplets,
          },
          {
            label: "الطلبات",
            value: customer.orders_count,
            icon: PackageCheck,
          },
          {
            label: "العناوين",
            value: customer.addresses_count,
            icon: Home,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.label}
              className="rounded-[22px] border border-[#dfecef] bg-white p-5 shadow-[0_10px_30px_rgba(13,43,78,.035)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#eaf8fb] text-[#16a6c9]">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <strong className="block text-xl font-black tabular-nums text-[#0d2b4e]">
                    {formatNumber(item.value)}
                  </strong>
                  <p className="mt-0.5 text-[10px] font-extrabold text-[#95a6b0]">
                    {item.label}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_.8fr]">
        <div className="space-y-6">
          <article className="rounded-[26px] border border-[#dfecef] bg-white p-5 shadow-[0_12px_34px_rgba(13,43,78,.04)] sm:p-6">
            <h2 className="text-[15px] font-extrabold text-[#0d2b4e]">
              آخر الطلبات
            </h2>

            <div className="mt-5 divide-y divide-[#edf2f4]">
              {customer.orders?.length ? (
                customer.orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between gap-4 py-4 transition hover:bg-[#fbfdfe]"
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] font-black tabular-nums text-[#29475f]">
                        {order.order_number || `#${order.id}`}
                      </p>
                      <p className="mt-1 truncate text-[10px] font-bold text-[#8295a1]">
                        {order.service_name || "طلب خدمة"}
                      </p>
                    </div>

                    <div className="text-left">
                      <p className="text-[9px] font-extrabold text-[#16a6c9]">
                        {statusLabels[order.status] || order.status}
                      </p>
                      <p className="mt-1 text-[9px] font-bold text-[#a0afb8]">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="py-8 text-center text-xs font-bold text-[#9aabb5]">
                  لا توجد طلبات لهذا العميل.
                </p>
              )}
            </div>
          </article>

          <article className="rounded-[26px] border border-[#dfecef] bg-white p-5 shadow-[0_12px_34px_rgba(13,43,78,.04)] sm:p-6">
            <h2 className="text-[15px] font-extrabold text-[#0d2b4e]">
              البرادات المسجلة
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {customer.coolers?.length ? (
                customer.coolers.map((cooler) => (
                  <div
                    key={cooler.id}
                    className="rounded-[16px] bg-[#f7fafb] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <Droplets className="h-[18px] w-[18px] text-[#16a6c9]" />
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-extrabold text-[#38536a]">
                          {cooler.name || `برادة #${cooler.id}`}
                        </p>
                        <p className="mt-1 text-[9px] font-bold text-[#9aabb5]">
                          {formatDate(cooler.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs font-bold text-[#9aabb5]">
                  لا توجد برادات مسجلة.
                </p>
              )}
            </div>
          </article>
        </div>

        <div className="space-y-6">
          <article className="rounded-[26px] border border-[#dfecef] bg-white p-5 shadow-[0_12px_34px_rgba(13,43,78,.04)] sm:p-6">
            <h2 className="text-[15px] font-extrabold text-[#0d2b4e]">
              إدارة الحساب
            </h2>

            <p className="mt-3 text-[11px] font-bold leading-7 text-[#7f929e]">
              عند إيقاف الحساب، يتم إلغاء جميع جلسات الدخول الحالية للمستخدم ويمنع من استخدام النظام حتى إعادة التفعيل.
            </p>

            <button
              type="button"
              onClick={() => void toggleStatus()}
              disabled={saving}
              className={`mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[16px] text-xs font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                customer.is_active
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/25 border-t-current" />
              ) : customer.is_active ? (
                <ShieldOff className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}

              {saving
                ? "جاري الحفظ..."
                : customer.is_active
                  ? "إيقاف حساب العميل"
                  : "إعادة تفعيل الحساب"}
            </button>

            <div className="mt-4 rounded-[14px] border border-amber-100 bg-amber-50 px-4 py-3">
              <p className="text-[10px] font-bold leading-6 text-amber-700">
                الحذف النهائي غير مفعّل الآن لأن الـBackend الحالي يوفر التفعيل والإيقاف فقط. لن نضيف حذفًا وهميًا قبل مراجعة علاقات الطلبات والفواتير والبرادات.
              </p>
            </div>
          </article>

          <article className="rounded-[26px] border border-[#dfecef] bg-white p-5 shadow-[0_12px_34px_rgba(13,43,78,.04)] sm:p-6">
            <h2 className="text-[15px] font-extrabold text-[#0d2b4e]">
              عناوين العميل
            </h2>

            <div className="mt-4 space-y-3">
              {customer.addresses?.length ? (
                customer.addresses.map((address) => (
                  <div
                    key={address.id}
                    className="rounded-[15px] bg-[#f7fafb] p-4"
                  >
                    <p className="text-[11px] font-extrabold text-[#38536a]">
                      {address.label || "عنوان"}
                    </p>
                    <p className="mt-1 text-[10px] font-bold leading-6 text-[#8a9ca7]">
                      {[address.city, address.district, address.street]
                        .filter(Boolean)
                        .join("، ") || "لا توجد تفاصيل إضافية"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-xs font-bold text-[#9aabb5]">
                  لا توجد عناوين.
                </p>
              )}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
