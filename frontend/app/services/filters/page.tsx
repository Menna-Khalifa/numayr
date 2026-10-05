"use client";

import AppShell from "@/components/app/AppShell";
import { ApiError, apiRequest } from "@/lib/api";
import { getAuthToken, removeAuthToken } from "@/lib/auth";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Disc3,
  Filter,
  MapPin,
  SearchCheck,
  Snowflake,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type FilterOption = {
  code: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  price: number;
};

type Service = {
  id: number;
  code: string;
  name_ar: string;
  description_ar: string;
  pricing_model: string;
  base_price: string;
  urgent_fee: string;
  requires_cooler: boolean;
  settings?: {
    options?: FilterOption[];
  };
};

type Address = {
  id: number;
  label: string;
  city: string;
  district: string;
  street: string;
  building: string | null;
  postal_code: string | null;
  is_default: boolean;
};

type Cooler = {
  id: number;
  address_id: number | null;
  name: string;
  photo: string | null;
  landmark: string | null;
};

type ServiceResponse = {
  success: true;
  data: {
    service: Service;
  };
};

type CoolerResponse = {
  success: true;
  data: {
    cooler: Cooler;
  };
};

type AddressesResponse = {
  success: true;
  data: {
    addresses: Address[];
  };
};

type Order = {
  id: number;
  order_number: string;
  service_name: string;
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
  total_amount: string;
  currency: string;
  status: string;
  payment_status: string;
};

type OrderResponse = {
  success: true;
  message: string;
  data: {
    order: Order;
  };
};

const timeSlots = [
  {
    value: "morning",
    label: "صباحًا",
    sub: "8 ص - 12 م",
  },
  {
    value: "noon",
    label: "ظهرًا",
    sub: "12 م - 4 م",
  },
  {
    value: "evening",
    label: "مساءً",
    sub: "4 م - 8 م",
  },
];

function getOptionIcon(code: string) {
  if (code === "five_stage") {
    return <Filter className="h-6 w-6" />;
  }

  if (code === "ro_membrane") {
    return <Disc3 className="h-6 w-6" />;
  }

  if (code === "sterilization_cleaning") {
    return <Sparkles className="h-6 w-6" />;
  }

  return <SearchCheck className="h-6 w-6" />;
}

export default function FiltersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const coolerId = searchParams.get("cooler");

  const [service, setService] = useState<Service | null>(null);
  const [cooler, setCooler] = useState<Cooler | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);

  const [selectedAddress, setSelectedAddress] =
    useState<number | null>(null);

  const [selectedOption, setSelectedOption] =
    useState<string>("");

  const [preferredDate, setPreferredDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("morning");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [successOrder, setSuccessOrder] =
    useState<Order | null>(null);

  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!coolerId) {
      router.replace("/coolers");
      return;
    }

    async function loadData() {
      try {
        const [
          serviceResponse,
          coolerResponse,
          addressesResponse,
        ] = await Promise.all([
          apiRequest<ServiceResponse>(
            "/services/filter_change"
          ),
          apiRequest<CoolerResponse>(
            `/coolers/${coolerId}`,
            {
              token,
            }
          ),
          apiRequest<AddressesResponse>("/addresses", {
            token,
          }),
        ]);

        const loadedService =
          serviceResponse.data.service;

        const loadedCooler =
          coolerResponse.data.cooler;

        const loadedAddresses =
          addressesResponse.data.addresses;

        setService(loadedService);
        setCooler(loadedCooler);
        setAddresses(loadedAddresses);

        const firstOption =
          loadedService.settings?.options?.[0];

        if (firstOption) {
          setSelectedOption(firstOption.code);
        }

        if (loadedCooler.address_id) {
          setSelectedAddress(
            loadedCooler.address_id
          );
        } else {
          const defaultAddress =
            loadedAddresses.find(
              (address) => address.is_default
            );

          setSelectedAddress(
            defaultAddress?.id ??
              loadedAddresses[0]?.id ??
              null
          );
        }

        setPreferredDate(
          new Date().toISOString().slice(0, 10)
        );
      } catch (exception) {
        if (
          exception instanceof ApiError &&
          exception.status === 401
        ) {
          removeAuthToken();
          router.replace("/login");
          return;
        }

        setError(
          "تعذر تحميل خدمة الفلاتر"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [coolerId, router]);

  const selectedOptionData = useMemo(() => {
    return service?.settings?.options?.find(
      (option) => option.code === selectedOption
    );
  }, [selectedOption, service]);

  async function submitOrder(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const token = getAuthToken();

    if (!token || !cooler || !selectedOption) {
      return;
    }

    if (!selectedAddress) {
      setError(
        "يجب تحديد عنوان البرادة قبل إنشاء الطلب"
      );
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const response =
        await apiRequest<OrderResponse>("/orders", {
          method: "POST",
          token,
          body: JSON.stringify({
            service_code: "filter_change",
            cooler_id: cooler.id,
            address_id: selectedAddress,
            priority: "standard",
            preferred_date:
              preferredDate || null,
            preferred_time_slot:
              timeSlot || null,
            service_data: {
              option_code: selectedOption,
            },
            notes: notes.trim() || null,
          }),
        });

      setSuccessOrder(
        response.data.order
      );
    } catch (exception) {
      if (exception instanceof ApiError) {
        setError(exception.message);
      } else {
        setError(
          "تعذر إنشاء طلب الفلاتر"
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f9fb]">
        <div className="flex flex-col items-center">
          <span className="h-11 w-11 animate-spin rounded-full border-[3px] border-[#d4e8ed] border-t-[#16a6c9]" />

          <p className="mt-4 text-sm font-extrabold text-[#718197]">
            جاري تجهيز خدمة الفلاتر...
          </p>
        </div>
      </div>
    );
  }

  if (!service || !cooler) {
    return (
      <AppShell>
        <div className="mx-auto max-w-[800px]">
          <div className="rounded-[28px] bg-white p-8 text-center">
            <p className="font-extrabold text-[#0d2b4e]">
              تعذر فتح خدمة الفلاتر
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  const options =
    service.settings?.options ?? [];

  return (
    <AppShell>
      <div className="mx-auto max-w-[1450px]">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href={`/coolers/${cooler.id}`}
            className="flex h-10 w-10 items-center justify-center rounded-[13px] border border-[#dce8ec] bg-white text-[#0d2b4e] shadow-sm"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>

          <div>
            <p className="text-[11px] font-extrabold text-[#16a6c9]">
              الخدمات
            </p>

            <p className="mt-0.5 text-xs font-bold text-[#7c909f]">
              خدمة الفلاتر
            </p>
          </div>
        </div>

        <section className="relative overflow-hidden rounded-[30px] bg-[#0d2b4e] px-5 py-7 shadow-[0_24px_70px_rgba(13,43,78,.15)] sm:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(22,166,201,.30),transparent_32%),linear-gradient(135deg,#123d67,#0d2b4e_55%,#081f39)]" />

          <motion.div
            className="absolute -left-24 -top-24 h-72 w-72 rounded-full border border-white/[0.06]"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 42,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-2 text-[11px] font-extrabold text-[#72e1f6]">
                <Filter className="h-4 w-4" />
                عناية بمياه أنقى
              </div>

              <h1 className="mt-4 text-[29px] font-extrabold text-white sm:text-[36px]">
                اختر خدمة الفلتر
              </h1>

              <p className="mt-3 max-w-xl text-sm font-bold leading-7 text-white/55">
                اختر الخدمة المناسبة لبرادتك وحدد الموعد
                المفضل للتنفيذ.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/[0.06] px-4 py-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#dff6fa]">
                <Snowflake className="h-5 w-5 text-[#16a6c9]" />
              </div>

              <div>
                <p className="text-[10px] font-bold text-white/40">
                  البرادة
                </p>

                <p className="mt-1 text-sm font-extrabold text-white">
                  {cooler.name}
                </p>
              </div>
            </div>
          </div>
        </section>

        <form
          onSubmit={submitOrder}
          className="mt-7 grid gap-6 xl:grid-cols-[1fr_380px]"
        >
          <div className="space-y-6">
            <SectionCard
              number="01"
              title="نوع الخدمة"
              description="اختر ما تحتاجه البرادة"
              icon={<Filter className="h-5 w-5" />}
            >
              <div className="grid gap-4 md:grid-cols-2">
                {options.map((option) => {
                  const active =
                    selectedOption === option.code;

                  return (
                    <motion.button
                      type="button"
                      key={option.code}
                      whileHover={{
                        y: -2,
                      }}
                      whileTap={{
                        scale: 0.985,
                      }}
                      onClick={() =>
                        setSelectedOption(
                          option.code
                        )
                      }
                      className={`relative overflow-hidden rounded-[22px] border p-5 text-right transition ${
                        active
                          ? "border-[#16a6c9] bg-[#ebf9fc] shadow-[0_12px_32px_rgba(22,166,201,.08)]"
                          : "border-[#e0ebef] bg-white hover:border-[#bedfe7]"
                      }`}
                    >
                      {active ? (
                        <span className="absolute left-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-[#16a6c9] text-white">
                          <Check className="h-4 w-4" />
                        </span>
                      ) : null}

                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-[16px] ${
                          active
                            ? "bg-[#16a6c9] text-white"
                            : "bg-[#eef7f9] text-[#8298a5]"
                        }`}
                      >
                        {getOptionIcon(
                          option.code
                        )}
                      </div>

                      <h3 className="mt-4 text-[15px] font-extrabold text-[#0d2b4e]">
                        {option.name_ar}
                      </h3>

                      <p className="mt-2 text-xs font-bold leading-6 text-[#8497a4]">
                        {option.description_ar}
                      </p>

                      <div className="mt-5 flex items-end gap-1">
                        <span className="text-[23px] font-extrabold text-[#0d2b4e]">
                          {option.price}
                        </span>

                        <span className="mb-1 text-[11px] font-extrabold text-[#16a6c9]">
                          ر.س
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard
              number="02"
              title="عنوان التنفيذ"
              description="عنوان البرادة الذي سيتم تنفيذ الخدمة فيه"
              icon={<MapPin className="h-5 w-5" />}
            >
              {addresses.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-[#cfe2e8] bg-[#f7fbfc] p-6 text-center">
                  <MapPin className="mx-auto h-7 w-7 text-[#16a6c9]" />

                  <p className="mt-3 text-sm font-extrabold text-[#0d2b4e]">
                    لا يوجد عنوان محفوظ
                  </p>

                  <p className="mt-2 text-xs font-bold text-[#8497a4]">
                    أضف عنوانًا من حسابك أو من صفحة البرادة
                    قبل إرسال الطلب.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => {
                    const active =
                      selectedAddress === address.id;

                    const locked =
                      cooler.address_id !== null &&
                      cooler.address_id !==
                        address.id;

                    return (
                      <button
                        type="button"
                        key={address.id}
                        disabled={locked}
                        onClick={() =>
                          setSelectedAddress(
                            address.id
                          )
                        }
                        className={`flex w-full items-start gap-3 rounded-[18px] border p-4 text-right transition ${
                          active
                            ? "border-[#16a6c9] bg-[#ebf9fc]"
                            : "border-[#e0ebef] bg-white"
                        } ${
                          locked
                            ? "cursor-not-allowed opacity-40"
                            : ""
                        }`}
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] ${
                            active
                              ? "bg-[#16a6c9] text-white"
                              : "bg-[#f1f7f9] text-[#8297a4]"
                          }`}
                        >
                          <MapPin className="h-4 w-4" />
                        </span>

                        <span className="flex-1">
                          <span className="text-sm font-extrabold text-[#0d2b4e]">
                            {address.label}
                          </span>

                          <span className="mt-1 block text-xs font-bold leading-6 text-[#8497a4]">
                            {address.city}،{" "}
                            {address.district}،{" "}
                            {address.street}
                          </span>
                        </span>

                        {active ? (
                          <Check className="mt-2 h-4 w-4 text-[#16a6c9]" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            <SectionCard
              number="03"
              title="الموعد"
              description="اختر الوقت الأنسب للتنفيذ"
              icon={<Clock3 className="h-5 w-5" />}
            >
              <div className="grid gap-4 sm:grid-cols-[1fr_1.5fr]">
                <div>
                  <label className="mb-2 block text-xs font-extrabold text-[#0d2b4e]">
                    التاريخ المفضل
                  </label>

                  <div className="relative">
                    <CalendarDays className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#16a6c9]" />

                    <input
                      type="date"
                      value={preferredDate}
                      min={new Date()
                        .toISOString()
                        .slice(0, 10)}
                      onChange={(event) =>
                        setPreferredDate(
                          event.target.value
                        )
                      }
                      className="h-[54px] w-full rounded-[16px] border border-[#dce8ec] bg-white pr-11 pl-4 text-sm font-bold text-[#0d2b4e] outline-none focus:border-[#16a6c9]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-extrabold text-[#0d2b4e]">
                    الفترة
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((slot) => {
                      const active =
                        timeSlot === slot.value;

                      return (
                        <button
                          type="button"
                          key={slot.value}
                          onClick={() =>
                            setTimeSlot(
                              slot.value
                            )
                          }
                          className={`rounded-[15px] border px-2 py-3 transition ${
                            active
                              ? "border-[#16a6c9] bg-[#ebf9fc]"
                              : "border-[#e0ebef] bg-white"
                          }`}
                        >
                          <p className="text-[11px] font-extrabold text-[#0d2b4e]">
                            {slot.label}
                          </p>

                          <p className="mt-1 text-[9px] font-bold text-[#8a9daa]">
                            {slot.sub}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              number="04"
              title="ملاحظات"
              description="اختياري"
              icon={<Sparkles className="h-5 w-5" />}
            >
              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                rows={4}
                placeholder="أي ملاحظات مهمة لفريق التنفيذ..."
                className="w-full resize-none rounded-[17px] border border-[#dce8ec] bg-[#fbfdfe] p-4 text-sm font-bold text-[#0d2b4e] outline-none placeholder:font-normal placeholder:text-[#a4b4be] focus:border-[#16a6c9]"
              />
            </SectionCard>
          </div>

          <aside className="xl:sticky xl:top-[100px] xl:h-fit">
            <div className="overflow-hidden rounded-[26px] border border-[#e0ecef] bg-white shadow-[0_18px_55px_rgba(13,43,78,.07)]">
              <div className="relative overflow-hidden bg-[#0d2b4e] p-5">
                <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-[#16a6c9]/20 blur-[35px]" />

                <div className="relative">
                  <p className="text-[11px] font-extrabold text-[#66daf1]">
                    ملخص الخدمة
                  </p>

                  <h2 className="mt-1 text-lg font-extrabold text-white">
                    تغيير الفلاتر
                  </h2>
                </div>
              </div>

              <div className="p-5">
                <SummaryRow
                  label="البرادة"
                  value={cooler.name}
                />

                <SummaryRow
                  label="الخدمة"
                  value={
                    selectedOptionData?.name_ar ??
                    "لم يتم الاختيار"
                  }
                />

                <SummaryRow
                  label="قيمة الخدمة"
                  value={
                    selectedOptionData
                      ? `${selectedOptionData.price.toFixed(
                          2
                        )} ر.س`
                      : "-"
                  }
                />

                <SummaryRow
                  label="الموعد"
                  value={
                    preferredDate ||
                    "غير محدد"
                  }
                />

                <div className="my-4 border-t border-dashed border-[#dfe9ed]" />

                <div className="rounded-[16px] bg-[#f5fafb] p-4">
                  <p className="text-xs font-extrabold text-[#0d2b4e]">
                    الدفع سنستكمله لاحقًا
                  </p>

                  <p className="mt-2 text-[10px] font-bold leading-5 text-[#8497a4]">
                    سيتم إنشاء الطلب الآن بحالة انتظار الدفع،
                    وربط بوابة الدفع سيتم في المرحلة المخصصة
                    لها.
                  </p>
                </div>

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
                    className="mt-5 rounded-[15px] border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold leading-6 text-red-600"
                  >
                    {error}
                  </motion.div>
                ) : null}

                <motion.button
                  whileHover={{
                    y: -2,
                  }}
                  whileTap={{
                    scale: 0.985,
                  }}
                  type="submit"
                  disabled={
                    submitting ||
                    !selectedOption
                  }
                  className="mt-5 flex h-[56px] w-full items-center justify-center gap-2 rounded-[17px] bg-[linear-gradient(110deg,#0d2b4e,#123f69_55%,#0e5875)] text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(13,43,78,.17)] disabled:opacity-60"
                >
                  {submitting ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                  ) : (
                    <>
                      <span>إنشاء الطلب</span>
                      <ArrowLeft className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </aside>
        </form>

        <AnimatePresence>
          {successOrder ? (
            <SuccessModal
              order={successOrder}
              coolerId={cooler.id}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

function SectionCard({
  number,
  title,
  description,
  icon,
  children,
}: {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[26px] border border-[#e0ecef] bg-white p-5 shadow-[0_12px_38px_rgba(13,43,78,.045)] sm:p-6">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#eaf8fb] text-[#16a6c9]">
          {icon}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold text-[#16a6c9]">
              {number}
            </span>

            <h2 className="text-base font-extrabold text-[#0d2b4e]">
              {title}
            </h2>
          </div>

          <p className="mt-1 text-xs font-bold text-[#879aa7]">
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
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

      <span className="max-w-[190px] text-left text-xs font-extrabold text-[#0d2b4e]">
        {value}
      </span>
    </div>
  );
}

function SuccessModal({
  order,
  coolerId,
}: {
  order: Order;
  coolerId: number;
}) {
  return (
    <>
      <div className="fixed inset-0 z-[100] bg-[#061a2f]/50 backdrop-blur-[4px]" />

      <motion.div
        initial={{
          opacity: 0,
          scale: 0.9,
          y: 30,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        className="fixed inset-x-4 top-1/2 z-[110] mx-auto max-w-[440px] -translate-y-1/2 rounded-[30px] bg-white p-7 text-center shadow-[0_35px_100px_rgba(5,24,44,.28)]"
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#e7f8f1]">
          <Check className="h-9 w-9 text-[#27ae60]" />
        </div>

        <h2 className="mt-5 text-xl font-extrabold text-[#0d2b4e]">
          تم إنشاء الطلب
        </h2>

        <p className="mt-3 text-sm font-bold leading-7 text-[#7d909e]">
          تم حفظ طلب خدمة الفلاتر بنجاح.
          سنستكمل خطوة الدفع عند ربط بوابة الدفع.
        </p>

        <div className="mt-5 rounded-[18px] bg-[#f5fafb] p-4">
          <p className="text-[10px] font-bold text-[#8a9ca8]">
            رقم الطلب
          </p>

          <p
            dir="ltr"
            className="mt-1 text-sm font-extrabold text-[#0d2b4e]"
          >
            {order.order_number}
          </p>

          <div className="mt-3 border-t border-[#e3edef] pt-3">
            <p className="text-xs font-extrabold text-[#0d2b4e]">
              {Number(
                order.total_amount
              ).toFixed(2)}{" "}
              ر.س
            </p>

            <p className="mt-1 text-[10px] font-bold text-[#f59e0b]">
              بانتظار الدفع
            </p>
          </div>
        </div>

        <Link
          href={`/coolers/${coolerId}`}
          className="mt-6 flex h-[50px] w-full items-center justify-center rounded-[15px] bg-[#0d2b4e] text-xs font-extrabold text-white"
        >
          العودة إلى البرادة
        </Link>
      </motion.div>
    </>
  );
}