"use client";

import { ApiError, apiRequest } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Droplets,
  RefreshCw,
  Search,
  ShieldOff,
  UserRound,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Cooler = {
  id: number;
  name: string;
  photo_url?: string | null;
  landmark?: string | null;
  approval_status: string;
  rejection_reason?: string | null;
  is_active: boolean;
  orders_count?: number;
  created_at?: string | null;
  user?: {
    id: number;
    name: string;
    phone: string;
    email: string;
  } | null;
};

type Pagination<T> = {
  current_page: number;
  data: T[];
  last_page: number;
  total: number;
};

type Response = {
  success: true;
  data: {
    coolers: Pagination<Cooler>;
    stats: {
      total: number;
      pending_review: number;
      approved: number;
      rejected: number;
      disabled: number;
    };
  };
};

const tabs = [
  ["", "الكل"],
  ["pending_review", "قيد المراجعة"],
  ["approved", "معتمدة"],
  ["rejected", "مرفوضة"],
  ["disabled", "موقوفة"],
] as const;

function statusLabel(status: string) {
  return {
    pending_review: "قيد المراجعة",
    approved: "معتمدة",
    rejected: "تحتاج تعديل",
    disabled: "موقوفة",
  }[status] || status;
}

function statusClass(status: string) {
  return {
    pending_review: "bg-amber-50 text-amber-700 ring-amber-200",
    approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    rejected: "bg-red-50 text-red-700 ring-red-200",
    disabled: "bg-slate-100 text-slate-600 ring-slate-200",
  }[status] || "bg-slate-50 text-slate-600 ring-slate-200";
}

export default function AdminCoolersPage() {
  const [data, setData] = useState<Response["data"] | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      per_page: "15",
      page: String(page),
    });

    if (search) params.set("search", search);
    if (status) params.set("approval_status", status);

    try {
      const response = await apiRequest<Response>(
        `/admin/coolers?${params.toString()}`,
        { token },
      );
      setData(response.data);
    } catch (exception) {
      setError(
        exception instanceof ApiError
          ? exception.message
          : "تعذر تحميل البرادات",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    const scheduled = queueMicrotask(() => { void load(); });
    void scheduled;
  }, [load]);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(125deg,#0d2b4e_0%,#123e68_58%,#0d607a_100%)] p-6 sm:p-8">
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-extrabold text-[#72e0f5]">
              <Droplets className="h-3.5 w-3.5" />
              إدارة البرادات
            </span>
            <h1 className="mt-4 text-[27px] font-extrabold leading-[1.45] text-white sm:text-[32px]">
              مراجعة واعتماد البرادات
            </h1>
            <p className="mt-2 text-[13px] font-bold leading-7 text-white/70">
              كل برادة جديدة تظهر هنا أولًا قبل إتاحتها لخدمات نمير.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex h-11 items-center gap-2 self-start rounded-[14px] border border-white/10 bg-white/[0.08] px-4 text-xs font-extrabold text-white hover:bg-white/[0.14] sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </button>
        </div>
      </section>

      {data ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["الإجمالي", data.stats.total, Droplets],
            ["قيد المراجعة", data.stats.pending_review, Clock3],
            ["معتمدة", data.stats.approved, CheckCircle2],
            ["تحتاج تعديل", data.stats.rejected, XCircle],
            ["موقوفة", data.stats.disabled, ShieldOff],
          ].map(([label, value, Icon]) => {
            const IconComponent = Icon as typeof Droplets;
            return (
              <article key={String(label)} className="rounded-[20px] border border-[#dfecef] bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#eaf8fb] text-[#16a6c9]">
                    <IconComponent className="h-[18px] w-[18px]" />
                  </div>
                  <div>
                    <strong className="block text-lg font-black tabular-nums text-[#0d2b4e]">{String(value)}</strong>
                    <span className="text-[9px] font-extrabold text-[#91a3ae]">{String(label)}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}

      <section className="rounded-[24px] border border-[#dfecef] bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <form
            className="relative w-full xl:max-w-[430px]"
            onSubmit={(event) => {
              event.preventDefault();
              setPage(1);
              setSearch(searchInput.trim());
            }}
          >
            <Search className="absolute right-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#91a3ae]" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="اسم البرادة أو العميل أو الجوال..."
              className="h-12 w-full rounded-[15px] border border-[#dce9ed] bg-[#fbfdfe] pr-11 pl-4 text-xs font-bold text-[#0d2b4e] outline-none focus:border-[#16a6c9]"
            />
          </form>

          <div className="flex flex-wrap gap-2">
            {tabs.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setPage(1);
                  setStatus(value);
                }}
                className={`rounded-[12px] px-3.5 py-2 text-[10px] font-extrabold transition ${
                  status === value
                    ? "bg-[#0d2b4e] text-white"
                    : "bg-[#f3f8fa] text-[#6f8493] hover:bg-[#e9f5f8] hover:text-[#0d2b4e]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-[18px] border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[26px] border border-[#dfecef] bg-white">
        {loading && !data ? (
          <div className="grid min-h-[360px] place-items-center">
            <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#d8e8ec] border-t-[#16a6c9]" />
          </div>
        ) : data?.coolers.data.length ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1080px] text-right">
                <thead className="border-b border-[#edf2f4] bg-[#f8fbfc] text-[10px] font-extrabold text-[#879aa7]">
                  <tr>
                    <th className="px-5 py-4">البرادة</th>
                    <th className="px-5 py-4">العميل</th>
                    <th className="px-5 py-4">الموقع</th>
                    <th className="px-5 py-4">الطلبات</th>
                    <th className="px-5 py-4">المراجعة</th>
                    <th className="px-5 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf2f4]">
                  {data.coolers.data.map((cooler) => (
                    <tr key={cooler.id} className="transition hover:bg-[#fbfdfe]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[#edf8fa]">
                            {cooler.photo_url ? (
                              <img src={cooler.photo_url} alt={cooler.name} className="h-full w-full object-cover" />
                            ) : (
                              <Droplets className="h-5 w-5 text-[#16a6c9]" />
                            )}
                          </div>
                          <span className="text-[11px] font-extrabold text-[#29475f]">{cooler.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-[11px] font-extrabold text-[#38536a]">{cooler.user?.name || "—"}</p>
                        <p className="mt-1 text-[9px] font-bold tabular-nums text-[#9aabb5]">{cooler.user?.phone || "—"}</p>
                      </td>
                      <td className="px-5 py-4 text-[10px] font-bold text-[#7b8f9c]">{cooler.landmark || "—"}</td>
                      <td className="px-5 py-4 text-[11px] font-black tabular-nums text-[#0d2b4e]">{cooler.orders_count || 0}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1.5 text-[9px] font-extrabold ring-1 ${statusClass(cooler.approval_status)}`}>
                          {statusLabel(cooler.approval_status)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Link href={`/admin/coolers/${cooler.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-[12px] bg-[#eaf8fb] px-3 text-[10px] font-extrabold text-[#108baa] transition hover:bg-[#16a6c9] hover:text-white">
                          مراجعة
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-[#edf2f4] lg:hidden">
              {data.coolers.data.map((cooler) => (
                <Link key={cooler.id} href={`/admin/coolers/${cooler.id}`} className="block p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-[#edf8fa]">
                      {cooler.photo_url ? (
                        <img src={cooler.photo_url} alt={cooler.name} className="h-full w-full object-cover" />
                      ) : (
                        <Droplets className="h-5 w-5 text-[#16a6c9]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-extrabold text-[#29475f]">{cooler.name}</p>
                      <p className="mt-1 truncate text-[10px] font-bold text-[#91a3ae]">{cooler.user?.name || "—"}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-extrabold ring-1 ${statusClass(cooler.approval_status)}`}>
                      {statusLabel(cooler.approval_status)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-[#edf2f4] px-5 py-4">
              <span className="text-[10px] font-bold text-[#91a3ae]">
                صفحة {data.coolers.current_page} من {data.coolers.last_page}
              </span>
              <div className="flex gap-2">
                <button type="button" disabled={data.coolers.current_page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="h-9 rounded-[12px] border border-[#dce9ed] px-4 text-[10px] font-extrabold disabled:opacity-40">
                  السابق
                </button>
                <button type="button" disabled={data.coolers.current_page >= data.coolers.last_page} onClick={() => setPage((p) => p + 1)} className="h-9 rounded-[12px] bg-[#0d2b4e] px-4 text-[10px] font-extrabold text-white disabled:opacity-40">
                  التالي
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="grid min-h-[320px] place-items-center px-6 text-center">
            <div>
              <Droplets className="mx-auto h-8 w-8 text-[#16a6c9]" />
              <h2 className="mt-4 text-base font-extrabold text-[#0d2b4e]">لا توجد برادات مطابقة</h2>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
