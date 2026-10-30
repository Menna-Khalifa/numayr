"use client";

import AppShell from "@/components/app/AppShell";
import { API_URL, ApiError, apiRequest } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  ChevronLeft,
  CircleAlert,
  Clock3,
  Droplets,
  Filter,
  Grid2X2,
  ImagePlus,
  List,
  MapPin,
  Plus,
  Search,
  Snowflake,
  Sparkles,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

type Address = {
  id: number;
  label?: string | null;
  city?: string | null;
  district?: string | null;
};

type Cooler = {
  id: number;
  name: string;
  photo?: string | null;
  photo_url?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  landmark?: string | null;
  filter_type?: string | null;
  water_source?: "network" | "tanker" | null;
  tank_capacity_liters?: number | null;
  filter_installed_at?: string | null;
  status?: string | null;
  approval_status?: string | null;
  rejection_reason?: string | null;
  health_score?: number | null;
  notes?: string | null;
  is_active: boolean;
  created_at?: string | null;
  address?: Address | null;
};

type CoolersResponse = {
  success: true;
  data: {
    coolers: Cooler[];
  };
};

type StoreCoolerResponse = {
  success: true;
  message: string;
  data: {
    cooler: Cooler;
  };
};

const steps = [
  { id: 1, title: "المعلومات" },
  { id: 2, title: "الموقع" },
  { id: 3, title: "الصورة والفلتر" },
];

function photoSrc(cooler: Cooler) {
  return cooler.photo_url || null;
}

export default function CoolersPage() {
  const [coolers, setCoolers] = useState<Cooler[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<
    "all" | "pending" | "approved" | "attention"
  >("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      queueMicrotask(() => {
        setPageError("انتهت جلسة الدخول");
        setLoading(false);
      });
      return;
    }

    let active = true;

    async function load() {
      try {
        const response = await apiRequest<CoolersResponse>("/coolers", {
          token,
        });

        if (active) {
          setCoolers(response.data.coolers);
        }
      } catch (exception) {
        if (!active) return;

        setPageError(
          exception instanceof ApiError
            ? exception.message
            : "تعذر تحميل البرادات",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    // Refresh approval decisions when the customer returns to this tab.
    // Admin reviews are persisted in the API; an already mounted customer
    // page otherwise continues showing the previous pending status.
    const refreshOnFocus = () => {
      if (document.visibilityState === "visible") void load();
    };
    void load();
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnFocus);

    return () => {
      active = false;
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, []);

  const filteredCoolers = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return coolers.filter((cooler) => {
      const searchMatches =
        normalized === "" ||
        cooler.name.toLowerCase().includes(normalized) ||
        (cooler.landmark || "").toLowerCase().includes(normalized) ||
        (cooler.address?.label || "").toLowerCase().includes(normalized);

      if (!searchMatches) return false;

      if (filterMode === "pending") {
        return cooler.approval_status === "pending_review";
      }

      if (filterMode === "approved") {
        return cooler.approval_status === "approved";
      }

      if (filterMode === "attention") {
        return (
          cooler.approval_status === "rejected" ||
          cooler.approval_status === "disabled" ||
          cooler.status === "attention" ||
          cooler.status === "warning"
        );
      }

      return true;
    });
  }, [coolers, filterMode, search]);

  function handleCoolerCreated(cooler: Cooler) {
    setCoolers((current) => [cooler, ...current]);
    setAddOpen(false);
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1500px] pb-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-[28px] font-extrabold leading-[1.45] text-[#0d2b4e] sm:text-[34px]">
              براداتي
            </h1>
            <p className="mt-2 text-sm font-bold leading-7 text-[#7c909f]">
              تابع البرادات وحالة اعتمادها وخدماتها من مكان واحد.
            </p>
          </div>

          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setAddOpen(true)}
            className="flex h-[52px] items-center justify-center gap-2 rounded-[17px] bg-[#0d2b4e] px-5 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(13,43,78,.18)]"
          >
            <Plus className="h-[18px] w-[18px]" />
            <span>إضافة برادة</span>
          </motion.button>
        </motion.div>

        {pageError ? (
          <div className="mt-5 flex items-center gap-3 rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            <CircleAlert className="h-5 w-5" />
            {pageError}
          </div>
        ) : null}

        <section className="mt-7 rounded-[25px] border border-[#e1edf1] bg-white p-4 shadow-[0_10px_35px_rgba(13,43,78,.04)] sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-[400px]">
              <Search className="absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#96a8b4]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ابحث باسم البرادة أو الموقع..."
                className="h-[50px] w-full rounded-[16px] border border-[#dfeaec] bg-[#f9fcfd] pr-11 pl-4 text-sm font-bold text-[#0d2b4e] outline-none transition focus:border-[#16a6c9]"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-wrap rounded-[15px] bg-[#f2f7f9] p-1">
                <FilterButton active={filterMode === "all"} onClick={() => setFilterMode("all")}>
                  الكل
                </FilterButton>
                <FilterButton active={filterMode === "pending"} onClick={() => setFilterMode("pending")}>
                  قيد المراجعة
                </FilterButton>
                <FilterButton active={filterMode === "approved"} onClick={() => setFilterMode("approved")}>
                  معتمدة
                </FilterButton>
                <FilterButton active={filterMode === "attention"} onClick={() => setFilterMode("attention")}>
                  تحتاج متابعة
                </FilterButton>
              </div>

              <div className="flex w-fit rounded-[14px] border border-[#e1ecef] bg-white p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`flex h-9 w-9 items-center justify-center rounded-[10px] transition ${
                    viewMode === "grid" ? "bg-[#0d2b4e] text-white" : "text-[#8b9eaa]"
                  }`}
                  aria-label="عرض شبكي"
                >
                  <Grid2X2 className="h-[17px] w-[17px]" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`flex h-9 w-9 items-center justify-center rounded-[10px] transition ${
                    viewMode === "list" ? "bg-[#0d2b4e] text-white" : "text-[#8b9eaa]"
                  }`}
                  aria-label="عرض قائمة"
                >
                  <List className="h-[17px] w-[17px]" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="grid min-h-[360px] place-items-center">
            <span className="h-11 w-11 animate-spin rounded-full border-[3px] border-[#d8e8ec] border-t-[#16a6c9]" />
          </div>
        ) : coolers.length === 0 ? (
          <EmptyState onAdd={() => setAddOpen(true)} />
        ) : filteredCoolers.length === 0 ? (
          <div className="mt-6 rounded-[26px] border border-dashed border-[#d7e6ea] bg-white px-6 py-16 text-center">
            <Search className="mx-auto h-8 w-8 text-[#9db0bb]" />
            <h2 className="mt-4 text-base font-extrabold text-[#0d2b4e]">
              لا توجد نتائج
            </h2>
            <p className="mt-2 text-sm font-bold text-[#8194a2]">
              جرّب تغيير البحث أو الفلتر.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredCoolers.map((cooler, index) => (
              <CoolerGridCard key={cooler.id} cooler={cooler} index={index} />
            ))}
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filteredCoolers.map((cooler, index) => (
              <CoolerListCard key={cooler.id} cooler={cooler} index={index} />
            ))}
          </div>
        )}

        <AnimatePresence>
          {addOpen ? (
            <AddCoolerModal
              onClose={() => setAddOpen(false)}
              onCreated={handleCoolerCreated}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <section className="relative mt-7 overflow-hidden rounded-[30px] border border-[#deebef] bg-white px-6 py-16 text-center shadow-[0_18px_60px_rgba(13,43,78,.05)]">
      <div className="mx-auto flex h-[86px] w-[86px] items-center justify-center rounded-[28px] bg-[#eaf8fb]">
        <Snowflake className="h-9 w-9 text-[#16a6c9]" />
      </div>
      <h2 className="mt-6 text-xl font-extrabold text-[#0d2b4e]">
        أضف أول برادة لك
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm font-bold leading-7 text-[#8194a2]">
        بعد الإضافة تذهب البرادة إلى الإدارة للمراجعة، وسيصلك إشعار فور اعتمادها.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mx-auto mt-6 flex h-[50px] items-center gap-2 rounded-[16px] bg-[#0d2b4e] px-5 text-sm font-extrabold text-white"
      >
        <Plus className="h-[18px] w-[18px]" />
        إضافة برادة
      </button>
    </section>
  );
}

function CoolerGridCard({ cooler, index }: { cooler: Cooler; index: number }) {
  const image = photoSrc(cooler);

  return (
    <motion.a
      href={`/coolers/${cooler.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group overflow-hidden rounded-[27px] border border-[#e0ecef] bg-white shadow-[0_14px_42px_rgba(13,43,78,.055)]"
    >
      <div className="relative h-[185px] overflow-hidden bg-[linear-gradient(145deg,#e8f7fa,#f5fbfc)]">
        {image ? (
          <img src={image} alt={cooler.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Snowflake className="h-14 w-14 text-[#16a6c9]/65" />
          </div>
        )}

        <div className="absolute right-4 top-4">
          <StatusBadge cooler={cooler} />
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-base font-extrabold text-[#0d2b4e]">
              {cooler.name}
            </h3>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#8295a2]">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#16a6c9]" />
              <span className="truncate">
                {cooler.landmark || cooler.address?.label || "لم يتم تحديد الموقع"}
              </span>
            </div>
          </div>

          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#f3f8fa] text-[#879ba8] transition group-hover:bg-[#0d2b4e] group-hover:text-white">
            <ChevronLeft className="h-4 w-4" />
          </span>
        </div>

        {cooler.approval_status === "rejected" && cooler.rejection_reason ? (
          <div className="mt-4 rounded-[14px] border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-bold leading-6 text-red-600">
            {cooler.rejection_reason}
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <InfoTile label="الفلتر" value={cooler.filter_type || "غير محدد"} icon={<Filter className="h-4 w-4" />} />
          <InfoTile
            label="حالة التشغيل"
            value={cooler.health_score !== null && cooler.health_score !== undefined ? `${cooler.health_score}%` : "بانتظار التقييم"}
            icon={<Sparkles className="h-4 w-4" />}
          />
        </div>
      </div>
    </motion.a>
  );
}

function CoolerListCard({ cooler, index }: { cooler: Cooler; index: number }) {
  const image = photoSrc(cooler);

  return (
    <motion.a
      href={`/coolers/${cooler.id}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="group flex flex-col gap-4 rounded-[24px] border border-[#e0ecef] bg-white p-4 shadow-[0_10px_35px_rgba(13,43,78,.045)] transition hover:border-[#bfe4ec] sm:flex-row sm:items-center"
    >
      <div className="flex h-[92px] w-full shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-[#edf9fb] sm:w-[110px]">
        {image ? (
          <img src={image} alt={cooler.name} className="h-full w-full object-cover" />
        ) : (
          <Snowflake className="h-8 w-8 text-[#16a6c9]/65" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-base font-extrabold text-[#0d2b4e]">{cooler.name}</h3>
          <StatusBadge cooler={cooler} />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-[#8497a4]">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-[#16a6c9]" />
            {cooler.landmark || "الموقع غير محدد"}
          </span>
          <span className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-[#16a6c9]" />
            {cooler.filter_type || "نوع الفلتر غير محدد"}
          </span>
        </div>
      </div>

      <div className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-[13px] bg-[#f2f7f9] text-[#8194a1] transition group-hover:bg-[#0d2b4e] group-hover:text-white sm:self-auto">
        <ChevronLeft className="h-4 w-4" />
      </div>
    </motion.a>
  );
}

function StatusBadge({ cooler }: { cooler: Cooler }) {
  const approval = cooler.approval_status || "approved";

  if (approval === "pending_review") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50/95 px-3 py-1.5 text-[10px] font-extrabold text-amber-700">
        <Clock3 className="h-3 w-3" />
        قيد المراجعة
      </span>
    );
  }

  if (approval === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50/95 px-3 py-1.5 text-[10px] font-extrabold text-red-700">
        <XCircle className="h-3 w-3" />
        تحتاج تعديل
      </span>
    );
  }

  if (approval === "disabled") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-[10px] font-extrabold text-slate-600">
        موقوفة
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/95 px-3 py-1.5 text-[10px] font-extrabold text-emerald-700">
      <Check className="h-3 w-3" />
      معتمدة
    </span>
  );
}

function InfoTile({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-[16px] bg-[#f7fbfc] p-3">
      <div className="flex items-center gap-2 text-[#16a6c9]">
        {icon}
        <span className="text-[10px] font-extrabold text-[#8b9da9]">{label}</span>
      </div>
      <p className="mt-2 truncate text-xs font-extrabold text-[#0d2b4e]">{value}</p>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[11px] px-3 py-2 text-[11px] font-extrabold transition sm:px-4 ${
        active ? "bg-white text-[#0d2b4e] shadow-sm" : "text-[#8496a2] hover:text-[#0d2b4e]"
      }`}
    >
      {children}
    </button>
  );
}

function AddCoolerModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (cooler: Cooler) => void;
}) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [landmark, setLandmark] = useState("");
  const [filterType, setFilterType] = useState("");
  const [waterSource, setWaterSource] = useState<"network" | "tanker" | "">("");
  const [tankCapacity, setTankCapacity] = useState("");
  const [filterInstalledAt, setFilterInstalledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!photo) {
      queueMicrotask(() => setPreview(""));
      return;
    }

    const url = URL.createObjectURL(photo);
    queueMicrotask(() => setPreview(url));

    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function pickPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;

    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(file.type)) {
      setError("الصورة يجب أن تكون JPG أو PNG أو WebP");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("حجم الصورة يجب ألا يتجاوز 5MB");
      event.target.value = "";
      return;
    }

    setError("");
    setPhoto(file);
  }

  function goNext() {
    setError("");

    if (step === 1 && !name.trim()) {
      setError("اكتب اسم البرادة أولًا");
      return;
    }

    setStep((current) => Math.min(3, current + 1));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step < 3) {
      goNext();
      return;
    }

    const token = getAuthToken();

    if (!token) {
      setError("انتهت جلسة الدخول");
      return;
    }

    if (!waterSource) {
      setError("اختر مصدر التعبئة أولًا");
      return;
    }
    if (waterSource === "tanker" && (!tankCapacity.trim() || !Number.isInteger(Number(tankCapacity)) || Number(tankCapacity) <= 0 || Number(tankCapacity) > 10000000)) {
      setError("أدخل سعة الخزان باللتر برقم صحيح أكبر من صفر");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", name.trim());

      if (landmark.trim()) formData.append("landmark", landmark.trim());
      if (filterType.trim()) formData.append("filter_type", filterType.trim());
      if (waterSource) formData.append("water_source", waterSource);
      if (waterSource === "tanker") formData.append("tank_capacity_liters", tankCapacity);
      if (filterInstalledAt) formData.append("filter_installed_at", filterInstalledAt);
      if (notes.trim()) formData.append("notes", notes.trim());
      if (photo) formData.append("photo", photo);

      const response = await fetch(`${API_URL}/coolers`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const payload = (await response.json()) as StoreCoolerResponse & {
        message?: string;
        errors?: Record<string, string[]>;
      };

      if (!response.ok) {
        const firstValidationError = payload.errors
          ? Object.values(payload.errors).flat()[0]
          : null;

        throw new Error(firstValidationError || payload.message || "تعذر إضافة البرادة");
      }

      onCreated(payload.data.cooler);
      window.dispatchEvent(new Event("numayr:notifications-updated"));
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "تعذر إضافة البرادة");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <motion.button
        type="button"
        aria-label="إغلاق"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-[#05182c]/45 backdrop-blur-[3px]"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        className="fixed inset-x-3 bottom-3 top-3 z-[90] mx-auto flex max-w-[640px] flex-col overflow-hidden rounded-[30px] bg-[#f8fbfc] shadow-[0_35px_100px_rgba(4,20,39,.28)] sm:inset-x-6 sm:bottom-auto sm:top-1/2 sm:max-h-[90vh] sm:-translate-y-1/2"
      >
        <div className="relative overflow-hidden bg-[#0d2b4e] px-5 pb-6 pt-5 sm:px-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(22,166,201,.28),transparent_38%),linear-gradient(135deg,#123a63,#0d2b4e)]" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-extrabold text-[#72dff5]">براداتي</p>
              <h2 className="mt-1 text-xl font-extrabold text-white">إضافة برادة جديدة</h2>
            </div>
            <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-white/10 text-white transition hover:bg-white/15">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative z-10 mt-6 grid grid-cols-3 gap-2">
            {steps.map((item) => {
              const completed = step > item.id;
              const active = step === item.id;

              return (
                <div key={item.id} className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${
                    completed ? "bg-[#16a6c9] text-white" : active ? "bg-white text-[#0d2b4e]" : "bg-white/10 text-white/45"
                  }`}>
                    {completed ? <Check className="h-4 w-4" /> : item.id}
                  </div>
                  <span className={`hidden text-[10px] font-bold sm:block ${active || completed ? "text-white" : "text-white/35"}`}>
                    {item.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-5 sm:p-7">
            {step === 1 ? (
              <div className="space-y-5">
                <StepTitle icon={<Snowflake className="h-5 w-5" />} title="معلومات البرادة" description="ابدأ باسم واضح للبرادة وبعض الملاحظات." />
                <InputField label="اسم البرادة" required value={name} onChange={setName} placeholder="مثال: برادة المسجد" />
                <TextAreaField label="ملاحظات" value={notes} onChange={setNotes} placeholder="أي معلومات إضافية عن البرادة..." />
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-5">
                <StepTitle icon={<MapPin className="h-5 w-5" />} title="موقع البرادة" description="اكتب وصف عنوان البرادة بوضوح. ربط اختيار العنوان عبر هدهد يحتاج تفعيل واجهة الخدمة." />
                <InputField label="عنوان البرادة أو المعلم القريب" value={landmark} onChange={setLandmark} placeholder="المدينة، الحي، الشارع، أقرب معلم" />
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-5">
                <StepTitle icon={<Camera className="h-5 w-5" />} title="الصورة والفلتر" description="ارفع صورة واضحة من جهازك؛ لا نستخدم روابط الصور." />

                <div>
                  <label className="mb-2 block text-[12px] font-extrabold text-[#0d2b4e]">صورة البرادة</label>
                  <label className="group flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-[#cfe3e8] bg-white px-5 py-6 text-center transition hover:border-[#16a6c9] hover:bg-[#f7fcfd]">
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pickPhoto} className="hidden" />
                    <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#eaf8fb] text-[#16a6c9]">
                      <ImagePlus className="h-5 w-5" />
                    </div>
                    <strong className="mt-3 text-[12px] font-extrabold text-[#0d2b4e]">
                      {photo ? "تغيير الصورة" : "اختيار صورة من الجهاز"}
                    </strong>
                    <span className="mt-1 text-[10px] font-bold text-[#91a3ae]">
                      JPG / PNG / WebP — بحد أقصى 5MB
                    </span>
                  </label>
                </div>

                {preview ? (
                  <div className="relative overflow-hidden rounded-[20px] border border-[#dce8ec] bg-white p-2">
                    <img src={preview} alt="معاينة البرادة" className="h-[210px] w-full rounded-[15px] object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhoto(null)}
                      className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#0d2b4e]/85 text-white backdrop-blur"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}

                <InputField label="نوع الفلتر" value={filterType} onChange={setFilterType} placeholder="مثال: 5 مراحل" />

                <div>
                  <label htmlFor="water-source" className="mb-2 block text-[12px] font-extrabold text-[#0d2b4e]">مصدر التعبئة</label>
                  <select
                    id="water-source"
                    required
                    value={waterSource}
                    onChange={(event) => {
                      const source = event.target.value as "network" | "tanker" | "";
                      setWaterSource(source);
                      if (source !== "tanker") setTankCapacity("");
                    }}
                    className="h-[54px] w-full rounded-[16px] border border-[#dce8ec] bg-white px-4 text-sm font-bold text-[#0d2b4e] outline-none focus:border-[#16a6c9]"
                  >
                    <option value="">اختر مصدر التعبئة</option>
                    <option value="network">شبكة مياه</option>
                    <option value="tanker">صهريج</option>
                  </select>
                </div>

                {waterSource === "tanker" ? (
                  <div>
                    <label htmlFor="tank-capacity" className="mb-2 block text-[12px] font-extrabold text-[#0d2b4e]">
                      سعة الخزان (لتر) <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="tank-capacity"
                      type="number"
                      min={1}
                      max={10000000}
                      step={1}
                      required
                      value={tankCapacity}
                      onChange={(event) => setTankCapacity(event.target.value)}
                      placeholder="مثال: 1000"
                      className="h-[54px] w-full rounded-[16px] border border-[#dce8ec] bg-white px-4 text-sm font-bold text-[#0d2b4e] outline-none focus:border-[#16a6c9]"
                    />
                  </div>
                ) : null}

                <div>
                  <label className="mb-2 block text-[12px] font-extrabold text-[#0d2b4e]">تاريخ تركيب الفلتر</label>
                  <div className="relative">
                    <CalendarDays className="absolute right-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#8ca0ad]" />
                    <input
                      type="date"
                      value={filterInstalledAt}
                      onChange={(event) => setFilterInstalledAt(event.target.value)}
                      className="h-[54px] w-full rounded-[16px] border border-[#dce8ec] bg-white pr-11 pl-4 text-sm font-bold text-[#0d2b4e] outline-none transition focus:border-[#16a6c9]"
                    />
                  </div>
                </div>

                <div className="rounded-[17px] border border-[#cfe8ee] bg-[#edf9fb] p-4">
                  <div className="flex gap-3">
                    <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#16a6c9]" />
                    <p className="text-xs font-bold leading-6 text-[#617989]">
                      بعد الحفظ ستظهر البرادة بحالة «قيد المراجعة». عند اعتماد الإدارة لها سيصلك إشعار ويمكن استخدامها في الخدمات.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="mt-5 rounded-[16px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                {error}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-[#e2ecef] bg-white px-5 py-4 sm:px-7">
            {step > 1 ? (
              <button type="button" onClick={() => setStep((current) => Math.max(1, current - 1))} className="flex h-[48px] items-center gap-2 rounded-[15px] border border-[#dce8ec] bg-white px-4 text-xs font-extrabold text-[#718592]">
                <ArrowRight className="h-4 w-4" />
                السابق
              </button>
            ) : (
              <span />
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex h-[48px] min-w-[140px] items-center justify-center gap-2 rounded-[15px] bg-[#0d2b4e] px-5 text-xs font-extrabold text-white shadow-[0_10px_24px_rgba(13,43,78,.16)] disabled:opacity-60"
            >
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
              ) : step < 3 ? (
                <>
                  التالي
                  <ArrowLeft className="h-4 w-4" />
                </>
              ) : (
                <>
                  إضافة وإرسال للمراجعة
                  <Upload className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}

function StepTitle({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#e8f7fa] text-[#16a6c9]">
        {icon}
      </div>
      <div>
        <h3 className="text-base font-extrabold text-[#0d2b4e]">{title}</h3>
        <p className="mt-1 text-xs font-bold leading-6 text-[#8295a2]">{description}</p>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  required,
  dir,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div>
      <label className="mb-2 block text-[12px] font-extrabold text-[#0d2b4e]">
        {label}
        {required ? <span className="mr-1 text-red-400">*</span> : null}
      </label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        dir={dir}
        className="h-[54px] w-full rounded-[16px] border border-[#dce8ec] bg-white px-4 text-sm font-bold text-[#0d2b4e] outline-none transition placeholder:font-normal placeholder:text-[#a5b5bf] focus:border-[#16a6c9] focus:shadow-[0_0_0_4px_rgba(22,166,201,.07)]"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-[12px] font-extrabold text-[#0d2b4e]">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-none rounded-[16px] border border-[#dce8ec] bg-white p-4 text-sm font-bold text-[#0d2b4e] outline-none transition placeholder:font-normal placeholder:text-[#a5b5bf] focus:border-[#16a6c9]"
      />
    </div>
  );
}
