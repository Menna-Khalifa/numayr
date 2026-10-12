"use client";

import { ApiError, apiRequest } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import {
  ArrowLeft,
  CheckCircle2,
  Filter,
  RefreshCw,
  Search,
  ShieldOff,
  UserRound,
  Users,
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

type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  created_at?: string | null;
  addresses_count: number;
  coolers_count: number;
  orders_count: number;
};

type CustomersResponse = {
  success: true;
  data: {
    customers: Pagination<Customer>;
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

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Pagination<Customer> | null>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCustomers = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    params.set("per_page", "15");
    params.set("page", String(page));

    if (search) params.set("search", search);
    if (activeFilter) params.set("is_active", activeFilter);

    try {
      const response = await apiRequest<CustomersResponse>(
        `/admin/customers?${params.toString()}`,
        { token },
      );
      setCustomers(response.data.customers);
    } catch (exception) {
      if (exception instanceof ApiError) {
        setError(exception.message);
      } else {
        setError("تعذر تحميل العملاء");
      }
    } finally {
      setLoading(false);
    }
  }, [activeFilter, page, search]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(query.trim());
  }

  function clearFilters() {
    setQuery("");
    setSearch("");
    setActiveFilter("");
    setPage(1);
  }

  const hasFilters = Boolean(search || activeFilter);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(125deg,#0d2b4e_0%,#123e68_58%,#0d607a_100%)] p-6 shadow-[0_24px_70px_rgba(13,43,78,.12)] sm:p-8">
        <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-[#16a6c9]/20 blur-[70px]" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-extrabold text-[#72e0f5]">
              <Users className="h-3.5 w-3.5" />
              إدارة العملاء
            </span>

            <h1 className="mt-4 text-[27px] font-extrabold leading-[1.45] text-white sm:text-[32px]">
              كل حسابات المستخدمين
            </h1>

            <p className="mt-2 max-w-2xl text-[13px] font-bold leading-7 text-white/70 sm:text-sm">
              راقب الحسابات المسجلة، البرادات والطلبات، وافتح ملف أي عميل لإدارته.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadCustomers()}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-[14px] border border-white/10 bg-white/[0.08] px-4 text-xs font-extrabold text-white transition hover:bg-white/[0.14] disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </button>
        </div>
      </section>

      <section className="rounded-[25px] border border-[#dfecef] bg-white p-4 shadow-[0_12px_34px_rgba(13,43,78,.045)] sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_.7fr_auto]">
          <form onSubmit={submitSearch} className="relative">
            <Search className="absolute right-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#93a6b2]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث بالاسم أو البريد أو رقم الجوال"
              className="h-12 w-full rounded-[16px] border border-[#dce9ed] bg-[#fbfdfe] pr-11 pl-4 text-[13px] font-bold text-[#0d2b4e] outline-none transition placeholder:text-[#9babb5] focus:border-[#16a6c9] focus:shadow-[0_0_0_4px_rgba(22,166,201,.08)]"
            />
          </form>

          <select
            value={activeFilter}
            onChange={(event) => {
              setPage(1);
              setActiveFilter(event.target.value);
            }}
            className="h-12 rounded-[16px] border border-[#dce9ed] bg-[#fbfdfe] px-4 text-[12px] font-extrabold text-[#38536a] outline-none focus:border-[#16a6c9]"
          >
            <option value="">كل الحسابات</option>
            <option value="1">نشطة</option>
            <option value="0">موقوفة</option>
          </select>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setPage(1);
                setSearch(query.trim());
              }}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-[16px] bg-[#0d2b4e] px-5 text-xs font-extrabold text-white transition hover:bg-[#123e68] lg:flex-none"
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
        <div className="rounded-[18px] border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[26px] border border-[#dfecef] bg-white shadow-[0_14px_38px_rgba(13,43,78,.04)]">
        <div className="flex items-center justify-between border-b border-[#edf2f4] px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-[15px] font-extrabold text-[#0d2b4e]">
              المستخدمون
            </h2>
            <p className="mt-1 text-[10px] font-bold text-[#94a5af]">
              {customers
                ? `${formatNumber(customers.total)} حساب`
                : "جاري التحميل..."}
            </p>
          </div>
        </div>

        {loading && !customers ? (
          <div className="grid min-h-[360px] place-items-center">
            <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#d9e8ec] border-t-[#16a6c9]" />
          </div>
        ) : customers?.data.length ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1050px] border-collapse text-right">
                <thead>
                  <tr className="border-b border-[#edf2f4] bg-[#f8fbfc] text-[10px] font-extrabold text-[#879aa7]">
                    <th className="px-5 py-4">العميل</th>
                    <th className="px-5 py-4">الجوال</th>
                    <th className="px-5 py-4">البريد</th>
                    <th className="px-5 py-4">البرادات</th>
                    <th className="px-5 py-4">الطلبات</th>
                    <th className="px-5 py-4">العناوين</th>
                    <th className="px-5 py-4">الحالة</th>
                    <th className="px-5 py-4">التسجيل</th>
                    <th className="px-5 py-4" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#edf2f4]">
                  {customers.data.map((customer) => (
                    <tr
                      key={customer.id}
                      className="transition hover:bg-[#fbfdfe]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#edf8fa] text-[#16a6c9]">
                            <UserRound className="h-[18px] w-[18px]" />
                          </div>
                          <p className="text-[11px] font-extrabold text-[#29475f]">
                            {customer.name}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-[10px] font-black tabular-nums text-[#38536a]">
                        {customer.phone || "—"}
                      </td>

                      <td className="max-w-[220px] truncate px-5 py-4 text-[10px] font-bold text-[#718592]">
                        {customer.email || "—"}
                      </td>

                      <td className="px-5 py-4 text-[11px] font-black tabular-nums text-[#0d2b4e]">
                        {formatNumber(customer.coolers_count)}
                      </td>

                      <td className="px-5 py-4 text-[11px] font-black tabular-nums text-[#0d2b4e]">
                        {formatNumber(customer.orders_count)}
                      </td>

                      <td className="px-5 py-4 text-[11px] font-black tabular-nums text-[#0d2b4e]">
                        {formatNumber(customer.addresses_count)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[9px] font-extrabold ring-1 ${
                            customer.is_active
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : "bg-red-50 text-red-700 ring-red-200"
                          }`}
                        >
                          {customer.is_active ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <ShieldOff className="h-3 w-3" />
                          )}
                          {customer.is_active ? "نشط" : "موقوف"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-[10px] font-bold text-[#8597a3]">
                        {formatDate(customer.created_at)}
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="inline-flex h-9 items-center gap-1.5 rounded-[12px] bg-[#eaf8fb] px-3 text-[10px] font-extrabold text-[#108baa] transition hover:bg-[#16a6c9] hover:text-white"
                        >
                          التفاصيل
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-[#edf2f4] lg:hidden">
              {customers.data.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/admin/customers/${customer.id}`}
                  className="block p-5 transition hover:bg-[#fbfdfe]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#edf8fa] text-[#16a6c9]">
                        <UserRound className="h-[19px] w-[19px]" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-extrabold text-[#29475f]">
                          {customer.name}
                        </p>
                        <p className="mt-1 text-[10px] font-bold tabular-nums text-[#91a3ae]">
                          {customer.phone}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex shrink-0 rounded-full px-2 py-1 text-[9px] font-extrabold ring-1 ${
                        customer.is_active
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-red-50 text-red-700 ring-red-200"
                      }`}
                    >
                      {customer.is_active ? "نشط" : "موقوف"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      ["البرادات", customer.coolers_count],
                      ["الطلبات", customer.orders_count],
                      ["العناوين", customer.addresses_count],
                    ].map(([label, value]) => (
                      <div
                        key={String(label)}
                        className="rounded-[13px] bg-[#f7fafb] px-3 py-2.5 text-center"
                      >
                        <strong className="block text-[12px] font-black tabular-nums text-[#0d2b4e]">
                          {formatNumber(Number(value))}
                        </strong>
                        <span className="mt-1 block text-[9px] font-bold text-[#97a7b1]">
                          {String(label)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t border-[#edf2f4] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-[10px] font-bold text-[#91a2ad]">
                صفحة {formatNumber(customers.current_page)} من{" "}
                {formatNumber(customers.last_page)}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={customers.current_page <= 1 || loading}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="h-10 rounded-[13px] border border-[#dce9ed] bg-white px-4 text-[10px] font-extrabold text-[#38536a] transition hover:bg-[#f5fafb] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  السابق
                </button>

                <button
                  type="button"
                  disabled={
                    customers.current_page >= customers.last_page || loading
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
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-extrabold text-[#0d2b4e]">
                لا يوجد عملاء مطابقون
              </h3>
              <p className="mt-2 text-xs font-bold leading-6 text-[#8da0ab]">
                جرّب تعديل البحث أو الفلاتر.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
