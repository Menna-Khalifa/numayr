"use client";

import { API_URL, ApiError, apiRequest } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Droplets,
  FileText,
  MapPin,
  PackageCheck,
  Phone,
  RefreshCw,
  Save,
  UserRound,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Order = {
  id: number;
  order_number?: string | null;
  user_id: number;
  cooler_id?: number | null;
  service_code?: string | null;
  service_name?: string | null;
  status: string;
  payment_status?: string | null;
  priority?: string | null;
  pricing_model?: string | null;
  quote_status?: string | null;
  quote_subtotal?: string | null;
  quote_notes?: string | null;
  quantity?: number | string | null;
  unit?: string | null;
  base_price?: number | string | null;
  unit_price?: number | string | null;
  urgent_fee?: number | string | null;
  subtotal?: number | string | null;
  tax_rate?: number | string | null;
  tax_amount?: number | string | null;
  total_amount?: number | string | null;
  currency?: string | null;
  preferred_date?: string | null;
  preferred_time_slot?: string | null;
  notes?: string | null;
  service_data?: Record<string, unknown> | null;
  attachments?: Array<{id:number;original_name?:string|null;mime_type?:string|null;size?:number|null}>;
  created_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  user?: {
    id: number;
    name: string;
    email: string;
    phone: string;
  } | null;
  cooler?: {
    id: number;
    name?: string | null;
    serial_number?: string | null;
  } | null;
  address?: {
    id: number;
    label?: string | null;
    city?: string | null;
    district?: string | null;
    street?: string | null;
    building?: string | null;
    notes?: string | null;
  } | null;
  status_history?: Array<{
    id: number;
    from_status?: string | null;
    to_status: string;
    source?: string | null;
    note?: string | null;
    created_at?: string | null;
  }>;
  payments?: Array<{
    id: number;
    status?: string | null;
    method?: string | null;
    provider?: string | null;
    amount?: number | string | null;
    transaction_id?: string | null;
  }>;
  invoices?: Array<{
    id: number;
    invoice_number?: string | null;
  }>;
};

type OrderResponse = {
  success: true;
  data: {
    order: Order;
  };
};

const statusMeta: Record<
  string,
  { label: string; className: string; icon: typeof Clock3 }
> = {
  pending: {
    label: "جديد",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
    icon: Clock3,
  },
  confirmed: {
    label: "مؤكد",
    className: "bg-sky-50 text-sky-700 ring-sky-200",
    icon: CheckCircle2,
  },
  in_progress: {
    label: "جاري التنفيذ",
    className: "bg-violet-50 text-violet-700 ring-violet-200",
    icon: RefreshCw,
  },
  completed: {
    label: "مكتمل",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    icon: PackageCheck,
  },
  cancelled: {
    label: "ملغي",
    className: "bg-red-50 text-red-700 ring-red-200",
    icon: XCircle,
  },
};

function money(value?: number | string | null, currency?: string | null) {
  const amount = Number(value ?? 0);

  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)} ${currency || "SAR"}`;
}

function dateTime(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusLabel(status?: string | null) {
  if (!status) return "—";
  return statusMeta[status]?.label || status;
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [nextStatus, setNextStatus] = useState("");
  const [note, setNote] = useState("");
  const [quoteSubtotal, setQuoteSubtotal] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [savingQuote, setSavingQuote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openingAttachment, setOpeningAttachment] = useState<number | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<{url:string;name:string}|null>(null);

  async function openAttachment(id: number) {
    const token = getAuthToken();
    if (!token) { setError("يجب تسجيل الدخول لفتح الصورة"); return; }
    setOpeningAttachment(id);
    try {
      const response = await fetch(`${API_URL}/admin/order-attachments/${id}`, {headers:{Authorization:`Bearer ${token}`,Accept:"image/*"}});
      if (!response.ok) throw new Error("تعذر فتح الصورة");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAttachmentPreview((old) => {
        if (old) URL.revokeObjectURL(old.url);
        return {url, name: `مرفق الطلب ${id}`};
      });
    } catch { setError("تعذر عرض مرفق الصيانة. تأكد من صلاحيات الوصول."); }
    finally { setOpeningAttachment(null); }
  }

  const loadOrder = useCallback(async () => {
    const token = getAuthToken();

    if (!token || !orderId) return;

    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<OrderResponse>(
        `/admin/orders/${orderId}`,
        { token },
      );
      setOrder(response.data.order);
    } catch (exception) {
      if (exception instanceof ApiError) {
        setError(exception.message);
      } else {
        setError("تعذر تحميل تفاصيل الطلب");
      }
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    const scheduled = queueMicrotask(() => { void loadOrder(); });
    void scheduled;
  }, [loadOrder]);

  const allowedTransitions = useMemo(() => {
    if (!order) return [];

    if (order.status === "pending") {
      return [{ value: "confirmed", label: "تأكيد الطلب" }];
    }

    if (order.status === "confirmed") {
      return [{ value: "in_progress", label: "بدء التنفيذ" }];
    }

    if (order.status === "in_progress") {
      return [{ value: "completed", label: "إكمال الطلب" }];
    }

    return [];
  }, [order]);

  async function submitQuote() {
    if (!order || savingQuote) return;
    const token = getAuthToken();
    if (!token) return;
    const amount = Number(quoteSubtotal);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("أدخل سعرًا صحيحًا قبل إرسال العرض.");
      return;
    }
    setSavingQuote(true);
    setError("");
    setSuccess("");
    try {
      const response = await apiRequest<OrderResponse>(
        `/admin/orders/${order.id}/quote`,
        { method: "POST", token, body: JSON.stringify({
          quote_subtotal: amount,
          quote_notes: quoteNotes.trim() || null,
        }) },
      );
      setOrder(response.data.order);
      setQuoteSubtotal("");
      setQuoteNotes("");
      setSuccess("تم تحديد السعر وإرسال إشعار للعميل لمراجعته قبل الدفع.");
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message : "تعذر تحديد السعر");
    } finally {
      setSavingQuote(false);
    }
  }

  async function updateStatus() {
    if (!order || !nextStatus || saving) return;

    const token = getAuthToken();
    if (!token) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiRequest<OrderResponse>(
        `/admin/orders/${order.id}/transition`,
        {
          method: "PATCH",
          token,
          body: JSON.stringify({
            status: nextStatus,
            note: note.trim() || null,
          }),
        },
      );

      setOrder(response.data.order);
      setNextStatus("");
      setNote("");
      setSuccess(
        "تم تحديث حالة الطلب وإرسال إشعار للمستخدم بالتغيير بنجاح.",
      );

      window.setTimeout(() => setSuccess(""), 5000);
    } catch (exception) {
      if (exception instanceof ApiError) {
        setError(exception.message);
      } else {
        setError("تعذر تحديث حالة الطلب");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading && !order) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <span className="h-11 w-11 animate-spin rounded-full border-[3px] border-[#d8e8ec] border-t-[#16a6c9]" />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="mx-auto max-w-xl rounded-[26px] border border-red-100 bg-white p-7 text-center">
        <XCircle className="mx-auto h-10 w-10 text-red-500" />
        <h2 className="mt-4 text-lg font-extrabold text-[#0d2b4e]">
          تعذر فتح الطلب
        </h2>
        <p className="mt-2 text-sm font-bold leading-7 text-[#7d919e]">
          {error}
        </p>
      </div>
    );
  }

  if (!order) return null;

  const currentMeta = statusMeta[order.status] || {
    label: order.status,
    className: "bg-slate-50 text-slate-700 ring-slate-200",
    icon: PackageCheck,
  };
  const CurrentIcon = currentMeta.icon;

  const addressText = [
    order.address?.city,
    order.address?.district,
    order.address?.street,
    order.address?.building,
  ]
    .filter(Boolean)
    .join("، ");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/orders"
          className="inline-flex h-11 items-center gap-2 rounded-[14px] border border-[#dce9ed] bg-white px-4 text-xs font-extrabold text-[#38536a] transition hover:border-[#16a6c9]/30 hover:bg-[#f7fbfc]"
        >
          <ArrowRight className="h-4 w-4" />
          العودة للطلبات
        </Link>

        <button
          type="button"
          onClick={() => void loadOrder()}
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
            <div>
              <p className="text-[10px] font-extrabold text-[#72e0f5]">
                رقم الطلب
              </p>
              <h1 className="mt-2 text-xl font-black tabular-nums text-white sm:text-2xl">
                {order.order_number || `#${order.id}`}
              </h1>
              <p className="mt-3 text-sm font-bold leading-7 text-white/65">
                {order.service_name || order.service_code || "طلب خدمة"}
              </p>
            </div>

            <div
              className={`inline-flex self-start items-center gap-2 rounded-full px-3 py-2 text-[10px] font-extrabold ring-1 ${currentMeta.className}`}
            >
              <CurrentIcon className="h-4 w-4" />
              {currentMeta.label}
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-[#edf2f4] sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "العميل",
              value: order.user?.name || "—",
              icon: UserRound,
            },
            {
              label: "رقم الجوال",
              value: order.user?.phone || "—",
              icon: Phone,
            },
            {
              label: "البرادة",
              value: order.cooler?.name || "—",
              icon: Droplets,
            },
            {
              label: "تاريخ الإنشاء",
              value: dateTime(order.created_at),
              icon: CalendarDays,
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

      {attachmentPreview ? (
        <div role="dialog" aria-modal="true" aria-label={attachmentPreview.name} className="fixed inset-0 z-[150] flex flex-col items-center justify-center gap-4 bg-[#061a2f]/90 p-5">
          <button type="button" className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0d2b4e]" onClick={() => {URL.revokeObjectURL(attachmentPreview.url);setAttachmentPreview(null);}}>إغلاق الصورة</button>
          <img src={attachmentPreview.url} alt={attachmentPreview.name} className="max-h-[82vh] max-w-full rounded-xl object-contain" />
        </div>
      ) : null}

      {success ? (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[18px] border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700"
        >
          {success}
        </motion.div>
      ) : null}

      {error ? (
        <div className="rounded-[18px] border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-6">
          {order.pricing_model === "quote" ? (
            <article className="rounded-[26px] border border-[#dfecef] bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-base font-extrabold text-[#0d2b4e]">معاينة الخدمة وتحديد السعر</h2>
              <p className="mt-2 text-xs leading-6 text-[#587183]">
                {order.quote_status === "awaiting_inspection"
                  ? "الطلب بانتظار المعاينة. بعد تحديد التكلفة يدويًا، يصل العرض للعميل للموافقة ثم الدفع."
                  : order.quote_status === "awaiting_approval"
                    ? "تم إرسال السعر للعميل وبانتظار موافقته قبل الدفع."
                    : order.quote_status === "approved"
                      ? "وافق العميل على السعر، ويمكنه الآن الدفع."
                      : "حالة عرض السعر: " + (order.quote_status || "لم يحدد")}
              </p>
              {order.quote_subtotal != null ? (
                <p className="mt-2 text-sm font-bold text-[#0d2b4e]">قيمة العرض قبل الضريبة: {money(order.quote_subtotal, order.currency)}</p>
              ) : null}
              {order.quote_notes ? <p className="mt-2 text-xs text-[#587183]">{order.quote_notes}</p> : null}
              {order.status === "pending" && (order.quote_status === "awaiting_inspection" || order.quote_status === "rejected") ? (
                <div className="mt-4 space-y-3">
                  <label className="block text-xs font-bold">السعر قبل الضريبة (ريال)</label>
                  <input type="number" min="0.01" step="0.01" value={quoteSubtotal}
                    onChange={(e) => setQuoteSubtotal(e.target.value)}
                    className="h-11 w-full rounded-xl border border-[#dce9ed] px-4" />
                  <label className="block text-xs font-bold">تفاصيل المعاينة والتكلفة</label>
                  <textarea rows={3} maxLength={2000} value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                    className="w-full rounded-xl border border-[#dce9ed] p-3" />
                  <button type="button" disabled={savingQuote || !(Number(quoteSubtotal) > 0)}
                    onClick={() => void submitQuote()}
                    className="w-full rounded-xl bg-[#0d2b4e] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
                    {savingQuote ? "جاري إرسال العرض..." : "اعتماد التكلفة وإرسال العرض للعميل"}
                  </button>
                </div>
              ) : null}
            </article>
          ) : null}
          <article className="rounded-[26px] border border-[#dfecef] bg-white p-5 shadow-[0_12px_34px_rgba(13,43,78,.04)] sm:p-6">
            <h2 className="text-[15px] font-extrabold text-[#0d2b4e]">
              تفاصيل الخدمة
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["الخدمة", order.service_name || order.service_code || "—"],
                ["الأولوية", order.priority === "urgent" ? "عاجل" : order.priority === "standard" ? "عادي" : order.priority || "عادي"],
                ["الموعد المفضل", order.preferred_date ? new Intl.DateTimeFormat("ar-SA-u-ca-gregory", { timeZone: "Asia/Riyadh", year: "numeric", month: "long", day: "numeric" }).format(new Date(order.preferred_date)) : "—"],
                ["الفترة", ({ morning: "صباحًا", noon: "ظهرًا", afternoon: "ظهرًا", evening: "مساءً" } as Record<string, string>)[order.preferred_time_slot || ""] || order.preferred_time_slot || "—"],
                [
                  "الكمية",
                  order.quantity
                    ? `${order.quantity} ${order.unit || ""}`.trim()
                    : "—",
                ],
                ["حالة الدفع", order.payment_status || "—"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[16px] bg-[#f7fafb] p-4">
                  <p className="text-[9px] font-bold text-[#97a7b1]">
                    {label}
                  </p>
                  <p className="mt-1.5 text-[11px] font-extrabold leading-6 text-[#38536a]">
                    {String(value)}
                  </p>
                </div>
              ))}
            </div>

            {order.service_data && Object.keys(order.service_data).length > 0 ? (
              <div className="mt-4 rounded-[16px] border border-[#e3edef] bg-white p-4">
                <p className="text-xs font-extrabold text-[#0d2b4e]">التفاصيل الإضافية التي أدخلها العميل</p>
                <div className="mt-3 space-y-2">{Object.entries(order.service_data).filter(([, value]) => value !== null && value !== "").map(([key, value]) => (
                  <div key={key} className="flex flex-wrap justify-between gap-2 text-xs"><span className="font-bold text-[#587183]">{({issue_type:"نوع المشكلة",description:"وصف المشكلة",option_code:"خدمة الفلاتر المختارة",filter_service:"خدمة الفلتر",filter_type:"نوع الفلتر",photos:"صور المشكلة",images:"المرفقات"} as Record<string,string>)[key] || key.replaceAll("_"," ")}</span><span className="max-w-full break-words text-[#0d2b4e]">{key === "option_code" ? ({five_stage:"تغيير الفلاتر الخمسة",ro_membrane:"تغيير غشاء RO",sterilization_cleaning:"تعقيم وتنظيف",inspection_diagnosis:"فحص وتشخيص"} as Record<string,string>)[String(value)] || String(value) : typeof value === "object" ? JSON.stringify(value) : String(value)}</span></div>
                ))}</div>
              </div>
            ) : null}
            {order.unit_price != null && order.quantity != null ? <p className="mt-3 text-xs font-bold text-[#38536a]">سعر الوحدة: {money(order.unit_price, order.currency)} × {order.quantity} {order.unit || ""}</p> : null}
            {order.attachments?.length ? (
              <div className="mt-4 rounded-[16px] border border-[#e3edef] bg-white p-4"><p className="text-xs font-extrabold text-[#0d2b4e]">صور ومرفقات العطل ({order.attachments.length})</p><div className="mt-3 flex flex-wrap gap-2">{order.attachments.map((attachment) => <button key={attachment.id} type="button" disabled={openingAttachment === attachment.id} onClick={() => void openAttachment(attachment.id)} className="rounded-xl border border-[#dce9ed] px-3 py-2 text-xs text-[#0d2b4e] disabled:opacity-50">{openingAttachment === attachment.id ? "جاري الفتح..." : attachment.original_name || `مرفق ${attachment.id}`}</button>)}</div></div>
            ) : null}
            {order.notes ? (
              <div className="mt-4 rounded-[16px] border border-[#e3edef] bg-white p-4">
                <p className="text-[9px] font-bold text-[#97a7b1]">ملاحظات العميل</p>
                <p className="mt-2 text-[12px] font-bold leading-7 text-[#496476]">
                  {order.notes}
                </p>
              </div>
            ) : null}
          </article>

          <article className="rounded-[26px] border border-[#dfecef] bg-white p-5 shadow-[0_12px_34px_rgba(13,43,78,.04)] sm:p-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-[18px] w-[18px] text-[#16a6c9]" />
              <h2 className="text-[15px] font-extrabold text-[#0d2b4e]">
                العنوان
              </h2>
            </div>

            <p className="mt-4 text-[12px] font-extrabold leading-7 text-[#38536a]">
              {addressText || order.address?.label || "لا توجد بيانات عنوان"}
            </p>

            {order.address?.notes ? (
              <p className="mt-2 text-[11px] font-bold leading-6 text-[#8699a5]">
                {order.address.notes}
              </p>
            ) : null}
          </article>

          <article className="rounded-[26px] border border-[#dfecef] bg-white p-5 shadow-[0_12px_34px_rgba(13,43,78,.04)] sm:p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-[18px] w-[18px] text-[#16a6c9]" />
              <h2 className="text-[15px] font-extrabold text-[#0d2b4e]">
                سجل حالة الطلب
              </h2>
            </div>

            <div className="mt-6 space-y-0">
              {(order.status_history || []).length ? (
                [...(order.status_history || [])]
                  .sort(
                    (a, b) =>
                      new Date(b.created_at || 0).getTime() -
                      new Date(a.created_at || 0).getTime(),
                  )
                  .map((history, index, list) => (
                    <div key={history.id} className="relative flex gap-4 pb-6">
                      {index < list.length - 1 ? (
                        <span className="absolute right-[15px] top-8 h-[calc(100%-18px)] w-px bg-[#dce9ed]" />
                      ) : null}

                      <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eaf8fb] ring-4 ring-white">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#16a6c9]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[11px] font-extrabold text-[#29475f]">
                            {statusLabel(history.to_status)}
                          </p>
                          <p className="text-[9px] font-bold text-[#9aabb5]">
                            {dateTime(history.created_at)}
                          </p>
                        </div>
                        <p className="mt-1 text-[10px] font-bold text-[#899ca8]">
                          {history.source === "admin"
                            ? "بواسطة الإدارة"
                            : "بواسطة المستخدم"}
                        </p>
                        {history.note ? (
                          <p className="mt-2 rounded-[12px] bg-[#f7fafb] px-3 py-2 text-[10px] font-bold leading-6 text-[#627b8b]">
                            {history.note}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))
              ) : (
                <p className="py-6 text-center text-xs font-bold text-[#9aabb5]">
                  لا يوجد سجل حالة حتى الآن.
                </p>
              )}
            </div>
          </article>
        </div>

        <div className="space-y-6">
          <article className="rounded-[26px] border border-[#dfecef] bg-white p-5 shadow-[0_12px_34px_rgba(13,43,78,.04)] sm:p-6">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-[18px] w-[18px] text-[#16a6c9]" />
              <h2 className="text-[15px] font-extrabold text-[#0d2b4e]">
                إدارة حالة الطلب
              </h2>
            </div>

            {allowedTransitions.length ? (
              <div className="mt-5">
                <label className="mb-2 block text-[10px] font-extrabold text-[#587183]">
                  الإجراء التالي
                </label>
                <select
                  value={nextStatus}
                  onChange={(event) => setNextStatus(event.target.value)}
                  className="h-12 w-full rounded-[15px] border border-[#dce9ed] bg-[#fbfdfe] px-4 text-[12px] font-extrabold text-[#38536a] outline-none focus:border-[#16a6c9]"
                >
                  <option value="">اختر الحالة</option>
                  {allowedTransitions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>

                <label className="mb-2 mt-4 block text-[10px] font-extrabold text-[#587183]">
                  ملاحظة للمستخدم
                </label>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="مثال: تم تأكيد الطلب وسيتم بدء التنفيذ قريبًا"
                  rows={4}
                  className="w-full resize-none rounded-[15px] border border-[#dce9ed] bg-[#fbfdfe] p-4 text-[12px] font-bold leading-6 text-[#38536a] outline-none placeholder:text-[#a0afb8] focus:border-[#16a6c9]"
                />

                <button
                  type="button"
                  onClick={() => void updateStatus()}
                  disabled={!nextStatus || saving}
                  className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[16px] bg-[#0d2b4e] text-xs font-extrabold text-white transition hover:bg-[#123e68] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {saving ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? "جاري الحفظ..." : "حفظ الحالة وإشعار المستخدم"}
                </button>

                {Number(order.total_amount || 0) > 0 &&
                order.payment_status !== "paid" ? (
                  <p className="mt-3 rounded-[12px] bg-amber-50 px-3 py-2 text-[10px] font-bold leading-6 text-amber-700">
                    ملاحظة: النظام يمنع بدء التنفيذ أو إكمال طلب مدفوع قبل تأكيد الدفع.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="mt-5 rounded-[16px] bg-[#f7fafb] p-4 text-center">
                <CheckCircle2 className="mx-auto h-6 w-6 text-[#16a6c9]" />
                <p className="mt-2 text-[11px] font-extrabold text-[#38536a]">
                  لا توجد نقلة حالة متاحة من الحالة الحالية.
                </p>
              </div>
            )}
          </article>

          <article className="rounded-[26px] border border-[#dfecef] bg-white p-5 shadow-[0_12px_34px_rgba(13,43,78,.04)] sm:p-6">
            <div className="flex items-center gap-2">
              <CircleDollarSign className="h-[18px] w-[18px] text-[#16a6c9]" />
              <h2 className="text-[15px] font-extrabold text-[#0d2b4e]">
                الملخص المالي
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              {[
                ["قيمة الخدمة قبل رسوم الاستعجال والضريبة", money(Math.max(0, Number(order.subtotal || 0) - Number(order.urgent_fee || 0)), order.currency)],
                ["رسوم عاجلة", money(order.urgent_fee, order.currency)],
                [
                  `الضريبة ${order.tax_rate ?? 0}%`,
                  money(order.tax_amount, order.currency),
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 text-[11px]"
                >
                  <span className="font-bold text-[#899ba7]">{label}</span>
                  <span className="font-black tabular-nums text-[#38536a]">
                    {value}
                  </span>
                </div>
              ))}

              <div className="my-4 h-px bg-[#e9f0f2]" />

              <div className="flex items-center justify-between gap-4">
                <span className="text-[12px] font-extrabold text-[#0d2b4e]">
                  الإجمالي
                </span>
                <span className="text-lg font-black tabular-nums text-[#16a6c9]">
                  {money(order.total_amount, order.currency)}
                </span>
              </div>
            </div>
          </article>

          <article className="rounded-[26px] border border-[#dfecef] bg-white p-5 shadow-[0_12px_34px_rgba(13,43,78,.04)] sm:p-6">
            <h2 className="text-[15px] font-extrabold text-[#0d2b4e]">
              الدفع والفاتورة
            </h2>

            <div className="mt-4 space-y-3">
              <div className="rounded-[15px] bg-[#f7fafb] p-4">
                <p className="text-[9px] font-bold text-[#97a7b1]">
                  حالة الدفع
                </p>
                <p
                  className={`mt-1 text-[11px] font-extrabold ${
                    order.payment_status === "paid"
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }`}
                >
                  {order.payment_status === "paid"
                    ? "مدفوع"
                    : order.payment_status || "بانتظار الدفع"}
                </p>
              </div>

              <div className="rounded-[15px] bg-[#f7fafb] p-4">
                <p className="text-[9px] font-bold text-[#97a7b1]">
                  عدد عمليات الدفع
                </p>
                <p className="mt-1 text-[11px] font-black tabular-nums text-[#38536a]">
                  {order.payments?.length || 0}
                </p>
              </div>

              <div className="rounded-[15px] bg-[#f7fafb] p-4">
                <p className="text-[9px] font-bold text-[#97a7b1]">
                  عدد الفواتير
                </p>
                <p className="mt-1 text-[11px] font-black tabular-nums text-[#38536a]">
                  {order.invoices?.length || 0}
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
