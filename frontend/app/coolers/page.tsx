"use client";

import AppShell from "@/components/app/AppShell";
import { ApiError, apiRequest } from "@/lib/api";
import { getAuthToken, removeAuthToken } from "@/lib/auth";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  ChevronLeft,
  CircleAlert,
  Filter,
  Grid2X2,
  List,
  MapPin,
  Plus,
  Search,
  Snowflake,
  Sparkles,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  created_at?: string;
  updated_at?: string;
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

type ViewMode = "grid" | "list";
type FilterMode = "all" | "good" | "attention";

const steps = [
  {
    id: 1,
    title: "معلومات البرادة",
  },
  {
    id: 2,
    title: "الموقع",
  },
  {
    id: 3,
    title: "الفلتر والصورة",
  },
];

export default function CoolersPage() {
  const router = useRouter();

  const [coolers, setCoolers] = useState<Cooler[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filterMode, setFilterMode] =
    useState<FilterMode>("all");
  const [search, setSearch] = useState("");

  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    async function loadCoolers() {
      try {
        const response =
          await apiRequest<CoolersResponse>("/coolers", {
            token,
          });

        setCoolers(response.data.coolers);
      } catch (exception) {
        if (
          exception instanceof ApiError &&
          exception.status === 401
        ) {
          removeAuthToken();
          router.replace("/login");
          return;
        }

        setPageError("تعذر تحميل البرادات");
      } finally {
        setLoading(false);
      }
    }

    void loadCoolers();
  }, [router]);

  const filteredCoolers = useMemo(() => {
    return coolers.filter((cooler) => {
      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        !searchValue ||
        cooler.name.toLowerCase().includes(searchValue) ||
        cooler.landmark
          ?.toLowerCase()
          .includes(searchValue) ||
        cooler.filter_type
          ?.toLowerCase()
          .includes(searchValue);

      let matchesFilter = true;

      if (filterMode === "good") {
        matchesFilter =
          cooler.status === "good" ||
          (cooler.health_score !== null &&
            cooler.health_score >= 70);
      }

      if (filterMode === "attention") {
        matchesFilter =
          cooler.status === "attention" ||
          cooler.status === "warning" ||
          (cooler.health_score !== null &&
            cooler.health_score < 70);
      }

      return matchesSearch && matchesFilter;
    });
  }, [coolers, filterMode, search]);

  function handleCoolerCreated(cooler: Cooler) {
    setCoolers((current) => [cooler, ...current]);
    setAddOpen(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f9fb]">
        <div className="flex flex-col items-center">
          <div className="relative h-14 w-14">
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-[#16a6c9]/15"
              animate={{
                scale: [0.8, 1.3],
                opacity: [1, 0],
              }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
              }}
            />

            <span className="absolute inset-[9px] animate-spin rounded-full border-[3px] border-[#d5e9ee] border-t-[#16a6c9]" />
          </div>

          <p className="mt-4 text-sm font-extrabold text-[#718197]">
            جاري تحميل براداتك...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[1500px]">
        <motion.div
          initial={{
            opacity: 0,
            y: 16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.65,
          }}
          className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-extrabold text-[#16a6c9]">
              <Snowflake className="h-4 w-4" />
              <span>إدارة البرادات</span>
            </div>

            <h1 className="text-[28px] font-extrabold tracking-[-0.045em] text-[#0d2b4e] sm:text-[34px]">
              براداتي
            </h1>

            <p className="mt-2 text-sm font-bold text-[#7c909f]">
              تابع حالة براداتك وأدر بياناتها من مكان واحد.
            </p>
          </div>

          <motion.button
            whileHover={{
              y: -2,
            }}
            whileTap={{
              scale: 0.98,
            }}
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
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="ابحث باسم البرادة أو الموقع..."
                className="h-[50px] w-full rounded-[16px] border border-[#dfeaec] bg-[#f9fcfd] pr-11 pl-4 text-sm font-bold text-[#0d2b4e] outline-none transition focus:border-[#16a6c9]"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex rounded-[15px] bg-[#f2f7f9] p-1">
                <FilterButton
                  active={filterMode === "all"}
                  onClick={() => setFilterMode("all")}
                >
                  الكل
                </FilterButton>

                <FilterButton
                  active={filterMode === "attention"}
                  onClick={() =>
                    setFilterMode("attention")
                  }
                >
                  تحتاج متابعة
                </FilterButton>

                <FilterButton
                  active={filterMode === "good"}
                  onClick={() => setFilterMode("good")}
                >
                  جيدة
                </FilterButton>
              </div>

              <div className="flex w-fit rounded-[14px] border border-[#e1ecef] bg-white p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex h-9 w-9 items-center justify-center rounded-[10px] transition ${
                    viewMode === "grid"
                      ? "bg-[#0d2b4e] text-white"
                      : "text-[#8b9eaa]"
                  }`}
                  aria-label="عرض شبكي"
                >
                  <Grid2X2 className="h-[17px] w-[17px]" />
                </button>

                <button
                  onClick={() => setViewMode("list")}
                  className={`flex h-9 w-9 items-center justify-center rounded-[10px] transition ${
                    viewMode === "list"
                      ? "bg-[#0d2b4e] text-white"
                      : "text-[#8b9eaa]"
                  }`}
                  aria-label="عرض قائمة"
                >
                  <List className="h-[17px] w-[17px]" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {coolers.length === 0 ? (
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
              <CoolerGridCard
                key={cooler.id}
                cooler={cooler}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filteredCoolers.map((cooler, index) => (
              <CoolerListCard
                key={cooler.id}
                cooler={cooler}
                index={index}
              />
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

function EmptyState({
  onAdd,
}: {
  onAdd: () => void;
}) {
  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="relative mt-7 overflow-hidden rounded-[30px] border border-[#deebef] bg-white px-6 py-16 text-center shadow-[0_18px_60px_rgba(13,43,78,.05)]"
    >
      <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-[#16a6c9]/8 blur-[80px]" />

      <div className="relative z-10">
        <motion.div
          animate={{
            y: [0, -7, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="mx-auto flex h-[86px] w-[86px] items-center justify-center rounded-[28px] bg-[#eaf8fb]"
        >
          <Snowflake className="h-9 w-9 text-[#16a6c9]" />
        </motion.div>

        <h2 className="mt-6 text-xl font-extrabold text-[#0d2b4e]">
          أضف أول برادة لك
        </h2>

        <p className="mx-auto mt-3 max-w-md text-sm font-bold leading-7 text-[#8194a2]">
          بعد إضافة البرادة يمكنك طلب التعبئة والصيانة
          والفلاتر ومتابعة حالتها من نمير.
        </p>

        <button
          onClick={onAdd}
          className="mx-auto mt-6 flex h-[50px] items-center gap-2 rounded-[16px] bg-[#0d2b4e] px-5 text-sm font-extrabold text-white"
        >
          <Plus className="h-[18px] w-[18px]" />
          إضافة برادة
        </button>
      </div>
    </motion.section>
  );
}

function CoolerGridCard({
  cooler,
  index,
}: {
  cooler: Cooler;
  index: number;
}) {
  return (
    <motion.a
      href={`/coolers/${cooler.id}`}
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: index * 0.06,
      }}
      whileHover={{
        y: -5,
      }}
      className="group relative overflow-hidden rounded-[27px] border border-[#e0ecef] bg-white shadow-[0_14px_42px_rgba(13,43,78,.055)] transition-shadow hover:shadow-[0_22px_55px_rgba(13,43,78,.09)]"
    >
      <div className="relative h-[170px] overflow-hidden bg-[linear-gradient(145deg,#e8f7fa,#f5fbfc)]">
        {cooler.photo ? (
          <img
            src={cooler.photo}
            alt={cooler.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#16a6c9]/15 blur-2xl" />

              <Snowflake className="relative h-14 w-14 text-[#16a6c9]/65" />
            </div>
          </div>
        )}

        <div className="absolute right-4 top-4">
          <StatusBadge cooler={cooler} />
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-[#0d2b4e]">
              {cooler.name}
            </h3>

            <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#8295a2]">
              <MapPin className="h-3.5 w-3.5 text-[#16a6c9]" />
              <span>
                {cooler.landmark ||
                  cooler.address?.label ||
                  "لم يتم تحديد الموقع"}
              </span>
            </div>
          </div>

          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#f3f8fa] text-[#879ba8] transition group-hover:bg-[#0d2b4e] group-hover:text-white">
            <ChevronLeft className="h-4 w-4" />
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <InfoTile
            label="الفلتر"
            value={cooler.filter_type || "غير محدد"}
            icon={<Filter className="h-4 w-4" />}
          />

          <InfoTile
            label="الحالة"
            value={
              cooler.health_score !== null
                ? `${cooler.health_score}%`
                : "بانتظار التقييم"
            }
            icon={<Sparkles className="h-4 w-4" />}
          />
        </div>
      </div>
    </motion.a>
  );
}

function CoolerListCard({
  cooler,
  index,
}: {
  cooler: Cooler;
  index: number;
}) {
  return (
    <motion.a
      href={`/coolers/${cooler.id}`}
      initial={{
        opacity: 0,
        y: 14,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: index * 0.05,
      }}
      className="group flex flex-col gap-4 rounded-[24px] border border-[#e0ecef] bg-white p-4 shadow-[0_10px_35px_rgba(13,43,78,.045)] transition hover:border-[#bfe4ec] sm:flex-row sm:items-center"
    >
      <div className="flex h-[88px] w-full shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-[#edf9fb] sm:w-[100px]">
        {cooler.photo ? (
          <img
            src={cooler.photo}
            alt={cooler.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <Snowflake className="h-8 w-8 text-[#16a6c9]/65" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-base font-extrabold text-[#0d2b4e]">
            {cooler.name}
          </h3>

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
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/95 px-3 py-1.5 text-[10px] font-extrabold text-emerald-700 backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        جيدة
      </span>
    );
  }

  if (
    cooler.status === "attention" ||
    cooler.status === "warning"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50/95 px-3 py-1.5 text-[10px] font-extrabold text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        تحتاج متابعة
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-[10px] font-extrabold text-[#778b99]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#9badb8]" />
      بانتظار التقييم
    </span>
  );
}

function InfoTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[16px] bg-[#f7fbfc] p-3">
      <div className="flex items-center gap-2 text-[#16a6c9]">
        {icon}

        <span className="text-[10px] font-extrabold text-[#8b9da9]">
          {label}
        </span>
      </div>

      <p className="mt-2 truncate text-xs font-extrabold text-[#0d2b4e]">
        {value}
      </p>
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
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[11px] px-3 py-2 text-[11px] font-extrabold transition sm:px-4 ${
        active
          ? "bg-white text-[#0d2b4e] shadow-sm"
          : "text-[#8496a2] hover:text-[#0d2b4e]"
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
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterInstalledAt, setFilterInstalledAt] =
    useState("");
  const [photo, setPhoto] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function goNext() {
    setError("");

    if (step === 1 && !name.trim()) {
      setError("اكتب اسم البرادة أولًا");
      return;
    }

    setStep((current) => Math.min(3, current + 1));
  }

  function goPrevious() {
    setError("");
    setStep((current) => Math.max(1, current - 1));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
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

    setError("");
    setSaving(true);

    try {
      const response =
        await apiRequest<StoreCoolerResponse>("/coolers", {
          method: "POST",
          token,
          body: JSON.stringify({
            name: name.trim(),
            landmark: landmark.trim() || null,
            latitude: latitude
              ? Number(latitude)
              : null,
            longitude: longitude
              ? Number(longitude)
              : null,
            filter_type: filterType.trim() || null,
            filter_installed_at:
              filterInstalledAt || null,
            photo: photo.trim() || null,
            notes: notes.trim() || null,
          }),
        });

      onCreated(response.data.cooler);
    } catch (exception) {
      if (exception instanceof ApiError) {
        setError(exception.message);
      } else {
        setError("تعذر إضافة البرادة");
      }
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
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        exit={{
          opacity: 0,
        }}
        className="fixed inset-0 z-[80] bg-[#05182c]/45 backdrop-blur-[3px]"
      />

      <motion.div
        initial={{
          opacity: 0,
          scale: 0.95,
          y: 30,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.96,
          y: 20,
        }}
        transition={{
          duration: 0.32,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="fixed inset-x-3 bottom-3 top-3 z-[90] mx-auto flex max-w-[620px] flex-col overflow-hidden rounded-[30px] bg-[#f8fbfc] shadow-[0_35px_100px_rgba(4,20,39,.28)] sm:inset-x-6 sm:bottom-auto sm:top-1/2 sm:max-h-[90vh] sm:-translate-y-1/2"
      >
        <div className="relative overflow-hidden bg-[#0d2b4e] px-5 pb-6 pt-5 sm:px-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(22,166,201,.28),transparent_38%),linear-gradient(135deg,#123a63,#0d2b4e)]" />

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[11px] font-extrabold text-[#72dff5]">
                براداتي
              </p>

              <h2 className="mt-1 text-xl font-extrabold text-white">
                إضافة برادة جديدة
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-white/10 text-white transition hover:bg-white/15"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative z-10 mt-6 grid grid-cols-3 gap-2">
            {steps.map((item) => {
              const completed = step > item.id;
              const active = step === item.id;

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold transition ${
                      completed
                        ? "bg-[#16a6c9] text-white"
                        : active
                          ? "bg-white text-[#0d2b4e]"
                          : "bg-white/10 text-white/45"
                    }`}
                  >
                    {completed ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      item.id
                    )}
                  </div>

                  <span
                    className={`hidden text-[10px] font-bold sm:block ${
                      active || completed
                        ? "text-white"
                        : "text-white/35"
                    }`}
                  >
                    {item.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 overflow-y-auto p-5 sm:p-7">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step-1"
                  initial={{
                    opacity: 0,
                    x: 20,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: -20,
                  }}
                  className="space-y-5"
                >
                  <StepTitle
                    icon={<Snowflake className="h-5 w-5" />}
                    title="معلومات البرادة"
                    description="ابدأ باسم واضح للبرادة وبعض الملاحظات."
                  />

                  <InputField
                    label="اسم البرادة"
                    required
                    value={name}
                    onChange={setName}
                    placeholder="مثال: برادة المطبخ"
                  />

                  <TextAreaField
                    label="ملاحظات"
                    value={notes}
                    onChange={setNotes}
                    placeholder="أي معلومات إضافية عن البرادة..."
                  />
                </motion.div>
              ) : null}

              {step === 2 ? (
                <motion.div
                  key="step-2"
                  initial={{
                    opacity: 0,
                    x: 20,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: -20,
                  }}
                  className="space-y-5"
                >
                  <StepTitle
                    icon={<MapPin className="h-5 w-5" />}
                    title="موقع البرادة"
                    description="الموقع اختياري ويمكن استكماله أو تعديله لاحقًا."
                  />

                  <InputField
                    label="أقرب معلم"
                    value={landmark}
                    onChange={setLandmark}
                    placeholder="مثال: بجوار المدخل الرئيسي"
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <InputField
                      label="خط العرض"
                      value={latitude}
                      onChange={setLatitude}
                      placeholder="24.7136"
                      dir="ltr"
                    />

                    <InputField
                      label="خط الطول"
                      value={longitude}
                      onChange={setLongitude}
                      placeholder="46.6753"
                      dir="ltr"
                    />
                  </div>

                  <div className="rounded-[18px] border border-[#dcebef] bg-[#edf8fa] p-4">
                    <div className="flex gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#16a6c9]" />

                      <p className="text-xs font-bold leading-6 text-[#6f8493]">
                        لاحقًا نقدر نخلي اختيار الموقع مباشرة
                        من الخريطة، لكن الـbackend حاليًا يستقبل
                        الإحداثيات بالفعل.
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : null}

              {step === 3 ? (
                <motion.div
                  key="step-3"
                  initial={{
                    opacity: 0,
                    x: 20,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: -20,
                  }}
                  className="space-y-5"
                >
                  <StepTitle
                    icon={<Filter className="h-5 w-5" />}
                    title="الفلتر والصورة"
                    description="أضف بيانات الفلتر وصورة البرادة إذا كانت متاحة."
                  />

                  <InputField
                    label="نوع الفلتر"
                    value={filterType}
                    onChange={setFilterType}
                    placeholder="مثال: 5 مراحل"
                  />

                  <div>
                    <label className="mb-2 block text-[12px] font-extrabold text-[#0d2b4e]">
                      تاريخ تركيب الفلتر
                    </label>

                    <div className="relative">
                      <CalendarDays className="absolute right-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#8ca0ad]" />

                      <input
                        type="date"
                        value={filterInstalledAt}
                        onChange={(event) =>
                          setFilterInstalledAt(
                            event.target.value
                          )
                        }
                        className="h-[54px] w-full rounded-[16px] border border-[#dce8ec] bg-white pr-11 pl-4 text-sm font-bold text-[#0d2b4e] outline-none transition focus:border-[#16a6c9]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-[12px] font-extrabold text-[#0d2b4e]">
                      رابط صورة البرادة
                    </label>

                    <div className="relative">
                      <Camera className="absolute right-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#8ca0ad]" />

                      <input
                        type="url"
                        value={photo}
                        onChange={(event) =>
                          setPhoto(event.target.value)
                        }
                        placeholder="https://..."
                        dir="ltr"
                        className="h-[54px] w-full rounded-[16px] border border-[#dce8ec] bg-white pr-11 pl-4 text-left text-sm font-bold text-[#0d2b4e] outline-none transition focus:border-[#16a6c9]"
                      />
                    </div>
                  </div>

                  {photo ? (
                    <div className="overflow-hidden rounded-[20px] border border-[#dce8ec] bg-white p-2">
                      <img
                        src={photo}
                        alt="معاينة البرادة"
                        className="h-[180px] w-full rounded-[15px] object-cover"
                      />
                    </div>
                  ) : null}
                </motion.div>
              ) : null}
            </AnimatePresence>

            {error ? (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -5,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="mt-5 rounded-[16px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600"
              >
                {error}
              </motion.div>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-[#e2ecef] bg-white px-5 py-4 sm:px-7">
            {step > 1 ? (
              <button
                type="button"
                onClick={goPrevious}
                className="flex h-[48px] items-center gap-2 rounded-[15px] border border-[#dce8ec] bg-white px-4 text-xs font-extrabold text-[#718592]"
              >
                <ArrowRight className="h-4 w-4" />
                السابق
              </button>
            ) : (
              <span />
            )}

            <motion.button
              whileTap={{
                scale: 0.98,
              }}
              type="submit"
              disabled={saving}
              className="flex h-[48px] min-w-[130px] items-center justify-center gap-2 rounded-[15px] bg-[#0d2b4e] px-5 text-xs font-extrabold text-white shadow-[0_10px_24px_rgba(13,43,78,.16)] disabled:opacity-60"
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
                  إضافة البرادة
                  <Check className="h-4 w-4" />
                </>
              )}
            </motion.button>
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
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#e8f7fa] text-[#16a6c9]">
        {icon}
      </div>

      <div>
        <h3 className="text-base font-extrabold text-[#0d2b4e]">
          {title}
        </h3>

        <p className="mt-1 text-xs font-bold leading-6 text-[#8295a2]">
          {description}
        </p>
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
        {required ? (
          <span className="mr-1 text-red-400">*</span>
        ) : null}
      </label>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
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
      <label className="mb-2 block text-[12px] font-extrabold text-[#0d2b4e]">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        rows={4}
        className="w-full resize-none rounded-[16px] border border-[#dce8ec] bg-white p-4 text-sm font-bold text-[#0d2b4e] outline-none transition placeholder:font-normal placeholder:text-[#a5b5bf] focus:border-[#16a6c9] focus:shadow-[0_0_0_4px_rgba(22,166,201,.07)]"
      />
    </div>
  );
}