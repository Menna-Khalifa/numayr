"use client";

import { ApiError, apiRequest } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Droplets,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldOff,
  UserRound,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Cooler = {
  id: number;
  name: string;
  photo_url?: string | null;
  landmark?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  filter_type?: string | null;
  status?: string | null;
  approval_status: string;
  rejection_reason?: string | null;
  health_score?: number | null;
  notes?: string | null;
  is_active: boolean;
  created_at?: string | null;
  user?: {
    id: number;
    name: string;
    email: string;
    phone: string;
    is_active: boolean;
  } | null;
  address?: {
    label?: string | null;
    city?: string | null;
    district?: string | null;
    street?: string | null;
  } | null;
  orders?: Array<{
    id: number;
    order_number?: string | null;
    service_name?: string | null;
    status: string;
  }>;
};

type Response = {
  success: true;
  message?: string;
  data: {
    cooler: Cooler;
  };
};

const statusLabels: Record<string, string> = {
  pending_review: "قيد المراجعة",
  approved: "معتمدة",
  rejected: "تحتاج تعديل",
  disabled: "موقوفة",
};

export default function AdminCoolerDetailPage() {
  const params = useParams<{ id: string }>();
  const [cooler, setCooler] = useState<Cooler | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<Response>(`/admin/coolers/${params.id}`, { token });
      setCooler(response.data.cooler);
      setReason(response.data.cooler.rejection_reason || "");
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : "تعذر تحميل البرادة");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(status: "approved" | "rejected" | "disabled") {
    if (!cooler || saving) return;

    if (status === "rejected" && !reason.trim()) {
      setError("اكتب سبب الرفض أو التعديل المطلوب أولًا");
      return;
    }

    const token = getAuthToken();
    if (!token) return;

    setSaving(status);
    setError("");
    setMessage("");

    try {
      const response = await apiRequest<Response>(
        `/admin/coolers/${cooler.id}/review`,
        {
          method: "PATCH",
          token,
          body: JSON.stringify({
            approval_status: status,
            reason: reason.trim() || null,
          }),
        },
      );

      setCooler(response.data.cooler);
      setMessage(
        status === "approved"
          ? "تم اعتماد البرادة وإشعار المستخدم."
          : status === "rejected"
            ? "تم إرسال سبب التعديل للمستخدم."
            : "تم إيقاف البرادة وإشعار المستخدم.",
      );

      window.dispatchEvent(new Event("numayr:notifications-updated"));
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : "تعذر تحديث حالة البرادة");
    } finally {
      setSaving("");
    }
  }

  if (loading && !cooler) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <span className="h-11 w-11 animate-spin rounded-full border-[3px] border-[#d8e8ec] border-t-[#16a6c9]" />
      </div>
    );
  }

  if (!cooler) {
    return <div className="rounded-[20px] bg-red-50 p-5 text-sm font-bold text-red-600">{error || "البرادة غير موجودة"}</div>;
  }

  const addressText = [
    cooler.address?.city,
    cooler.address?.district,
    cooler.address?.street,
  ].filter(Boolean).join("، ");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/admin/coolers" className="inline-flex h-11 items-center gap-2 rounded-[14px] border border-[#dce9ed] bg-white px-4 text-xs font-extrabold text-[#38536a]">
          <ArrowRight className="h-4 w-4" />
          العودة للبرادات
        </Link>
        <button type="button" onClick={() => void load()} className="inline-flex h-11 items-center gap-2 rounded-[14px] bg-[#0d2b4e] px-4 text-xs font-extrabold text-white">
          <RefreshCw className="h-4 w-4" />
          تحديث
        </button>
      </div>

      <section className="overflow-hidden rounded-[28px] border border-[#dfecef] bg-white">
        <div className="grid lg:grid-cols-[360px_1fr]">
          <div className="min-h-[290px] bg-[#edf8fa]">
            {cooler.photo_url ? (
              <img src={cooler.photo_url} alt={cooler.name} className="h-full min-h-[290px] w-full object-cover" />
            ) : (
              <div className="flex h-full min-h-[290px] items-center justify-center">
                <Droplets className="h-14 w-14 text-[#16a6c9]/60" />
              </div>
            )}
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold text-[#16a6c9]">مراجعة البرادة</p>
                <h1 className="mt-2 text-2xl font-extrabold leading-[1.45] text-[#0d2b4e]">{cooler.name}</h1>
                <p className="mt-2 text-[11px] font-bold text-[#8a9ca7]">#{cooler.id}</p>
              </div>
              <span className="rounded-full bg-[#f2f8fa] px-3 py-2 text-[10px] font-extrabold text-[#38536a]">
                {statusLabels[cooler.approval_status] || cooler.approval_status}
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Info icon={UserRound} label="العميل" value={cooler.user?.name || "—"} />
              <Info icon={Phone} label="الجوال" value={cooler.user?.phone || "—"} />
              <Info icon={Mail} label="البريد" value={cooler.user?.email || "—"} />
              <Info icon={MapPin} label="الموقع" value={cooler.landmark || addressText || "—"} />
            </div>

            {cooler.notes ? (
              <div className="mt-4 rounded-[16px] bg-[#f7fafb] p-4">
                <p className="text-[9px] font-bold text-[#97a7b1]">ملاحظات المستخدم</p>
                <p className="mt-2 text-[11px] font-bold leading-7 text-[#506b7d]">{cooler.notes}</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {message ? <div className="rounded-[18px] border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-[18px] border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">{error}</div> : null}

      <section className="grid gap-6 xl:grid-cols-[1fr_.85fr]">
        <article className="rounded-[26px] border border-[#dfecef] bg-white p-5 sm:p-6">
          <h2 className="text-[15px] font-extrabold text-[#0d2b4e]">بيانات البرادة</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["نوع الفلتر", cooler.filter_type || "غير محدد"],
              ["حالة الصحة", cooler.health_score !== null && cooler.health_score !== undefined ? `${cooler.health_score}%` : "بانتظار التقييم"],
              ["الحالة التشغيلية", cooler.is_active ? "نشطة" : "موقوفة"],
              ["الحالة الداخلية", cooler.status || "unknown"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[15px] bg-[#f7fafb] p-4">
                <p className="text-[9px] font-bold text-[#97a7b1]">{label}</p>
                <p className="mt-1.5 text-[11px] font-extrabold text-[#38536a]">{value}</p>
              </div>
            ))}
          </div>

          {cooler.orders?.length ? (
            <div className="mt-6">
              <h3 className="text-[12px] font-extrabold text-[#0d2b4e]">أحدث الطلبات على البرادة</h3>
              <div className="mt-3 divide-y divide-[#edf2f4]">
                {cooler.orders.map((order) => (
                  <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <p className="text-[10px] font-black tabular-nums text-[#38536a]">{order.order_number || `#${order.id}`}</p>
                      <p className="mt-1 text-[9px] font-bold text-[#93a4ae]">{order.service_name || "طلب خدمة"}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 rotate-180 text-[#16a6c9]" />
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </article>

        <article className="rounded-[26px] border border-[#dfecef] bg-white p-5 sm:p-6">
          <h2 className="text-[15px] font-extrabold text-[#0d2b4e]">قرار المراجعة</h2>
          <p className="mt-2 text-[11px] font-bold leading-7 text-[#8295a1]">
            الاعتماد يتيح استخدام البرادة في الخدمات. الرفض يعيدها للمستخدم مع سبب واضح.
          </p>

          <label className="mb-2 mt-5 block text-[10px] font-extrabold text-[#587183]">
            سبب الرفض أو الملاحظة
          </label>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={4}
            placeholder="مثال: الصورة غير واضحة، برجاء رفع صورة كاملة للبرادة."
            className="w-full resize-none rounded-[15px] border border-[#dce9ed] bg-[#fbfdfe] p-4 text-[12px] font-bold leading-6 text-[#38536a] outline-none focus:border-[#16a6c9]"
          />

          <div className="mt-4 grid gap-3">
            {cooler.approval_status !== "approved" ? (<button type="button" disabled={Boolean(saving)} onClick={() => void review("approved")} className="flex h-12 items-center justify-center gap-2 rounded-[15px] bg-emerald-600 text-xs font-extrabold text-white transition hover:bg-emerald-700 disabled:opacity-50">
              <CheckCircle2 className="h-4 w-4" />
              {saving === "approved" ? "جاري الاعتماد..." : "اعتماد البرادة"}
            </button>) : null}

            {cooler.approval_status !== "rejected" ? (<button type="button" disabled={Boolean(saving)} onClick={() => void review("rejected")} className="flex h-12 items-center justify-center gap-2 rounded-[15px] bg-red-50 text-xs font-extrabold text-red-600 transition hover:bg-red-100 disabled:opacity-50">
              <XCircle className="h-4 w-4" />
              {saving === "rejected" ? "جاري الإرسال..." : "رفض وإرسال السبب"}
            </button>) : null}

            {cooler.approval_status !== "disabled" ? (<button type="button" disabled={Boolean(saving)} onClick={() => void review("disabled")} className="flex h-12 items-center justify-center gap-2 rounded-[15px] bg-slate-100 text-xs font-extrabold text-slate-600 transition hover:bg-slate-200 disabled:opacity-50">
              <ShieldOff className="h-4 w-4" />
              {saving === "disabled" ? "جاري الإيقاف..." : "إيقاف البرادة"}
            </button>) : null}
          </div>

          {cooler.approval_status === "pending_review" ? (
            <div className="mt-4 flex gap-2 rounded-[14px] border border-amber-100 bg-amber-50 p-3 text-[10px] font-bold leading-6 text-amber-700">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
              هذه البرادة غير متاحة لطلبات الخدمات حتى اعتمادها.
            </div>
          ) : null}
        </article>
      </section>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[15px] bg-[#f7fafb] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#eaf8fb] text-[#16a6c9]">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-bold text-[#97a7b1]">{label}</p>
        <p className="mt-1 truncate text-[11px] font-extrabold text-[#38536a]">{value}</p>
      </div>
    </div>
  );
}
