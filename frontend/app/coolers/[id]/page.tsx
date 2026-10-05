"use client";

import AppShell from "@/components/app/AppShell";
import { ApiError, apiRequest } from "@/lib/api";
import { getAuthToken, removeAuthToken } from "@/lib/auth";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  CircleAlert,
  Droplets,
  Edit3,
  Filter,
  Gauge,
  MapPin,
  Snowflake,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type Address = {
  id?: number;
  label?: string;
  address_line?: string;
  city?: string;
};

type Cooler = {
  id: number;
  name: string;
  photo: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  landmark: string | null;
  filter_type: string | null;
  filter_installed_at: string | null;
  notes: string | null;
  status: string | null;
  health_score: number | null;
  is_active: boolean;
  address?: Address | null;
};

type CoolerResponse = {
  success: true;
  data: {
    cooler: Cooler;
  };
};

type UpdateResponse = {
  success: true;
  message: string;
  data: {
    cooler: Cooler;
  };
};

export default function CoolerDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [cooler, setCooler] = useState<Cooler | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    async function loadCooler() {
      try {
        const response = await apiRequest<CoolerResponse>(
          `/coolers/${params.id}`,
          {
            token,
          }
        );

        setCooler(response.data.cooler);
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
          setError("البرادة غير موجودة أو لا تملك صلاحية الوصول إليها");
          return;
        }

        setError("تعذر تحميل بيانات البرادة");
      } finally {
        setLoading(false);
      }
    }

    void loadCooler();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f9fb]">
        <div className="flex flex-col items-center">
          <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#d5e9ee] border-t-[#16a6c9]" />
          <p className="mt-4 text-sm font-extrabold text-[#718197]">
            جاري تحميل بيانات البرادة...
          </p>
        </div>
      </div>
    );
  }

  if (!cooler) {
    return (
      <AppShell>
        <div className="mx-auto max-w-[900px]">
          <div className="rounded-[28px] border border-red-100 bg-red-50 p-8 text-center">
            <CircleAlert className="mx-auto h-8 w-8 text-red-500" />

            <h1 className="mt-4 text-lg font-extrabold text-[#0d2b4e]">
              تعذر فتح البرادة
            </h1>

            <p className="mt-2 text-sm font-bold text-[#7c909f]">
              {error || "حدث خطأ غير متوقع"}
            </p>

            <Link
              href="/coolers"
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-[14px] bg-[#0d2b4e] px-4 text-xs font-extrabold text-white"
            >
              العودة إلى براداتي
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex items-center gap-2">
          <Link
            href="/coolers"
            className="flex h-10 w-10 items-center justify-center rounded-[13px] border border-[#dce8ec] bg-white text-[#0d2b4e] shadow-sm"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>

          <div>
            <p className="text-[11px] font-extrabold text-[#16a6c9]">
              براداتي
            </p>

            <p className="mt-0.5 text-xs font-bold text-[#7c909f]">
              تفاصيل البرادة
            </p>
          </div>
        </div>

        <motion.section
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="relative overflow-hidden rounded-[30px] bg-[#0d2b4e] p-5 shadow-[0_24px_70px_rgba(13,43,78,.16)] sm:p-7 lg:p-9"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(22,166,201,.28),transparent_30%),radial-gradient(circle_at_90%_100%,rgba(73,213,240,.10),transparent_30%),linear-gradient(135deg,#123c66,#0d2b4e_55%,#081f39)]" />

          <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-[120px] w-[120px] shrink-0 items-center justify-center overflow-hidden rounded-[28px] bg-[#def5f9] shadow-[0_18px_45px_rgba(0,0,0,.18)]">
                {cooler.photo ? (
                  <img
                    src={cooler.photo}
                    alt={cooler.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Snowflake className="h-12 w-12 text-[#16a6c9]" />
                )}
              </div>

              <div>
                <StatusBadge cooler={cooler} />

                <h1 className="mt-3 text-[28px] font-extrabold text-white sm:text-[34px]">
                  {cooler.name}
                </h1>

                <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-white/55">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-[#5fdcf3]" />
                    {cooler.landmark ||
                      cooler.address?.label ||
                      "لم يتم تحديد الموقع"}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Filter className="h-4 w-4 text-[#5fdcf3]" />
                    {cooler.filter_type || "نوع الفلتر غير محدد"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="flex h-[48px] items-center gap-2 rounded-[15px] bg-white px-4 text-xs font-extrabold text-[#0d2b4e]"
              >
                <Edit3 className="h-4 w-4 text-[#16a6c9]" />
                تعديل
              </button>

              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="flex h-[48px] items-center gap-2 rounded-[15px] border border-red-300/15 bg-red-400/10 px-4 text-xs font-extrabold text-red-100"
              >
                <Trash2 className="h-4 w-4" />
                حذف
              </button>
            </div>
          </div>
        </motion.section>

        <section className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<Gauge className="h-5 w-5" />}
            label="حالة البرادة"
            value={
              cooler.health_score !== null
                ? `${cooler.health_score}%`
                : "بانتظار التقييم"
            }
          />

          <StatCard
            icon={<Filter className="h-5 w-5" />}
            label="نوع الفلتر"
            value={cooler.filter_type || "غير محدد"}
          />

          <StatCard
            icon={<CalendarDays className="h-5 w-5" />}
            label="تاريخ تركيب الفلتر"
            value={
              cooler.filter_installed_at
                ? formatDate(cooler.filter_installed_at)
                : "غير محدد"
            }
          />

          <StatCard
            icon={<MapPin className="h-5 w-5" />}
            label="الموقع"
            value={cooler.landmark || "غير محدد"}
          />
        </section>

        <section className="mt-8">
          <div className="mb-5">
            <p className="text-[11px] font-extrabold text-[#16a6c9]">
              الخدمات السريعة
            </p>

            <h2 className="mt-1 text-xl font-extrabold text-[#0d2b4e]">
              ماذا تحتاج لهذه البرادة؟
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <QuickAction
              title="تعبئة المياه"
              description="اختر الكمية المناسبة وابدأ الطلب."
              icon={<Droplets className="h-6 w-6" />}
              href={`/services/refill?cooler=${cooler.id}`}
            />

            <QuickAction
              title="طلب صيانة"
              description="حدد المشكلة وسجل طلب الصيانة."
              icon={<Wrench className="h-6 w-6" />}
              href={`/services/maintenance?cooler=${cooler.id}`}
            />

            <QuickAction
              title="خدمة الفلاتر"
              description="اختر خدمة الفلتر المناسبة."
              icon={<Filter className="h-6 w-6" />}
              href={`/services/filters?cooler=${cooler.id}`}
            />
          </div>
        </section>

        <section className="mt-8 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-[26px] border border-[#e1edf1] bg-white p-5 shadow-[0_12px_38px_rgba(13,43,78,.045)] sm:p-6">
            <h2 className="text-lg font-extrabold text-[#0d2b4e]">
              بيانات البرادة
            </h2>

            <div className="mt-6 divide-y divide-[#edf3f5]">
              <DetailRow
                label="اسم البرادة"
                value={cooler.name}
              />

              <DetailRow
                label="المعلم القريب"
                value={cooler.landmark || "غير محدد"}
              />

              <DetailRow
                label="خط العرض"
                value={
                  cooler.latitude !== null
                    ? String(cooler.latitude)
                    : "غير محدد"
                }
              />

              <DetailRow
                label="خط الطول"
                value={
                  cooler.longitude !== null
                    ? String(cooler.longitude)
                    : "غير محدد"
                }
              />

              <DetailRow
                label="نوع الفلتر"
                value={cooler.filter_type || "غير محدد"}
              />
            </div>
          </div>

          <div className="rounded-[26px] border border-[#e1edf1] bg-white p-5 shadow-[0_12px_38px_rgba(13,43,78,.045)] sm:p-6">
            <h2 className="text-lg font-extrabold text-[#0d2b4e]">
              الملاحظات
            </h2>

            <div className="mt-5 min-h-[160px] rounded-[20px] bg-[#f7fbfc] p-4">
              <p className="text-sm font-bold leading-7 text-[#7a8e9c]">
                {cooler.notes || "لا توجد ملاحظات مسجلة لهذه البرادة."}
              </p>
            </div>
          </div>
        </section>

        <AnimatePresence>
          {editOpen ? (
            <EditCoolerModal
              cooler={cooler}
              onClose={() => setEditOpen(false)}
              onUpdated={(updated) => {
                setCooler(updated);
                setEditOpen(false);
              }}
            />
          ) : null}

          {deleteOpen ? (
            <DeleteCoolerModal
              cooler={cooler}
              onClose={() => setDeleteOpen(false)}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

function StatusBadge({
  cooler,
}: {
  cooler: Cooler;
}) {
  if (
    cooler.status === "good" ||
    (cooler.health_score !== null &&
      cooler.health_score >= 70)
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1.5 text-[10px] font-extrabold text-emerald-200">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
        حالة جيدة
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-extrabold text-white/65">
      <span className="h-1.5 w-1.5 rounded-full bg-[#6eddf3]" />
      بانتظار التقييم
    </span>
  );
}

function StatCard({
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

      <p className="mt-4 text-[11px] font-extrabold text-[#8a9da9]">
        {label}
      </p>

      <p className="mt-1 text-sm font-extrabold text-[#0d2b4e]">
        {value}
      </p>
    </div>
  );
}

function QuickAction({
  title,
  description,
  icon,
  href,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[150px] items-start justify-between rounded-[24px] border border-[#e0ecef] bg-white p-5 shadow-[0_12px_38px_rgba(13,43,78,.045)] transition hover:-translate-y-1 hover:border-[#bce5ee] hover:shadow-[0_20px_48px_rgba(13,43,78,.08)]"
    >
      <div>
        <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#eaf8fb] text-[#16a6c9]">
          {icon}
        </div>

        <h3 className="mt-4 text-sm font-extrabold text-[#0d2b4e]">
          {title}
        </h3>

        <p className="mt-2 text-xs font-bold leading-6 text-[#8497a4]">
          {description}
        </p>
      </div>

      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#f3f8fa] text-[#8194a2] transition group-hover:bg-[#0d2b4e] group-hover:text-white">
        <ArrowLeft className="h-4 w-4" />
      </span>
    </Link>
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
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <span className="text-xs font-bold text-[#8497a4]">
        {label}
      </span>

      <span className="text-left text-xs font-extrabold text-[#0d2b4e]">
        {value}
      </span>
    </div>
  );
}

function EditCoolerModal({
  cooler,
  onClose,
  onUpdated,
}: {
  cooler: Cooler;
  onClose: () => void;
  onUpdated: (cooler: Cooler) => void;
}) {
  const [name, setName] = useState(cooler.name);
  const [landmark, setLandmark] = useState(
    cooler.landmark || ""
  );
  const [filterType, setFilterType] = useState(
    cooler.filter_type || ""
  );
  const [filterInstalledAt, setFilterInstalledAt] =
    useState(
      cooler.filter_installed_at
        ? cooler.filter_installed_at.slice(0, 10)
        : ""
    );
  const [notes, setNotes] = useState(cooler.notes || "");

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const token = getAuthToken();

    if (!token) {
      return;
    }

    setError("");
    setSaving(true);

    try {
      const response =
        await apiRequest<UpdateResponse>(
          `/coolers/${cooler.id}`,
          {
            method: "PUT",
            token,
            body: JSON.stringify({
              name: name.trim(),
              landmark: landmark.trim() || null,
              filter_type: filterType.trim() || null,
              filter_installed_at:
                filterInstalledAt || null,
              notes: notes.trim() || null,
            }),
          }
        );

      onUpdated(response.data.cooler);
    } catch (exception) {
      if (exception instanceof ApiError) {
        setError(exception.message);
      } else {
        setError("تعذر تحديث بيانات البرادة");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-[#05182c]/45 backdrop-blur-[3px]"
      />

      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 15, scale: 0.97 }}
        className="fixed inset-x-4 top-1/2 z-[90] mx-auto max-w-[520px] -translate-y-1/2 overflow-hidden rounded-[28px] bg-white shadow-[0_30px_100px_rgba(5,24,44,.26)]"
      >
        <div className="flex items-center justify-between bg-[#0d2b4e] px-5 py-4">
          <h2 className="font-extrabold text-white">
            تعديل البرادة
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-white/10 text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="space-y-4">
            <Field
              label="اسم البرادة"
              value={name}
              onChange={setName}
            />

            <Field
              label="أقرب معلم"
              value={landmark}
              onChange={setLandmark}
            />

            <Field
              label="نوع الفلتر"
              value={filterType}
              onChange={setFilterType}
            />

            <div>
              <label className="mb-2 block text-xs font-extrabold text-[#0d2b4e]">
                تاريخ تركيب الفلتر
              </label>

              <input
                type="date"
                value={filterInstalledAt}
                onChange={(event) =>
                  setFilterInstalledAt(event.target.value)
                }
                className="h-[52px] w-full rounded-[15px] border border-[#dce8ec] px-4 text-sm font-bold text-[#0d2b4e] outline-none focus:border-[#16a6c9]"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-extrabold text-[#0d2b4e]">
                الملاحظات
              </label>

              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                className="w-full resize-none rounded-[15px] border border-[#dce8ec] p-4 text-sm font-bold text-[#0d2b4e] outline-none focus:border-[#16a6c9]"
              />
            </div>

            {error ? (
              <div className="rounded-[14px] bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="flex h-[52px] w-full items-center justify-center rounded-[15px] bg-[#0d2b4e] text-xs font-extrabold text-white disabled:opacity-60"
            >
              {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}

function DeleteCoolerModal({
  cooler,
  onClose,
}: {
  cooler: Cooler;
  onClose: () => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    const token = getAuthToken();

    if (!token) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await apiRequest(`/coolers/${cooler.id}`, {
        method: "DELETE",
        token,
      });

      router.replace("/coolers");
    } catch (exception) {
      if (exception instanceof ApiError) {
        setError(exception.message);
      } else {
        setError("تعذر حذف البرادة");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-[#05182c]/50 backdrop-blur-[3px]"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="fixed inset-x-4 top-1/2 z-[90] mx-auto max-w-[420px] -translate-y-1/2 rounded-[26px] bg-white p-6 text-center shadow-[0_30px_100px_rgba(5,24,44,.25)]"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <Trash2 className="h-7 w-7 text-red-500" />
        </div>

        <h2 className="mt-5 text-lg font-extrabold text-[#0d2b4e]">
          حذف البرادة؟
        </h2>

        <p className="mt-2 text-sm font-bold leading-6 text-[#7c909f]">
          سيتم حذف {cooler.name} من حسابك.
        </p>

        {error ? (
          <div className="mt-4 rounded-[14px] bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-[48px] rounded-[14px] border border-[#dce8ec] text-xs font-extrabold text-[#718592]"
          >
            تراجع
          </button>

          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="h-[48px] rounded-[14px] bg-red-500 text-xs font-extrabold text-white disabled:opacity-60"
          >
            {deleting ? "جاري الحذف..." : "حذف البرادة"}
          </button>
        </div>
      </motion.div>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-extrabold text-[#0d2b4e]">
        {label}
      </label>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[52px] w-full rounded-[15px] border border-[#dce8ec] px-4 text-sm font-bold text-[#0d2b4e] outline-none focus:border-[#16a6c9]"
      />
    </div>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}