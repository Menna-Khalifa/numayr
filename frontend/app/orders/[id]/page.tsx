"use client";

import AppShell from "@/components/app/AppShell";
import { ApiError, apiRequest } from "@/lib/api";
import { getAuthToken, removeAuthToken } from "@/lib/auth";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleX,
  Clock3,
  CreditCard,
  Droplets,
  Filter,
  ImageIcon,
  MapPin,
  PackageCheck,
  ReceiptText,
  Snowflake,
  TimerReset,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type StatusHistory = {
  id: number;
  from_status: string | null;
  to_status: string;
  source: string | null;
  note: string | null;
  created_at: string;
};

type Attachment = {
  id: number;
  original_name: string;
  mime_type: string;
  size: number;
  url?: string | null;
};

type Order = {
  id: number;
  order_number: string;
  service_code: string;
  service_name: string;
  pricing_model: string;
  quote_status?: string | null;
  quote_subtotal?: string | null;
  quote_notes?: string | null;
  quantity: string | null;
  unit: string | null;
  base_price: string;
  unit_price: string;
  urgent_fee: string;
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
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
  service_data: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
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
    building: string | null;
  } | null;
  status_history?: StatusHistory[];
  statusHistory?: StatusHistory[];
  attachments?: Attachment[];
};

type OrderResponse = {
  success: true;
  data: {
    order: Order;
  };
};

type CancelResponse = {
  success: true;
  message: string;
  data: {
    order: Order;
  };
};

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cancelOpen, setCancelOpen] = useState(false);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [quoteMessage, setQuoteMessage] = useState("");

  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    async function loadOrder() {
      try {
        const response = await apiRequest<OrderResponse>(
          `/orders/${params.id}`,
          {
            token,
          }
        );

        setOrder(response.data.order);
      } catch (exception) {
        if (
          exception instanceof ApiError &&
          exception.status === 401
        ) {
          removeAuthToken();
          router.replace("/login");
          return;
        }

        if (
          exception instanceof ApiError &&
          exception.status === 404
        ) {
          setError("الطلب غير موجود أو لا تملك صلاحية الوصول إليه");
          return;
        }

        setError("تعذر تحميل تفاصيل الطلب");
      } finally {
        setLoading(false);
      }
    }

    void loadOrder();
  }, [params.id, router]);

  async function decideQuote(action: "approve" | "reject") {
    const token = getAuthToken();
    if (!token || !order || quoteBusy) return;
    setQuoteBusy(true);
    setQuoteMessage("");
    try {
      const response = await apiRequest<OrderResponse>(
        `/orders/${order.id}/quote/${action}`,
        { method: "POST", token }
      );
      setOrder(response.data.order);
      if (action === "approve") {
        router.push(`/orders/${order.id}/checkout`);
      } else {
        setQuoteMessage("تم رفض العرض وإبلاغ الإدارة.");
      }
    } catch (exception) {
      setQuoteMessage(exception instanceof ApiError
        ? exception.message : "تعذر تحديث قرار عرض السعر");
    } finally {
      setQuoteBusy(false);
    }
  }

  const history = useMemo(() => {
    return (
      order?.status_history ??
      order?.statusHistory ??
      []
    );
  }, [order]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f9fb]">
        <div className="flex flex-col items-center">
          <span className="h-11 w-11 animate-spin rounded-full border-[3px] border-[#d4e8ed] border-t-[#16a6c9]" />

          <p className="mt-4 text-sm font-extrabold text-[#718197]">
            جاري تحميل تفاصيل الطلب...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <AppShell>
        <div className="mx-auto max-w-[800px]">
          <div className="rounded-[28px] border border-red-100 bg-red-50 p-8 text-center">
            <CircleX className="mx-auto h-8 w-8 text-red-500" />

            <h1 className="mt-4 text-lg font-extrabold text-[#0d2b4e]">
              تعذر فتح الطلب
            </h1>

            <p className="mt-2 text-sm font-bold text-[#7c909f]">
              {error}
            </p>

            <Link
              href="/orders"
              className="mt-5 inline-flex h-11 items-center rounded-[14px] bg-[#0d2b4e] px-4 text-xs font-extrabold text-white"
            >
              العودة إلى طلباتي
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const canCancel =
    order.status === "pending" ||
    order.status === "confirmed";

  return (
    <AppShell>
      <div className="mx-auto max-w-[1450px]">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/orders"
            className="flex h-10 w-10 items-center justify-center rounded-[13px] border border-[#dce8ec] bg-white text-[#0d2b4e] shadow-sm"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>

          <div>
            <p className="text-[11px] font-extrabold text-[#16a6c9]">
              طلباتي
            </p>

            <p className="mt-0.5 text-xs font-bold text-[#7c909f]">
              تفاصيل الطلب
            </p>
          </div>
        </div>

        <motion.section
          initial={{
            opacity: 0,
            y: 16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="relative overflow-hidden rounded-[30px] bg-[#0d2b4e] p-5 shadow-[0_24px_70px_rgba(13,43,78,.15)] sm:p-8"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(22,166,201,.30),transparent_30%),linear-gradient(135deg,#123d67,#0d2b4e_55%,#081f39)]" />

          <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-[22px] bg-white/10 text-[#6cdef4]">
                {getServiceIcon(order.service_code)}
              </div>

              <div>
                <StatusBadge status={order.status} />

                <h1 className="mt-3 text-[27px] font-extrabold text-white sm:text-[34px]">
                  {order.service_name}
                </h1>

                <p
                  dir="ltr"
                  className="mt-2 w-fit text-xs font-extrabold text-white/45"
                >
                  {order.order_number}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {canCancel ? (
                <button
                  type="button"
                  onClick={() => setCancelOpen(true)}
                  className="flex h-[46px] items-center gap-2 rounded-[15px] border border-red-300/10 bg-red-400/10 px-4 text-xs font-extrabold text-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                  إلغاء الطلب
                </button>
              ) : null}

              <div className="flex h-[46px] items-center gap-2 rounded-[15px] bg-white/10 px-4 text-xs font-extrabold text-white">
                <CreditCard className="h-4 w-4 text-[#6cdef4]" />
                {getPaymentLabel(order.payment_status)}
              </div>
            </div>
          </div>
        </motion.section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <InfoCard
            icon={<Snowflake className="h-5 w-5" />}
            label="البرادة"
            value={order.cooler?.name || "غير محدد"}
          />

          <InfoCard
            icon={<MapPin className="h-5 w-5" />}
            label="العنوان"
            value={order.address?.label || "غير محدد"}
          />

          <InfoCard
            icon={<CalendarDays className="h-5 w-5" />}
            label="التاريخ"
            value={
              order.preferred_date
                ? formatDate(order.preferred_date)
                : formatDate(order.created_at)
            }
          />

          <InfoCard
            icon={<Clock3 className="h-5 w-5" />}
            label="الفترة"
            value={getTimeLabel(order.preferred_time_slot)}
          />
        </section>

        <section className="mt-7 grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
          <div className="space-y-6">
            <div className="rounded-[27px] border border-[#e0ecef] bg-white p-5 shadow-[0_12px_38px_rgba(13,43,78,.045)] sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#eaf8fb] text-[#16a6c9]">
                  <PackageCheck className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-[10px] font-extrabold text-[#16a6c9]">
                    حالة الطلب
                  </p>

                  <h2 className="mt-1 text-lg font-extrabold text-[#0d2b4e]">
                    رحلة الطلب
                  </h2>
                </div>
              </div>

              <div className="mt-7">
                <Timeline
                  currentStatus={order.status}
                  history={history}
                />
              </div>
            </div>

            <div className="rounded-[27px] border border-[#e0ecef] bg-white p-5 shadow-[0_12px_38px_rgba(13,43,78,.045)] sm:p-6">
              <h2 className="text-lg font-extrabold text-[#0d2b4e]">
                تفاصيل الخدمة
              </h2>

              <div className="mt-5 divide-y divide-[#edf3f5]">
                <DetailRow
                  label="نوع الخدمة"
                  value={order.service_name}
                />

                {order.quantity ? (
                  <DetailRow
                    label="الكمية"
                    value={`${Number(order.quantity).toLocaleString(
                      "ar-SA"
                    )} ${order.unit || ""}`}
                  />
                ) : null}

                <DetailRow
                  label="الأولوية"
                  value={
                    order.priority === "urgent"
                      ? "عاجل"
                      : "عادي"
                  }
                />

                {order.service_code === "maintenance" ? (
                  <>
                    <DetailRow
                      label="نوع المشكلة"
                      value={
                        getServiceDataValue(
                          order.service_data,
                          "issue_type"
                        ) || "غير محدد"
                      }
                    />

                    <DetailRow
                      label="وصف المشكلة"
                      value={
                        getServiceDataValue(
                          order.service_data,
                          "description"
                        ) || "غير محدد"
                      }
                    />
                  </>
                ) : null}

                {order.service_code === "filter_change" ? (
                  <DetailRow
                    label="الخيار"
                    value={
                      getServiceDataValue(
                        order.service_data,
                        "option_code"
                      ) || "غير محدد"
                    }
                  />
                ) : null}

                <DetailRow
                  label="الملاحظات"
                  value={order.notes || "لا توجد ملاحظات"}
                />
              </div>
            </div>

            {order.attachments &&
            order.attachments.length > 0 ? (
              <div className="rounded-[27px] border border-[#e0ecef] bg-white p-5 shadow-[0_12px_38px_rgba(13,43,78,.045)] sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#eaf8fb] text-[#16a6c9]">
                    <ImageIcon className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-[10px] font-extrabold text-[#16a6c9]">
                      المرفقات
                    </p>

                    <h2 className="mt-1 text-lg font-extrabold text-[#0d2b4e]">
                      صور الطلب
                    </h2>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {order.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex aspect-square items-center justify-center overflow-hidden rounded-[18px] border border-[#dce8ec] bg-[#f6fafb]"
                    >
                      {attachment.url ? (
                        <img
                          src={attachment.url}
                          alt={attachment.original_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="p-4 text-center">
                          <ImageIcon className="mx-auto h-7 w-7 text-[#9badb8]" />

                          <p className="mt-2 truncate text-[10px] font-bold text-[#8194a2]">
                            {attachment.original_name}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <aside className="space-y-6 xl:sticky xl:top-[100px] xl:h-fit">
            <div className="overflow-hidden rounded-[27px] border border-[#e0ecef] bg-white shadow-[0_18px_55px_rgba(13,43,78,.06)]">
              <div className="bg-[#0d2b4e] p-5">
                <p className="text-[10px] font-extrabold text-[#68dcf3]">
                  ملخص مالي
                </p>

                <h2 className="mt-1 text-lg font-extrabold text-white">
                  تفاصيل المبلغ
                </h2>
              </div>

              <div className="p-5">
                {order.pricing_model === "quote" ? (
                  <div className="rounded-[17px] bg-[#f4fafb] p-4">
                    <p className="text-sm font-extrabold text-[#0d2b4e]">خدمة تتطلب معاينة وتسعير</p>
                    {order.quote_status === "awaiting_inspection" || !order.quote_status ? (
                      <p className="mt-2 text-xs leading-6 text-[#587183]">طلبك بانتظار المعاينة وتحديد السعر من الإدارة. لن يتم تحصيل أي مبلغ الآن.</p>
                    ) : (
                      <>
                        <p className="mt-3 text-xs text-[#587183]">السعر قبل الضريبة: {Number(order.subtotal).toFixed(2)} ر.س</p>
                        <p className="mt-1 text-xs text-[#587183]">الضريبة: {Number(order.tax_amount).toFixed(2)} ر.س</p>
                        <p className="mt-2 text-lg font-extrabold text-[#0d2b4e]">الإجمالي: {Number(order.total_amount).toFixed(2)} ر.س</p>
                        {order.quote_notes ? <p className="mt-2 text-xs leading-6 text-[#587183]">{order.quote_notes}</p> : null}
                        {order.quote_status === "awaiting_approval" ? (
                          <div className="mt-4 space-y-2">
                            <p className="text-xs font-bold text-[#0d2b4e]">تم تحديد السعر وبانتظار موافقتك قبل الدفع.</p>
                            <button type="button" disabled={quoteBusy} onClick={() => void decideQuote("approve")}
                              className="w-full rounded-xl bg-[#16a6c9] p-3 text-sm font-bold text-white disabled:opacity-50">
                              الموافقة على السعر والدفع الآن
                            </button>
                            <button type="button" disabled={quoteBusy} onClick={() => void decideQuote("reject")}
                              className="w-full rounded-xl border border-[#dce8ec] p-3 text-xs font-bold text-[#0d2b4e] disabled:opacity-50">
                              رفض العرض
                            </button>
                          </div>
                        ) : order.quote_status === "rejected" ? (
                          <p className="mt-3 text-xs font-bold text-amber-700">رفضت العرض، والإدارة يمكنها مراجعته.</p>
                        ) : order.quote_status === "approved" ? (
                          <p className="mt-3 text-xs font-bold text-emerald-700">وافقت على السعر النهائي ويمكنك إتمام الدفع.</p>
                        ) : null}
                      </>
                    )}
                    {quoteMessage ? <p role="status" className="mt-3 text-xs text-[#0d2b4e]">{quoteMessage}</p> : null}
                  </div>
                ) : (
                  <>
                    <SummaryRow
                      label="قبل الضريبة"
                      value={`${Number(order.subtotal).toFixed(
                        2
                      )} ر.س`}
                    />

                    <SummaryRow
                      label={`الضريبة ${Number(
                        order.tax_rate
                      ).toFixed(0)}%`}
                      value={`${Number(order.tax_amount).toFixed(
                        2
                      )} ر.س`}
                    />

                    {Number(order.urgent_fee) > 0 ? (
                      <SummaryRow
                        label="رسوم الاستعجال"
                        value={`${Number(
                          order.urgent_fee
                        ).toFixed(2)} ر.س`}
                      />
                    ) : null}

                    <div className="my-4 border-t border-dashed border-[#dce8ec]" />

                    <div className="flex items-end justify-between">
                      <span className="text-xs font-bold text-[#8194a2]">
                        الإجمالي
                      </span>

                      <span className="text-2xl font-extrabold text-[#0d2b4e]">
                        {Number(order.total_amount).toFixed(2)}
                        <span className="mr-1 text-xs text-[#16a6c9]">
                          ر.س
                        </span>
                      </span>
                    </div>
                  </>
                )}

                {(order.pricing_model !== "quote" || order.quote_status === "approved") &&
                  order.payment_status !== "paid" &&
                  order.status !== "cancelled" ? (
                    <Link
                      href={`/orders/${order.id}/checkout`}
                      className="mt-5 block rounded-[16px] bg-[#16a6c9] px-5 py-3 text-center text-sm font-extrabold text-white"
                    >
                      الدفع الإلكتروني عبر ميسر
                    </Link>
                  ) : null}

                {order.payment_status === "paid" ? (
                  <Link
                    href={`/invoices?order=${order.id}`}
                    className="mt-5 flex items-center justify-center gap-2 rounded-[16px] border border-[#16a6c9]/25 bg-[#eaf8fb] px-5 py-3 text-sm font-extrabold text-[#0d2b4e] transition hover:bg-[#d7f1f8]"
                  >
                    <ReceiptText className="h-4 w-4 text-[#16a6c9]" />
                    عرض فاتورة هذا الطلب
                  </Link>
                ) : null}

                <div className="mt-5 rounded-[16px] border border-[#dcebef] bg-[#f4fafb] p-4">
                  <p className="text-[10px] font-bold text-[#879aa7]">
                    حالة الدفع
                  </p>

                  <p className="mt-1 text-xs font-extrabold text-[#0d2b4e]">
                    {getPaymentLabel(order.payment_status)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[27px] border border-[#e0ecef] bg-white p-5 shadow-[0_12px_38px_rgba(13,43,78,.045)]">
              <h2 className="text-base font-extrabold text-[#0d2b4e]">
                عنوان التنفيذ
              </h2>

              <div className="mt-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#eaf8fb] text-[#16a6c9]">
                  <MapPin className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-sm font-extrabold text-[#0d2b4e]">
                    {order.address?.label || "غير محدد"}
                  </p>

                  {order.address ? (
                    <p className="mt-1 text-xs font-bold leading-6 text-[#8295a2]">
                      {order.address.city}،{" "}
                      {order.address.district}،{" "}
                      {order.address.street}
                      {order.address.building
                        ? `، مبنى ${order.address.building}`
                        : ""}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </aside>
        </section>

        <AnimatePresence>
          {cancelOpen ? (
            <CancelOrderModal
              order={order}
              onClose={() => setCancelOpen(false)}
              onCancelled={(updatedOrder) => {
                setOrder(updatedOrder);
                setCancelOpen(false);
              }}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

function Timeline({
  currentStatus,
  history,
}: {
  currentStatus: Order["status"];
  history: StatusHistory[];
}) {
  const steps = [
    {
      status: "pending",
      label: "تم إنشاء الطلب",
    },
    {
      status: "confirmed",
      label: "تم التأكيد",
    },
    {
      status: "in_progress",
      label: "جاري التنفيذ",
    },
    {
      status: "completed",
      label: "تم الانتهاء",
    },
  ];

  if (currentStatus === "cancelled") {
    return (
      <div className="rounded-[20px] border border-red-100 bg-red-50 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-500">
            <CircleX className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-extrabold text-red-700">
              تم إلغاء الطلب
            </p>

            <p className="mt-1 text-xs font-bold text-red-500/75">
              {getLatestHistoryNote(history) ||
                "تم إلغاء الطلب"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = steps.findIndex(
    (item) => item.status === currentStatus
  );

  return (
    <div className="relative">
      {steps.map((step, index) => {
        const completed = index <= currentIndex;
        const active = index === currentIndex;

        const historyItem = history
          .slice()
          .reverse()
          .find(
            (item) => item.to_status === step.status
          );

        return (
          <div
            key={step.status}
            className="relative flex gap-4 pb-8 last:pb-0"
          >
            {index < steps.length - 1 ? (
              <span
                className={`absolute right-[19px] top-10 h-[calc(100%-20px)] w-px ${
                  index < currentIndex
                    ? "bg-[#16a6c9]"
                    : "bg-[#dce8ec]"
                }`}
              />
            ) : null}

            <div
              className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
                completed
                  ? active
                    ? "border-[#16a6c9] bg-[#16a6c9] text-white shadow-[0_0_0_6px_rgba(22,166,201,.10)]"
                    : "border-[#16a6c9] bg-[#eaf8fb] text-[#16a6c9]"
                  : "border-[#dce8ec] bg-white text-[#a0b0ba]"
              }`}
            >
              {completed ? (
                active ? (
                  <TimerReset className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )
              ) : (
                <Clock3 className="h-4 w-4" />
              )}
            </div>

            <div className="pt-1">
              <p
                className={`text-sm font-extrabold ${
                  completed
                    ? "text-[#0d2b4e]"
                    : "text-[#98a9b4]"
                }`}
              >
                {step.label}
              </p>

              {historyItem ? (
                <>
                  <p className="mt-1 text-[10px] font-bold text-[#8a9ca8]">
                    {formatDateTime(historyItem.created_at)}
                  </p>

                  {historyItem.note ? (
                    <p className="mt-1 text-xs font-bold text-[#7f929f]">
                      {historyItem.note}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="mt-1 text-[10px] font-bold text-[#a1b0b9]">
                  لم يصل الطلب لهذه المرحلة بعد
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-[#e0ecef] bg-white p-5 shadow-[0_10px_35px_rgba(13,43,78,.045)]">
      <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#eaf8fb] text-[#16a6c9]">
        {icon}
      </div>

      <p className="mt-4 text-[10px] font-extrabold text-[#8a9da9]">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-extrabold text-[#0d2b4e]">
        {value}
      </p>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-5 py-4 first:pt-0 last:pb-0">
      <span className="shrink-0 text-xs font-bold text-[#8497a4]">
        {label}
      </span>

      <span className="max-w-[65%] text-left text-xs font-extrabold leading-6 text-[#0d2b4e]">
        {value}
      </span>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-xs font-bold text-[#8497a4]">
        {label}
      </span>

      <span className="text-xs font-extrabold text-[#0d2b4e]">
        {value}
      </span>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: Order["status"];
}) {
  const map = {
    pending: {
      label: "جديد",
      cls: "bg-amber-400/15 text-amber-200",
    },
    confirmed: {
      label: "تم التأكيد",
      cls: "bg-blue-400/15 text-blue-200",
    },
    in_progress: {
      label: "قيد التنفيذ",
      cls: "bg-[#16a6c9]/20 text-[#6fe0f5]",
    },
    completed: {
      label: "مكتمل",
      cls: "bg-emerald-400/15 text-emerald-200",
    },
    cancelled: {
      label: "ملغي",
      cls: "bg-red-400/15 text-red-200",
    },
  };

  const item = map[status];

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-extrabold ${item.cls}`}
    >
      {item.label}
    </span>
  );
}

function CancelOrderModal({
  order,
  onClose,
  onCancelled,
}: {
  order: Order;
  onClose: () => void;
  onCancelled: (order: Order) => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const token = getAuthToken();

    if (!token) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response =
        await apiRequest<CancelResponse>(
          `/orders/${order.id}/cancel`,
          {
            method: "PATCH",
            token,
            body: JSON.stringify({
              reason: reason.trim() || null,
            }),
          }
        );

      onCancelled(response.data.order);
    } catch (exception) {
      if (exception instanceof ApiError) {
        setError(exception.message);
      } else {
        setError("تعذر إلغاء الطلب");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-[#061a2f]/50 backdrop-blur-[4px]"
      />

      <motion.div
        initial={{
          opacity: 0,
          scale: 0.95,
          y: 20,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.96,
        }}
        className="fixed inset-x-4 top-1/2 z-[90] mx-auto max-w-[460px] -translate-y-1/2 rounded-[28px] bg-white p-6 shadow-[0_35px_100px_rgba(5,24,44,.28)]"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-red-500">
              إلغاء الطلب
            </p>

            <h2 className="mt-1 text-lg font-extrabold text-[#0d2b4e]">
              هل تريد إلغاء الطلب؟
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#f3f7f9] text-[#718592]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-xs font-bold leading-6 text-[#8194a2]">
          يمكنك كتابة سبب الإلغاء اختياريًا.
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            value={reason}
            onChange={(event) =>
              setReason(event.target.value)
            }
            rows={4}
            placeholder="سبب الإلغاء..."
            className="mt-4 w-full resize-none rounded-[16px] border border-[#dce8ec] bg-[#fbfdfe] p-4 text-sm font-bold text-[#0d2b4e] outline-none focus:border-red-300"
          />

          {error ? (
            <div className="mt-4 rounded-[14px] bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
              {error}
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-[48px] rounded-[14px] border border-[#dce8ec] text-xs font-extrabold text-[#718592]"
            >
              رجوع
            </button>

            <button
              type="submit"
              disabled={loading}
              className="h-[48px] rounded-[14px] bg-red-500 text-xs font-extrabold text-white disabled:opacity-60"
            >
              {loading
                ? "جاري الإلغاء..."
                : "تأكيد الإلغاء"}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}

function getServiceIcon(code: string) {
  if (code === "water_refill") {
    return <Droplets className="h-7 w-7" />;
  }

  if (code === "maintenance") {
    return <Wrench className="h-7 w-7" />;
  }

  if (code === "filter_change") {
    return <Filter className="h-7 w-7" />;
  }

  return <PackageCheck className="h-7 w-7" />;
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

function getServiceDataValue(
  data: Record<string, unknown> | null,
  key: string
) {
  if (!data) {
    return null;
  }

  const value = data[key];

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  return null;
}

function getLatestHistoryNote(
  history: StatusHistory[]
) {
  if (history.length === 0) {
    return null;
  }

  return history[history.length - 1]?.note ?? null;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}