"use client";

import AppShell from "@/components/app/AppShell";
import { API_URL, ApiError, apiRequest } from "@/lib/api";
import { getAuthToken, removeAuthToken } from "@/lib/auth";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  CircleX,
  Download,
  FileText,
  ReceiptText,
  RotateCcw,
  Search,
  Share2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Invoice = {
  id: number;
  invoice_number: string;
  order_id: number;
  payment_id: number;
  status: "issued" | "paid" | "void" | "refunded";
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_code: string;
  service_name: string;
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
  total_amount: string;
  currency: string;
  issued_at: string | null;
  paid_at: string | null;
  created_at: string;
  order?: {
    id: number;
    order_number: string;
    status: string;
    payment_status: string;
  } | null;
  payment?: {
    id: number;
    method: string;
    status: string;
    transaction_id: string | null;
    paid_at: string | null;
    refunded_at: string | null;
  } | null;
};

type Pagination<T> = {
  current_page: number;
  data: T[];
  last_page: number;
  total: number;
};

type InvoicesResponse = {
  success: true;
  data: {
    invoices: Pagination<Invoice> | Invoice[];
  };
};

type ShareResponse = {
  success: true;
  message: string;
  data: {
    share_url: string;
    expires_at: string;
    expires_in_minutes: number;
  };
};

type FilterMode =
  | "all"
  | "paid"
  | "issued"
  | "refunded"
  | "void";

const filters: {
  value: FilterMode;
  label: string;
}[] = [
  {
    value: "all",
    label: "الكل",
  },
  {
    value: "paid",
    label: "مدفوعة",
  },
  {
    value: "issued",
    label: "صادرة",
  },
  {
    value: "refunded",
    label: "مستردة",
  },
  {
    value: "void",
    label: "ملغاة",
  },
];

export default function InvoicesPage() {
  const router = useRouter();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState<FilterMode>("all");
  const [search, setSearch] = useState("");

  const [downloadingId, setDownloadingId] =
    useState<number | null>(null);

  const [sharingId, setSharingId] =
    useState<number | null>(null);

  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    async function loadInvoices() {
      try {
        const response =
          await apiRequest<InvoicesResponse>(
            "/invoices",
            {
              token,
            }
          );

        const invoicePayload =
  response.data.invoices;

if (Array.isArray(invoicePayload)) {
  setInvoices(invoicePayload);
} else if (
  invoicePayload &&
  Array.isArray(invoicePayload.data)
) {
  setInvoices(invoicePayload.data);
} else {
  setInvoices([]);
}
      } catch (exception) {
        if (
          exception instanceof ApiError &&
          exception.status === 401
        ) {
          removeAuthToken();
          router.replace("/login");
          return;
        }

        setError("تعذر تحميل الفواتير");
      } finally {
        setLoading(false);
      }
    }

    void loadInvoices();
  }, [router]);

  const filteredInvoices = useMemo(() => {
    const safeInvoices = Array.isArray(invoices)
  ? invoices
  : [];
    const query = search
      .trim()
      .toLowerCase();

return safeInvoices.filter((invoice) => {
          const matchesFilter =
        filter === "all" ||
        invoice.status === filter;

      const matchesSearch =
        !query ||
        invoice.invoice_number
          .toLowerCase()
          .includes(query) ||
        invoice.service_name
          .toLowerCase()
          .includes(query) ||
        invoice.order?.order_number
          ?.toLowerCase()
          .includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [filter, invoices, search]);

const paidTotal = (Array.isArray(invoices) ? invoices : [])
    .filter(
      (invoice) =>
        invoice.status === "paid"
    )
    .reduce(
      (sum, invoice) =>
        sum +
        Number(invoice.total_amount),
      0
    );

  async function downloadInvoice(
    invoice: Invoice
  ) {
    const token = getAuthToken();

    if (!token) {
      return;
    }

    setDownloadingId(invoice.id);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/invoices/${invoice.id}/download`,
        {
          headers: {
            Accept: "application/pdf",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error();
      }

      const blob = await response.blob();
      const url =
        URL.createObjectURL(blob);

      const anchor =
        document.createElement("a");

      anchor.href = url;
      anchor.download = `${invoice.invoice_number}.pdf`;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(url);
    } catch {
      setError(
        "تعذر تنزيل الفاتورة"
      );
    } finally {
      setDownloadingId(null);
    }
  }

  async function previewInvoice(
    invoice: Invoice
  ) {
    const token = getAuthToken();

    if (!token) {
      return;
    }

    setError("");

    try {
      const response = await fetch(
        `${API_URL}/invoices/${invoice.id}/pdf`,
        {
          headers: {
            Accept: "application/pdf",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error();
      }

      const blob = await response.blob();
      const url =
        URL.createObjectURL(blob);

      window.open(url, "_blank");

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60_000);
    } catch {
      setError(
        "تعذر فتح الفاتورة"
      );
    }
  }

  async function shareInvoice(
    invoice: Invoice
  ) {
    const token = getAuthToken();

    if (!token) {
      return;
    }

    setSharingId(invoice.id);
    setError("");
    setMessage("");

    try {
      const response =
        await apiRequest<ShareResponse>(
          `/invoices/${invoice.id}/share`,
          {
            method: "POST",
            token,
          }
        );

      const shareUrl =
        response.data.share_url;

      if (
        navigator.share
      ) {
        await navigator.share({
          title: invoice.invoice_number,
          text: "فاتورة نمير",
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(
          shareUrl
        );

        setMessage(
          `تم نسخ رابط المشاركة، وهو صالح لمدة ${response.data.expires_in_minutes} دقيقة`
        );
      }
    } catch {
      setError(
        "تعذر إنشاء رابط المشاركة"
      );
    } finally {
      setSharingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f9fb]">
        <div className="flex flex-col items-center">
          <span className="h-11 w-11 animate-spin rounded-full border-[3px] border-[#d4e8ed] border-t-[#16a6c9]" />

          <p className="mt-4 text-sm font-extrabold text-[#718197]">
            جاري تحميل الفواتير...
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
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(22,166,201,.30),transparent_30%),linear-gradient(135deg,#123d67,#0d2b4e_55%,#081f39)]" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-2 text-[11px] font-extrabold text-[#70dff5]">
                <ReceiptText className="h-4 w-4" />
                السجل المالي
              </div>

              <h1 className="mt-4 text-[30px] font-extrabold text-white sm:text-[36px]">
                فواتيري
              </h1>

              <p className="mt-3 max-w-xl text-sm font-bold leading-7 text-white/55">
                اعرض فواتير خدماتك وحمّل نسخة PDF أو شاركها
                عند الحاجة.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <HeroStat
                label="عدد الفواتير"
                value={String(
                  invoices.length
                )}
              />

              <HeroStat
                label="إجمالي المدفوع"
                value={`${paidTotal.toFixed(
                  2
                )} ر.س`}
              />
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
                placeholder="ابحث برقم الفاتورة أو الخدمة..."
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

        {invoices.length === 0 ? (
          <EmptyInvoices />
        ) : filteredInvoices.length ===
          0 ? (
          <div className="mt-6 rounded-[27px] border border-dashed border-[#d6e5e9] bg-white px-6 py-16 text-center">
            <Search className="mx-auto h-8 w-8 text-[#9aabb5]" />

            <h2 className="mt-4 text-base font-extrabold text-[#0d2b4e]">
              لا توجد نتائج
            </h2>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filteredInvoices.map(
              (invoice, index) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  index={index}
                  downloading={
                    downloadingId ===
                    invoice.id
                  }
                  sharing={
                    sharingId === invoice.id
                  }
                  onPreview={() =>
                    void previewInvoice(
                      invoice
                    )
                  }
                  onDownload={() =>
                    void downloadInvoice(
                      invoice
                    )
                  }
                  onShare={() =>
                    void shareInvoice(
                      invoice
                    )
                  }
                />
              )
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function InvoiceCard({
  invoice,
  index,
  downloading,
  sharing,
  onPreview,
  onDownload,
  onShare,
}: {
  invoice: Invoice;
  index: number;
  downloading: boolean;
  sharing: boolean;
  onPreview: () => void;
  onDownload: () => void;
  onShare: () => void;
}) {
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
      className="rounded-[25px] border border-[#e0ecef] bg-white p-5 shadow-[0_10px_35px_rgba(13,43,78,.045)]"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-[17px] bg-[#eaf8fb] text-[#16a6c9]">
            <FileText className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-extrabold text-[#0d2b4e]">
                {invoice.service_name}
              </h2>

              <InvoiceStatus
                status={
                  invoice.status
                }
              />
            </div>

            <p
              dir="ltr"
              className="mt-1.5 w-fit text-[10px] font-extrabold text-[#8b9da9]"
            >
              {invoice.invoice_number}
            </p>

            <p className="mt-2 text-[11px] font-bold text-[#8799a6]">
              {invoice.issued_at
                ? formatDate(
                    invoice.issued_at
                  )
                : formatDate(
                    invoice.created_at
                  )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[420px]">
          <MiniInfo
            label="قبل الضريبة"
            value={`${Number(
              invoice.subtotal
            ).toFixed(2)} ر.س`}
          />

          <MiniInfo
            label={`الضريبة ${Number(
              invoice.tax_rate
            ).toFixed(0)}%`}
            value={`${Number(
              invoice.tax_amount
            ).toFixed(2)} ر.س`}
          />

          <MiniInfo
            label="الإجمالي"
            value={`${Number(
              invoice.total_amount
            ).toFixed(2)} ر.س`}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onPreview}
            className="h-10 rounded-[12px] bg-[#f2f7f9] px-4 text-[10px] font-extrabold text-[#0d2b4e]"
          >
            عرض PDF
          </button>

          <button
            type="button"
            onClick={onDownload}
            disabled={downloading}
            className="flex h-10 items-center gap-1.5 rounded-[12px] bg-[#0d2b4e] px-4 text-[10px] font-extrabold text-white disabled:opacity-60"
          >
            <Download className="h-3.5 w-3.5" />
            {downloading
              ? "جاري..."
              : "تنزيل"}
          </button>

          <button
            type="button"
            onClick={onShare}
            disabled={sharing}
            className="flex h-10 items-center gap-1.5 rounded-[12px] border border-[#dce8ec] bg-white px-4 text-[10px] font-extrabold text-[#16a6c9] disabled:opacity-60"
          >
            <Share2 className="h-3.5 w-3.5" />
            {sharing
              ? "جاري..."
              : "مشاركة"}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function InvoiceStatus({
  status,
}: {
  status: Invoice["status"];
}) {
  if (status === "paid") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-extrabold text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        مدفوعة
      </span>
    );
  }

  if (status === "refunded") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-extrabold text-blue-700">
        <RotateCcw className="h-3 w-3" />
        مستردة
      </span>
    );
  }

  if (status === "void") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[9px] font-extrabold text-red-600">
        <CircleX className="h-3 w-3" />
        ملغاة
      </span>
    );
  }

  return (
    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-extrabold text-amber-700">
      صادرة
    </span>
  );
}

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[15px] bg-[#f7fbfc] px-3 py-3">
      <p className="text-[9px] font-bold text-[#91a2ad]">
        {label}
      </p>

      <p className="mt-1 text-[11px] font-extrabold text-[#0d2b4e]">
        {value}
      </p>
    </div>
  );
}

function HeroStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-[140px] rounded-[18px] border border-white/10 bg-white/[0.06] px-4 py-3">
      <p className="text-[10px] font-bold text-white/40">
        {label}
      </p>

      <p className="mt-1 text-lg font-extrabold text-white">
        {value}
      </p>
    </div>
  );
}

function EmptyInvoices() {
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
      className="mt-7 rounded-[30px] border border-[#deebef] bg-white px-6 py-16 text-center shadow-[0_18px_60px_rgba(13,43,78,.05)]"
    >
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[25px] bg-[#eaf8fb]">
        <ReceiptText className="h-8 w-8 text-[#16a6c9]" />
      </div>

      <h2 className="mt-5 text-xl font-extrabold text-[#0d2b4e]">
        لا توجد فواتير حتى الآن
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm font-bold leading-7 text-[#8094a2]">
        ستظهر الفواتير هنا تلقائيًا بعد إتمام عمليات
        الدفع للخدمات المدفوعة.
      </p>
    </motion.div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(
    "ar-SA",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  ).format(new Date(value));
}