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

  Droplet,

  Droplets,

  Gauge,

  MapPin,

  Plus,

  Snowflake,

  Sparkles,

  X,

  Zap,

} from "lucide-react";

import Link from "next/link";

import { useRouter, useSearchParams } from "next/navigation";

import {

  FormEvent,

  useEffect,

  useMemo,

  useState,

} from "react";



type Service = {

  id: number;

  code: string;

  name_ar: string;

  description_ar: string;

  pricing_model: string;

  base_price: string | null;

  unit_price: string | null;

  unit: string | null;

  minimum_quantity: number | null;

  maximum_quantity: number | null;

  quantity_step: number | null;

  urgent_fee: string;

  requires_cooler: boolean;

  settings?: {

    preset_quantities?: number[];

    allow_custom_quantity?: boolean;

  };

};



type Address = {

  id: number;

  label: string | null;

  city: string;

  district: string | null;

  street: string | null;

  building: string | null;

  postal_code: string | null;

  latitude: string | null;

  longitude: string | null;

  notes: string | null;

  is_default: boolean;

};



type Cooler = {

  id: number;

  address_id: number | null;

  name: string;

  photo: string | null;

  landmark: string | null;

  approval_status?: "pending_review" | "approved" | "rejected" | "disabled";

  rejection_reason?: string | null;

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



type AddressCreateResponse = {

  success: true;

  message: string;

  data: {

    address: Address;

  };

};



type Order = {

  id: number;

  order_number: string;

  total_amount: string;

  currency: string;

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



export default function RefillPage() {

  const router = useRouter();

  const searchParams = useSearchParams();



  const coolerId = searchParams.get("cooler");



  const [service, setService] = useState<Service | null>(null);

  const [cooler, setCooler] = useState<Cooler | null>(null);

  const [addresses, setAddresses] = useState<Address[]>([]);

  const [selectedAddress, setSelectedAddress] =

    useState<number | null>(null);



  const [quantity, setQuantity] = useState(500);

  const [customMode, setCustomMode] = useState(false);

  const [priority, setPriority] =

    useState<"standard" | "urgent">("standard");



  const [preferredDate, setPreferredDate] = useState(() =>

    new Date().toISOString().slice(0, 10)

  );

  const [timeSlot, setTimeSlot] = useState("morning");

  const [notes, setNotes] = useState("");



  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [addressModalOpen, setAddressModalOpen] =

    useState(false);



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

          addressResponse,

        ] = await Promise.all([

          apiRequest<ServiceResponse>(

            "/services/water_refill",

            {

              token,

            }

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

          addressResponse.data.addresses;



        setService(loadedService);

        setCooler(loadedCooler);

        setAddresses(loadedAddresses);



        const firstPreset =

          loadedService.settings?.preset_quantities?.[0];



        if (firstPreset) {

          setQuantity(firstPreset);

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

          "تعذر تحميل بيانات خدمة التعبئة"

        );

      } finally {

        setLoading(false);

      }

    }



    void loadData();

  }, [coolerId, router]);



  const basePrice = Number(service?.base_price ?? 0);

  const unitPrice = Number(service?.unit_price ?? 0);

  const urgentFee =

    priority === "urgent"

      ? Number(service?.urgent_fee ?? 0)

      : 0;



  const previewSubtotal = useMemo(() => {

    return basePrice + quantity * unitPrice + urgentFee;

  }, [basePrice, quantity, unitPrice, urgentFee]);



  async function submitOrder(

    event: FormEvent<HTMLFormElement>

  ) {

    event.preventDefault();



    const token = getAuthToken();



    if (!token || !cooler || !service) {

      return;

    }



    if ((cooler.approval_status ?? "approved") !== "approved") {

      setError(
        cooler.approval_status === "rejected"
          ? cooler.rejection_reason
            ? `لا يمكن إنشاء الطلب قبل تعديل البرادة وإعادة اعتمادها. السبب: ${cooler.rejection_reason}`
            : "لا يمكن إنشاء الطلب قبل تعديل البرادة وإعادة اعتمادها."
          : cooler.approval_status === "disabled"
            ? "هذه البرادة موقوفة حاليًا ولا يمكن إنشاء طلب خدمة عليها."
            : "البرادة ما زالت قيد مراجعة الإدارة. يمكنك استخدام الخدمات بعد اعتمادها."
      );

      return;

    }



    if (!selectedAddress) {

      setError("أضف عنوان تنفيذ الطلب أولًا");

      setAddressModalOpen(true);

      return;

    }



    if (

      service.minimum_quantity !== null &&

      quantity < service.minimum_quantity

    ) {

      setError(

        `الحد الأدنى للطلب ${service.minimum_quantity} لتر`

      );

      return;

    }



    setError("");

    setSubmitting(true);



    try {

      const response = await apiRequest<OrderResponse>(

        "/orders",

        {

          method: "POST",

          token,

          body: JSON.stringify({

            service_code: "water_refill",

            cooler_id: cooler.id,

            address_id: selectedAddress,

            quantity,

            priority,

            preferred_date: preferredDate || null,

            preferred_time_slot: timeSlot || null,

            notes: notes.trim() || null,

          }),

        }

      );



      sessionStorage.setItem(

        "numayr_last_order",

        JSON.stringify(response.data.order)

      );



      router.push(

        `/orders/${response.data.order.id}`

      );

    } catch (exception) {

      if (exception instanceof ApiError) {

        setError(exception.message);

      } else {

        setError("تعذر إنشاء الطلب، حاول مرة أخرى");

      }

    } finally {

      setSubmitting(false);

    }

  }



  function handleAddressCreated(address: Address) {

    setAddresses((current) => [address, ...current]);

    setSelectedAddress(address.id);

    setAddressModalOpen(false);

    setError("");

  }



  if (loading) {

    return (

      <div className="flex min-h-screen items-center justify-center bg-[#f4f9fb]">

        <div className="flex flex-col items-center">

          <span className="h-11 w-11 animate-spin rounded-full border-[3px] border-[#d4e8ed] border-t-[#16a6c9]" />



          <p className="mt-4 text-sm font-extrabold text-[#718197]">

            جاري تجهيز خدمة التعبئة...

          </p>

        </div>

      </div>

    );

  }



  if (!service || !cooler) {

    return (

      <AppShell>

        <div className="mx-auto max-w-[800px]">

          <div className="rounded-[28px] bg-white p-8 text-center shadow-sm">

            <p className="font-extrabold text-[#0d2b4e]">

              تعذر فتح خدمة التعبئة

            </p>



            <Link

              href="/coolers"

              className="mt-5 inline-flex rounded-xl bg-[#0d2b4e] px-5 py-3 text-xs font-extrabold text-white"

           >

              العودة إلى براداتي

            </Link>

          </div>

        </div>

      </AppShell>

    );

  }



  const presets =

    service.settings?.preset_quantities ??

    [500, 1000, 2000, 3000];



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

              تعبئة مياه التحلية

            </p>

          </div>

        </div>



        <section className="relative overflow-hidden rounded-[30px] bg-[#0d2b4e] px-5 py-7 shadow-[0_24px_70px_rgba(13,43,78,.15)] sm:px-8">

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(22,166,201,.32),transparent_32%),linear-gradient(135deg,#123d67,#0d2b4e_55%,#081f39)]" />



          <motion.div

            className="absolute -left-20 -top-20 h-64 w-64 rounded-full border border-white/[0.06]"

            animate={{

              scale: [0.9, 1.08, 0.9],

              opacity: [0.4, 0.8, 0.4],

            }}

            transition={{

              duration: 5,

              repeat: Infinity,

              ease: "easeInOut",

            }}

          />



          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-2 text-[11px] font-extrabold text-[#72e1f6]">

                <Droplets className="h-4 w-4" />

                خدمة تعبئة المياه

              </div>



              <h1 className="mt-4 text-[29px] font-extrabold text-white sm:text-[36px]">

                عبّي برادتك بسهولة

              </h1>



              <p className="mt-3 max-w-xl text-sm font-bold leading-7 text-white/55">

                اختر كمية المياه وموعد التنفيذ المناسب، وسيتم

                حساب قيمة الطلب آليًا.

              </p>

            </div>



            <div className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-xl">

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

          className="mt-7 grid gap-6 xl:grid-cols-[1fr_390px]"

       >

          <div className="space-y-6">

            <SectionCard

              number="01"

              title="اختر كمية المياه"

              description={`سعر اللتر ${unitPrice.toFixed(

                2

              )} ر.س`}

              icon={<Droplet className="h-5 w-5" />}

           >

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                {presets.map((preset) => {

                  const active =

                    !customMode && quantity === preset;



                  return (

                    <motion.button

                      whileTap={{ scale: 0.97 }}

                      type="button"

                      key={preset}

                      onClick={() => {

                        setCustomMode(false);

                        setQuantity(preset);

                      }}

                      className={`relative min-h-[105px] overflow-hidden rounded-[20px] border p-4 text-center transition ${

                        active

                          ? "border-[#16a6c9] bg-[#eaf9fc] shadow-[0_10px_28px_rgba(22,166,201,.10)]"

                          : "border-[#dfebef] bg-white hover:border-[#b9dfe7]"

                      }`}

                   >

                      {active ? (

                        <span className="absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#16a6c9] text-white">

                          <Check className="h-3.5 w-3.5" />

                        </span>

                      ) : null}



                      <Droplets

                        className={`mx-auto h-6 w-6 ${

                          active

                            ? "text-[#16a6c9]"

                            : "text-[#a1b2bc]"

                        }`}

                      />



                      <p className="mt-3 text-lg font-extrabold text-[#0d2b4e]">

                        {preset.toLocaleString("ar-SA")}

                      </p>



                      <p className="mt-1 text-[10px] font-bold text-[#8a9da9]">

                        لتر

                      </p>

                    </motion.button>

                  );

                })}

              </div>



              {service.settings?.allow_custom_quantity !== false ? (

                <div className="mt-4">

                  <button

                    type="button"

                    onClick={() => setCustomMode(true)}

                    className={`text-xs font-extrabold ${

                      customMode

                        ? "text-[#0d2b4e]"

                        : "text-[#16a6c9]"

                    }`}

                 >

                    أريد كمية مختلفة

                  </button>



                  <AnimatePresence>

                    {customMode ? (

                      <motion.div

                        initial={{

                          opacity: 0,

                          height: 0,

                        }}

                        animate={{

                          opacity: 1,

                          height: "auto",

                        }}

                        exit={{

                          opacity: 0,

                          height: 0,

                        }}

                        className="overflow-hidden"

                     >

                        <div className="relative mt-4">

                          <Gauge className="absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#16a6c9]" />



                          <input

                            type="number"

                            min={

                              service.minimum_quantity ?? 1

                            }

                            step={service.quantity_step ?? 1}

                            value={quantity}

                            onChange={(event) =>

                              setQuantity(

                                Number(event.target.value)

                              )

                            }

                            className="h-[56px] w-full rounded-[17px] border border-[#dce8ec] bg-[#fbfdfe] pr-11 pl-16 text-sm font-extrabold text-[#0d2b4e] outline-none focus:border-[#16a6c9]"

                          />



                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8295a2]">

                            لتر

                          </span>

                        </div>



                        <p className="mt-2 text-[10px] font-bold text-[#8da0ac]">

                          الحد الأدنى{" "}

                          {service.minimum_quantity ?? 1} لتر

                        </p>

                      </motion.div>

                    ) : null}

                  </AnimatePresence>

                </div>

              ) : null}

            </SectionCard>



            <SectionCard

              number="02"

              title="عنوان التنفيذ"

              description="حدد المكان الذي توجد فيه البرادة"

              icon={<MapPin className="h-5 w-5" />}

           >

              {addresses.length === 0 ? (

                <div className="rounded-[20px] border border-dashed border-[#cfe2e8] bg-[#f7fbfc] p-6 text-center">

                  <MapPin className="mx-auto h-7 w-7 text-[#16a6c9]" />



                  <h3 className="mt-3 text-sm font-extrabold text-[#0d2b4e]">

                    لا يوجد عنوان محفوظ

                  </h3>



                  <p className="mt-2 text-xs font-bold leading-6 text-[#8497a4]">

                    أضف عنوان تنفيذ الطلب، وسيتم اختياره

                    تلقائيًا.

                  </p>



                  <button

                    type="button"

                    onClick={() =>

                      setAddressModalOpen(true)

                    }

                    className="mx-auto mt-4 flex h-10 items-center gap-2 rounded-[13px] bg-[#0d2b4e] px-4 text-[11px] font-extrabold text-white"

                 >

                    <Plus className="h-4 w-4" />

                    إضافة عنوان

                  </button>

                </div>

              ) : (

                <div className="space-y-3">

                  {addresses.map((address) => {

                    const selected =

                      selectedAddress === address.id;



                    const locked =

                      cooler.address_id !== null &&

                      cooler.address_id !== address.id;



                    return (

                      <button

                        type="button"

                        key={address.id}

                        disabled={locked}

                        onClick={() =>

                          setSelectedAddress(address.id)

                        }

                        className={`flex w-full items-start gap-3 rounded-[18px] border p-4 text-right transition ${

                          selected

                            ? "border-[#16a6c9] bg-[#ebf9fc]"

                            : "border-[#e0ebef] bg-white"

                        } ${

                          locked

                            ? "cursor-not-allowed opacity-40"

                            : ""

                        }`}

                     >

                        <span

                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] ${

                            selected

                              ? "bg-[#16a6c9] text-white"

                              : "bg-[#f1f7f9] text-[#8ca0ac]"

                          }`}

                       >

                          <MapPin className="h-4 w-4" />

                        </span>



                        <span className="min-w-0 flex-1">

                          <span className="flex items-center gap-2">

                            <span className="text-sm font-extrabold text-[#0d2b4e]">

                              {address.label}

                            </span>



                            {address.is_default ? (

                              <span className="rounded-full bg-[#e9f8fb] px-2 py-1 text-[9px] font-extrabold text-[#16a6c9]">

                                الافتراضي

                              </span>

                            ) : null}

                          </span>



                          <span className="mt-1 block text-xs font-bold leading-6 text-[#8295a2]">

                            {address.city}،{" "}

                            {address.district}،{" "}

                            {address.street}

                          </span>

                        </span>



                        {selected ? (

                          <Check className="mt-2 h-4 w-4 text-[#16a6c9]" />

                        ) : null}

                      </button>

                    );

                  })}



                  {cooler.address_id === null ? (

                    <button

                      type="button"

                      onClick={() =>

                        setAddressModalOpen(true)

                      }

                      className="flex items-center gap-2 text-[11px] font-extrabold text-[#16a6c9]"

                   >

                      <Plus className="h-4 w-4" />

                      إضافة عنوان جديد

                    </button>

                  ) : null}

                </div>

              )}

            </SectionCard>



            <SectionCard

              number="03"

              title="الأولوية والموعد"

              description="اختر سرعة الخدمة والموعد المناسب"

              icon={<Clock3 className="h-5 w-5" />}

           >

              <div className="grid gap-3 sm:grid-cols-2">

                <PriorityCard

                  active={priority === "standard"}

                  onClick={() => setPriority("standard")}

                  title="طلب عادي"

                  description="تنفيذ ضمن الوقت المعتاد"

                  price="بدون رسوم إضافية"

                  icon={<Clock3 className="h-5 w-5" />}

                />



                <PriorityCard

                  active={priority === "urgent"}

                  onClick={() => setPriority("urgent")}

                  title="طلب عاجل"

                  description="أولوية أعلى في التنفيذ"

                  price={`+ ${Number(

                    service.urgent_fee

                  ).toFixed(2)} ر.س`}

                  icon={<Zap className="h-5 w-5" />}

                />

              </div>



              <div className="mt-5">

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

                      setPreferredDate(event.target.value)

                    }

                    className="h-[54px] w-full rounded-[16px] border border-[#dce8ec] bg-white pr-11 pl-4 text-sm font-bold text-[#0d2b4e] outline-none focus:border-[#16a6c9]"

                  />

                </div>

              </div>



              <div className="mt-5 grid gap-3 sm:grid-cols-3">

                {timeSlots.map((slot) => {

                  const active =

                    timeSlot === slot.value;



                  return (

                    <button

                      type="button"

                      key={slot.value}

                      onClick={() =>

                        setTimeSlot(slot.value)

                      }

                      className={`rounded-[17px] border p-4 text-right transition ${

                        active

                          ? "border-[#16a6c9] bg-[#ebf9fc]"

                          : "border-[#e0ebef] bg-white"

                      }`}

                   >

                      <p className="text-xs font-extrabold text-[#0d2b4e]">

                        {slot.label}

                      </p>



                      <p className="mt-1 text-[10px] font-bold text-[#8a9daa]">

                        {slot.sub}

                      </p>

                    </button>

                  );

                })}

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

                placeholder="مثال: يرجى الاتصال قبل الوصول..."

                className="w-full resize-none rounded-[17px] border border-[#dce8ec] bg-[#fbfdfe] p-4 text-sm font-bold text-[#0d2b4e] outline-none placeholder:font-normal placeholder:text-[#a4b4be] focus:border-[#16a6c9]"

              />

            </SectionCard>

          </div>



          <aside className="xl:sticky xl:top-[100px] xl:h-fit">

            <div className="overflow-hidden rounded-[26px] border border-[#e0ecef] bg-white shadow-[0_18px_55px_rgba(13,43,78,.07)]">

              <div className="relative overflow-hidden bg-[#0d2b4e] p-5">

                <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-[#16a6c9]/20 blur-[35px]" />



                <div className="relative z-10">

                  <p className="text-[11px] font-extrabold text-[#66daf1]">

                    ملخص الطلب

                  </p>



                  <h2 className="mt-1 text-lg font-extrabold text-white">

                    تعبئة مياه التحلية

                  </h2>

                </div>

              </div>



              <div className="p-5">

                <SummaryRow

                  label="البرادة"

                  value={cooler.name}

                />



                <SummaryRow

                  label="الكمية"

                  value={`${quantity.toLocaleString(

                    "ar-SA"

                  )} لتر`}

                />



                <SummaryRow

                  label="سعر اللتر"

                  value={`${unitPrice.toFixed(2)} ر.س`}

                />



                <SummaryRow

                  label="الأولوية"

                  value={

                    priority === "urgent"

                      ? "عاجل"

                      : "عادي"

                  }

                />



                {urgentFee> 0 ? (

                  <SummaryRow

                    label="رسوم الاستعجال"

                    value={`${urgentFee.toFixed(2)} ر.س`}

                  />

                ) : null}



                <div className="my-4 border-t border-dashed border-[#dfe9ed]" />



                <div className="flex items-end justify-between gap-4">

                  <div>

                    <p className="text-[10px] font-bold text-[#879aa7]">

                      المبلغ قبل الضريبة

                    </p>



                    <p className="mt-1 text-[11px] font-bold text-[#9aabb5]">

                      تُحسب الضريبة نهائيًا من إعدادات النظام

                    </p>

                  </div>



                  <p className="text-xl font-extrabold text-[#0d2b4e]">

                    {previewSubtotal.toFixed(2)}

                    <span className="mr-1 text-xs">

                      ر.س

                    </span>

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

                  disabled={submitting}

                  className="mt-5 flex h-[56px] w-full items-center justify-center gap-2 rounded-[17px] bg-[linear-gradient(110deg,#0d2b4e,#123f69_55%,#0e5875)] text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(13,43,78,.17)] disabled:opacity-60"

               >

                  {submitting ? (

                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-white" />

                  ) : (

                    <>

                      <span>تأكيد والانتقال للدفع</span>

                      <ArrowLeft className="h-4 w-4" />

                    </>

                  )}

                </motion.button>



                <p className="mt-3 text-center text-[10px] font-bold leading-5 text-[#94a5af]">

                  طلب تعبئة المياه يحتاج الدفع قبل بدء التنفيذ.

                </p>

              </div>

            </div>

          </aside>

        </form>



        <AnimatePresence>

          {addressModalOpen ? (

            <AddressModal

              onClose={() =>

                setAddressModalOpen(false)

              }

              onCreated={handleAddressCreated}

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



        <div className="flex-1">

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



function PriorityCard({

  active,

  onClick,

  title,

  description,

  price,

  icon,

}: {

  active: boolean;

  onClick: () => void;

  title: string;

  description: string;

  price: string;

  icon: React.ReactNode;

}) {

  return (

    <button

      type="button"

      onClick={onClick}

      className={`rounded-[20px] border p-4 text-right transition ${

        active

          ? "border-[#16a6c9] bg-[#ebf9fc]"

          : "border-[#e0ebef] bg-white"

      }`}

   >

      <div

        className={`flex h-10 w-10 items-center justify-center rounded-[13px] ${

          active

            ? "bg-[#16a6c9] text-white"

            : "bg-[#f1f7f9] text-[#8297a4]"

        }`}

     >

        {icon}

      </div>



      <h3 className="mt-3 text-sm font-extrabold text-[#0d2b4e]">

        {title}

      </h3>



      <p className="mt-1 text-[10px] font-bold text-[#899ba7]">

        {description}

      </p>



      <p className="mt-3 text-[11px] font-extrabold text-[#16a6c9]">

        {price}

      </p>

    </button>

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



function AddressModal({

  onClose,

  onCreated,

}: {

  onClose: () => void;

  onCreated: (address: Address) => void;

}) {

  const [label, setLabel] = useState("");

  const [city, setCity] = useState("");

  const [district, setDistrict] = useState("");

  const [street, setStreet] = useState("");

  const [building, setBuilding] = useState("");

  const [postalCode, setPostalCode] = useState("");

  const [notes, setNotes] = useState("");



  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");



  async function createAddress(

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

        await apiRequest<AddressCreateResponse>(

          "/addresses",

          {

            method: "POST",

            token,

            body: JSON.stringify({

              label: label.trim(),

              city: city.trim(),

              district: district.trim(),

              street: street.trim(),

              building: building.trim() || null,

              postal_code: postalCode.trim() || null,

              notes: notes.trim() || null,

            }),

          }

        );



      onCreated(response.data.address);

    } catch (exception) {

      if (exception instanceof ApiError) {

        setError(exception.message);

      } else {

        setError("تعذر إضافة العنوان");

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

        initial={{ opacity: 0 }}

        animate={{ opacity: 1 }}

        exit={{ opacity: 0 }}

        className="fixed inset-0 z-[80] bg-[#061a2f]/45 backdrop-blur-[3px]"

      />



      <motion.div

        initial={{

          opacity: 0,

          y: 25,

          scale: 0.97,

        }}

        animate={{

          opacity: 1,

          y: 0,

          scale: 1,

        }}

        exit={{

          opacity: 0,

          y: 15,

          scale: 0.97,

        }}

        className="fixed inset-x-4 top-1/2 z-[90] mx-auto max-h-[90vh] max-w-[540px] -translate-y-1/2 overflow-y-auto rounded-[28px] bg-white shadow-[0_30px_100px_rgba(5,24,44,.26)]"

     >

        <div className="sticky top-0 z-10 flex items-center justify-between bg-[#0d2b4e] px-5 py-4">

          <div>

            <p className="text-[10px] font-bold text-[#6bdcf2]">

              عنوان جديد

            </p>



            <h2 className="mt-1 font-extrabold text-white">

              أضف عنوان التنفيذ

            </h2>

          </div>



          <button

            type="button"

            onClick={onClose}

            className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-white/10 text-white"

         >

            <X className="h-4 w-4" />

          </button>

        </div>



        <form onSubmit={createAddress} className="p-5">

          <div className="grid gap-4 sm:grid-cols-2">

            <AddressInput

              label="اسم العنوان"

              value={label}

              onChange={setLabel}

              placeholder="المنزل"

            />



            <AddressInput

              label="المدينة"

              value={city}

              onChange={setCity}

              placeholder="الرياض"

            />



            <AddressInput

              label="الحي"

              value={district}

              onChange={setDistrict}

              placeholder="اسم الحي"

            />



            <AddressInput

              label="الشارع"

              value={street}

              onChange={setStreet}

              placeholder="اسم الشارع"

            />



            <AddressInput

              label="رقم المبنى"

              value={building}

              onChange={setBuilding}

              placeholder="12"

            />



            <AddressInput

              label="الرمز البريدي"

              value={postalCode}

              onChange={setPostalCode}

              placeholder="13521"

            />

          </div>



          <div className="mt-4">

            <label className="mb-2 block text-xs font-extrabold text-[#0d2b4e]">

              ملاحظات العنوان

            </label>



            <textarea

              value={notes}

              onChange={(event) =>

                setNotes(event.target.value)

              }

              rows={3}

              placeholder="مثال: الدور الثاني"

              className="w-full resize-none rounded-[15px] border border-[#dce8ec] p-4 text-sm font-bold text-[#0d2b4e] outline-none focus:border-[#16a6c9]"

            />

          </div>



          {error ? (

            <div className="mt-4 rounded-[14px] bg-red-50 px-4 py-3 text-xs font-bold text-red-600">

              {error}

            </div>

          ) : null}



          <div className="mt-5 flex gap-3">

            <button

              type="button"

              onClick={onClose}

              className="h-[50px] flex-1 rounded-[15px] border border-[#dce8ec] text-xs font-extrabold text-[#718592]"

           >

              إلغاء

            </button>



            <button

              type="submit"

              disabled={saving}

              className="flex h-[50px] flex-[1.5] items-center justify-center gap-2 rounded-[15px] bg-[#0d2b4e] text-xs font-extrabold text-white disabled:opacity-60"

           >

              {saving ? (

                "جاري الحفظ..."

              ) : (

                <>

                  <Check className="h-4 w-4" />

                  حفظ العنوان

                </>

              )}

            </button>

          </div>

        </form>

      </motion.div>

    </>

  );

}



function AddressInput({

  label,

  value,

  onChange,

  placeholder,

}: {

  label: string;

  value: string;

  onChange: (value: string) => void;

  placeholder: string;

}) {

  return (

    <div>

      <label className="mb-2 block text-xs font-extrabold text-[#0d2b4e]">

        {label}

      </label>



      <input

        required

        value={value}

        onChange={(event) =>

          onChange(event.target.value)

        }

        placeholder={placeholder}

        className="h-[52px] w-full rounded-[15px] border border-[#dce8ec] px-4 text-sm font-bold text-[#0d2b4e] outline-none placeholder:font-normal placeholder:text-[#a3b3bd] focus:border-[#16a6c9]"

      />

    </div>

  );

}