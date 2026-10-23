"use client";

import AdminEmpty from "@/components/admin/AdminEmpty";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { ApiError, apiRequest } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import {
  CheckCircle2,
  RefreshCw,
  Save,
  Search,
  SlidersHorizontal,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Service = {
  id: number;
  code: string;
  name_ar?: string | null;
  name_en?: string | null;
  pricing_model?: string | null;
  base_price?: number | string | null;
  unit_price?: number | string | null;
  unit?: string | null;
  min_quantity?: number | string | null;
  max_quantity?: number | string | null;
  quantity_step?: number | string | null;
  urgent_fee?: number | string | null;
  is_active: boolean;
};

type ServicesResponse = {
  success: true;
  data: {
    services: Service[] | { data: Service[] };
  };
};

type ServiceResponse = {
  success: true;
  data: { service: Service };
};

function unwrap<T>(value: T[] | { data: T[] } | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : value.data || [];
}

function money(value?: number | string | null) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function pricingLabel(model?: string | null) {
  if (model === "per_unit") return "حسب الكمية";
  if (model === "quote") return "حسب المعاينة";
  return "سعر ثابت";
}

function priceSummary(service: Service) {
  if (service.pricing_model === "quote") {
    return {
      label: "التسعير",
      value: "حسب المعاينة",
    };
  }

  if (service.pricing_model === "per_unit") {
    return {
      label: service.unit ? `سعر ${service.unit}` : "سعر الوحدة",
      value: `${money(service.unit_price)} SAR`,
    };
  }

  return {
    label: "السعر",
    value: `${money(service.base_price)} SAR`,
  };
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<ServicesResponse>("/admin/services", {
        token,
      });
      setServices(unwrap(response.data.services));
    } catch (exception) {
      setError(
        exception instanceof ApiError
          ? exception.message
          : "تعذر تحميل الخدمات",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => { void load(); });
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return services;

    return services.filter((service) =>
      [service.code, service.name_ar, service.name_en]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [search, services]);

  async function saveService() {
    if (!editing || saving) return;
    const token = getAuthToken();
    if (!token) return;

    setSaving(true);
    setError("");

    try {
      const response = await apiRequest<ServiceResponse>(
        `/admin/services/${editing.id}`,
        {
          method: "PATCH",
          token,
          body: JSON.stringify({
            name_ar: editing.name_ar || null,
            name_en: editing.name_en || null,
            pricing_model: editing.pricing_model || "fixed",
            base_price: Number(editing.base_price || 0),
            unit_price:
              editing.unit_price === null || editing.unit_price === ""
                ? null
                : Number(editing.unit_price),
            unit: editing.unit || null,
            min_quantity:
              editing.min_quantity === null || editing.min_quantity === ""
                ? null
                : Number(editing.min_quantity),
            max_quantity:
              editing.max_quantity === null || editing.max_quantity === ""
                ? null
                : Number(editing.max_quantity),
            quantity_step:
              editing.quantity_step === null || editing.quantity_step === ""
                ? null
                : Number(editing.quantity_step),
            urgent_fee: Number(editing.urgent_fee || 0),
            is_active: editing.is_active,
          }),
        },
      );

      setServices((current) =>
        current.map((item) =>
          item.id === editing.id ? response.data.service : item,
        ),
      );
      setEditing(null);
    } catch (exception) {
      setError(
        exception instanceof ApiError
          ? exception.message
          : "تعذر حفظ الخدمة",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={SlidersHorizontal}
        eyebrow="إدارة الخدمات"
        title="الخدمات والأسعار"
        description="تحكم في أسعار الخدمات وحالة التفعيل ونموذج التسعير من لوحة الإدارة."
        action={
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex h-11 items-center gap-2 rounded-[14px] border border-white/10 bg-white/[0.08] px-4 text-xs font-extrabold text-white transition hover:bg-white/[0.14]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </button>
        }
      />

      <section className="rounded-[24px] border border-[#dfecef] bg-white p-4 sm:p-5">
        <div className="relative max-w-lg">
          <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a9b3]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث باسم الخدمة أو الكود..."
            className="h-12 w-full rounded-[15px] border border-[#dce9ed] bg-[#fbfdfe] pr-11 pl-4 text-xs font-bold text-[#0d2b4e] outline-none focus:border-[#16a6c9]"
          />
        </div>
      </section>

      {error ? (
        <div className="rounded-[18px] border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[26px] border border-[#dfecef] bg-white">
        {loading ? (
          <div className="grid min-h-[320px] place-items-center">
            <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#d8e8ec] border-t-[#16a6c9]" />
          </div>
        ) : filtered.length ? (
          <div className="grid gap-px bg-[#edf2f4] md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => setEditing({ ...service })}
                className="bg-white p-5 text-right transition hover:bg-[#fbfdfe]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-extrabold text-[#0d2b4e]">
                      {service.name_ar || service.name_en || service.code}
                    </p>
                    <p className="mt-1 text-[9px] font-black tracking-wide text-[#91a3ae]">
                      {service.code}
                    </p>
                  </div>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-extrabold ${
                      service.is_active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {service.is_active ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {service.is_active ? "مفعلة" : "موقوفة"}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-[14px] bg-[#f7fafb] p-3">
                    <p className="text-[9px] font-bold text-[#98a8b2]">
                      {priceSummary(service).label}
                    </p>
                    <p className="mt-1 text-[12px] font-black tabular-nums text-[#0d2b4e]">
                      {priceSummary(service).value}
                    </p>
                  </div>
                  <div className="rounded-[14px] bg-[#f7fafb] p-3">
                    <p className="text-[9px] font-bold text-[#98a8b2]">
                      نموذج التسعير
                    </p>
                    <p className="mt-1 text-[11px] font-extrabold text-[#38536a]">
                      {pricingLabel(service.pricing_model)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <AdminEmpty
            icon={SlidersHorizontal}
            title="لا توجد خدمات"
            description="لم يتم العثور على خدمات مطابقة."
          />
        )}
      </section>

      {editing ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-[#06192f]/45 p-4 backdrop-blur-[2px]">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-5 shadow-[0_30px_90px_rgba(3,20,40,.22)] sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold text-[#16a6c9]">
                  تعديل الخدمة
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-[#0d2b4e]">
                  {editing.name_ar || editing.code}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#f2f7f9] text-[#6f8493]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field
                label="الاسم بالعربية"
                value={editing.name_ar || ""}
                onChange={(value) =>
                  setEditing((current) =>
                    current ? { ...current, name_ar: value } : current,
                  )
                }
              />
              <Field
                label="الاسم بالإنجليزية"
                value={editing.name_en || ""}
                onChange={(value) =>
                  setEditing((current) =>
                    current ? { ...current, name_en: value } : current,
                  )
                }
              />
              <Field
                label="السعر الأساسي"
                type="number"
                value={String(editing.base_price ?? "")}
                onChange={(value) =>
                  setEditing((current) =>
                    current ? { ...current, base_price: value } : current,
                  )
                }
              />
              <Field
                label="سعر الوحدة"
                type="number"
                value={String(editing.unit_price ?? "")}
                onChange={(value) =>
                  setEditing((current) =>
                    current ? { ...current, unit_price: value } : current,
                  )
                }
              />
              <Field
                label="رسوم الطلب العاجل"
                type="number"
                value={String(editing.urgent_fee ?? "")}
                onChange={(value) =>
                  setEditing((current) =>
                    current ? { ...current, urgent_fee: value } : current,
                  )
                }
              />

              <div>
                <label className="mb-2 block text-[10px] font-extrabold text-[#587183]">
                  نموذج التسعير
                </label>
                <select
                  value={editing.pricing_model || "fixed"}
                  onChange={(event) =>
                    setEditing((current) =>
                      current
                        ? { ...current, pricing_model: event.target.value }
                        : current,
                    )
                  }
                  className="h-12 w-full rounded-[15px] border border-[#dce9ed] bg-[#fbfdfe] px-4 text-xs font-extrabold text-[#38536a] outline-none focus:border-[#16a6c9]"
                >
                  <option value="fixed">سعر ثابت</option>
                  <option value="per_unit">حسب الكمية</option>
                  <option value="quote">حسب المعاينة</option>
                </select>
              </div>
            </div>

            <label className="mt-5 flex cursor-pointer items-center justify-between rounded-[16px] bg-[#f7fafb] p-4">
              <span className="text-xs font-extrabold text-[#38536a]">
                الخدمة مفعلة
              </span>
              <input
                type="checkbox"
                checked={editing.is_active}
                onChange={(event) =>
                  setEditing((current) =>
                    current
                      ? { ...current, is_active: event.target.checked }
                      : current,
                  )
                }
                className="h-5 w-5 accent-[#16a6c9]"
              />
            </label>

            <button
              type="button"
              onClick={() => void saveService()}
              disabled={saving}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[16px] bg-[#0d2b4e] text-xs font-extrabold text-white transition hover:bg-[#123e68] disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-extrabold text-[#587183]">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-[15px] border border-[#dce9ed] bg-[#fbfdfe] px-4 text-xs font-bold text-[#38536a] outline-none focus:border-[#16a6c9]"
      />
    </div>
  );
}
