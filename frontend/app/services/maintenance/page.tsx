"use client";



import AppShell from "@/components/app/AppShell";
import ServiceLoadError from "@/components/app/ServiceLoadError";

import { API_URL, ApiError, apiRequest } from "@/lib/api";

import { getAuthToken, removeAuthToken } from "@/lib/auth";

import { AnimatePresence, motion } from "framer-motion";

import {

  ArrowLeft,

  CalendarDays,

  Camera,

  Check,

  ChevronRight,

  Clock3,

  Droplets,

  ImagePlus,

  MapPin,

  Plus,

  Snowflake,

  Sparkles,

  Volume2,

  Wrench,

  X,

  Zap,

} from "lucide-react";

import Link from "next/link";

import { useRouter, useSearchParams } from "next/navigation";

import {

  ChangeEvent,

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

  urgent_fee: string;

  requires_cooler: boolean;

  settings?: {

    issue_types?: string[];

    allow_photos?: boolean;

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

  service_name: string;

  priority: string;

  status: string;

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



const issueIcons: Record<string, React.ReactNode> = {

  "تسرب مياه": <Droplets className="h-5 w-5" />,

  "تسرّب مياه": <Droplets className="h-5 w-5" />,

  "ضعف التبريد": <Snowflake className="h-5 w-5" />,

  "صنبور تالف": <Wrench className="h-5 w-5" />,

  "عطل المضخة": <Wrench className="h-5 w-5" />,

  ضوضاء: <Volume2 className="h-5 w-5" />,

  أخرى: <Sparkles className="h-5 w-5" />,

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



export default function MaintenancePage() {

  const router = useRouter();

  const searchParams = useSearchParams();



  const coolerId = searchParams.get("cooler");



  const [service, setService] = useState<Service | null>(null);

  const [cooler, setCooler] = useState<Cooler | null>(null);

  const [addresses, setAddresses] = useState<Address[]>([]);



  const [selectedAddress, setSelectedAddress] =

    useState<number | null>(null);



  const [issueType, setIssueType] = useState("");

  const [description, setDescription] = useState("");

  const [notes, setNotes] = useState("");



  const [priority, setPriority] =

    useState<"standard" | "urgent">("standard");



  const [preferredDate, setPreferredDate] = useState("");

  const [timeSlot, setTimeSlot] = useState("morning");



  const [photos, setPhotos] = useState<File[]>([]);

  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);



  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");



  const [successOrder, setSuccessOrder] =

    useState<Order | null>(null);



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

            "/services/maintenance"

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



        const firstIssue =

          loadedService.settings?.issue_types?.[0];



        if (firstIssue) {

          setIssueType(firstIssue);

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

          "تعذر تحميل بيانات خدمة الصيانة"

        );

      } finally {

        setLoading(false);

      }

    }



    void loadData();

  }, [coolerId, router]);



  useEffect(() => {

    return () => {

      photoPreviews.forEach((url) =>

        URL.revokeObjectURL(url)

      );

    };

  }, [photoPreviews]);



  const urgentFee = useMemo(() => {

    if (priority !== "urgent") {

      return 0;

    }



    return Number(service?.urgent_fee ?? 0);

  }, [priority, service]);



  function handlePhotos(

    event: ChangeEvent<HTMLInputElement>

  ) {

    const selected = Array.from(

      event.target.files ?? []

    );



    setError("");



    if (photos.length + selected.length> 5) {

      setError(

        "يمكن إرفاق 5 صور كحد أقصى"

      );

      event.target.value = "";

      return;

    }



    for (const file of selected) {

      const validTypes = [

        "image/jpeg",

        "image/png",

        "image/webp",

      ];



      if (!validTypes.includes(file.type)) {

        setError(

          "الصور المسموحة JPG أو PNG أو WebP فقط"

        );

        event.target.value = "";

        return;

      }



      if (file.size> 5 * 1024 * 1024) {

        setError(

          "حجم الصورة الواحدة يجب ألا يتجاوز 5MB"

        );

        event.target.value = "";

        return;

      }

    }



    setPhotos((current) => [

      ...current,

      ...selected,

    ]);



    setPhotoPreviews((current) => [

      ...current,

      ...selected.map((file) =>

        URL.createObjectURL(file)

      ),

    ]);



    event.target.value = "";

  }



  function removePhoto(index: number) {

    URL.revokeObjectURL(photoPreviews[index]);



    setPhotos((current) =>

      current.filter((_, i) => i !== index)

    );



    setPhotoPreviews((current) =>

      current.filter((_, i) => i !== index)

    );

  }



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



    if (!issueType) {

      setError("اختر نوع المشكلة");

      return;

    }



    if (!description.trim()) {

      setError(

        "اكتب وصفًا مختصرًا للمشكلة"

      );

      return;

    }



    if (!selectedAddress) {

      setError(

        "يجب تحديد عنوان صالح لتنفيذ الطلب"

      );

      setAddressModalOpen(true);

      return;

    }



    setError("");

    setSubmitting(true);



    try {

      const formData = new FormData();



      formData.append(

        "service_code",

        "maintenance"

      );



      formData.append(

        "cooler_id",

        String(cooler.id)

      );



      formData.append(

        "address_id",

        String(selectedAddress)

      );



      formData.append(

        "priority",

        priority

      );



      if (preferredDate) {

        formData.append(

          "preferred_date",

          preferredDate

        );

      }



      if (timeSlot) {

        formData.append(

          "preferred_time_slot",

          timeSlot

        );

      }



      formData.append(

        "service_data[issue_type]",

        issueType

      );



      formData.append(

        "service_data[description]",

        description.trim()

      );



      if (notes.trim()) {

        formData.append(

          "notes",

          notes.trim()

        );

      }



      photos.forEach((photo, index) => {

        formData.append(

          `attachments[${index}]`,

          photo

        );

      });



      const response = await fetch(

        `${API_URL}/orders`,

        {

          method: "POST",

          headers: {

            Accept: "application/json",

            Authorization: `Bearer ${token}`,

          },

          body: formData,

        }

      );



      const payload = await response

        .json()

        .catch(() => null);



      if (!response.ok) {

        const errors =

          payload?.errors as

            | Record<string, string[]>

            | undefined;



        const firstMessage = errors

          ? Object.values(errors)[0]?.[0]

          : undefined;



        throw new ApiError(

          firstMessage ||

            payload?.message ||

            "تعذر إنشاء الطلب",

          response.status,

          errors

        );

      }



      const result =

        payload as OrderResponse;



      setSuccessOrder(

        result.data.order

      );

    } catch (exception) {

      if (exception instanceof ApiError) {

        setError(exception.message);

      } else {

        setError(

          "تعذر إنشاء طلب الصيانة"

        );

      }

    } finally {

      setSubmitting(false);

    }

  }



  function handleAddressCreated(

    address: Address

  ) {

    setAddresses((current) => [

      address,

      ...current,

    ]);



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

            جاري تجهيز خدمة الصيانة...

          </p>

        </div>

      </div>

    );

  }



  if (!service || !cooler) {
    return (
      <AppShell>
        <ServiceLoadError serviceName="الصيانة" message={error || undefined} />
      </AppShell>
    );
  }

    const issueTypes =

    service.settings?.issue_types ?? [];



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

              صيانة البرادة

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

              duration: 40,

              repeat: Infinity,

              ease: "linear",

            }}

          />



          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-2 text-[11px] font-extrabold text-[#72e1f6]">

                <Wrench className="h-4 w-4" />

                خدمة الصيانة

              </div>



              <h1 className="mt-4 text-[29px] font-extrabold text-white sm:text-[36px]">

                خلّينا نعرف المشكلة

              </h1>



              <p className="mt-3 max-w-xl text-sm font-bold leading-7 text-white/55">

                حدد العطل وأضف الصور إن كانت

                متاحة لنفهم حالة البرادة بشكل

                أوضح.

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

          className="mt-7 grid gap-6 xl:grid-cols-[1fr_370px]"

       >

          <div className="space-y-6">

            <SectionCard

              number="01"

              title="ما المشكلة؟"

              description="اختر أقرب وصف للعطل"

              icon={<Wrench className="h-5 w-5" />}

           >

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                {issueTypes.map((issue) => {

                  const active =

                    issueType === issue;



                  return (

                    <motion.button

                      key={issue}

                      type="button"

                      whileTap={{

                        scale: 0.98,

                      }}

                      onClick={() =>

                        setIssueType(issue)

                      }

                      className={`relative flex min-h-[110px] flex-col items-start rounded-[20px] border p-4 text-right transition ${

                        active

                          ? "border-[#16a6c9] bg-[#ebf9fc]"

                          : "border-[#e0ebef] bg-white hover:border-[#b9dfe7]"

                      }`}

                   >

                      {active ? (

                        <span className="absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#16a6c9] text-white">

                          <Check className="h-3.5 w-3.5" />

                        </span>

                      ) : null}



                      <div

                        className={`flex h-10 w-10 items-center justify-center rounded-[13px] ${

                          active

                            ? "bg-[#16a6c9] text-white"

                            : "bg-[#f0f7f9] text-[#8ca0ac]"

                        }`}

                     >

                        {issueIcons[issue] ?? (

                          <Wrench className="h-5 w-5" />

                        )}

                      </div>



                      <p className="mt-3 text-sm font-extrabold text-[#0d2b4e]">

                        {issue}

                      </p>

                    </motion.button>

                  );

                })}

              </div>



              <div className="mt-5">

                <label className="mb-2 block text-xs font-extrabold text-[#0d2b4e]">

                  اشرح المشكلة

                </label>



                <textarea

                  value={description}

                  onChange={(event) =>

                    setDescription(

                      event.target.value

                    )

                  }

                  rows={4}

                  placeholder="مثال: التبريد أصبح ضعيفًا منذ يومين..."

                  className="w-full resize-none rounded-[17px] border border-[#dce8ec] bg-[#fbfdfe] p-4 text-sm font-bold text-[#0d2b4e] outline-none placeholder:font-normal placeholder:text-[#a4b4be] focus:border-[#16a6c9]"

                />

              </div>

            </SectionCard>



            <SectionCard

              number="02"

              title="صور المشكلة"

              description="اختياري - تساعد على فهم العطل قبل التنفيذ"

              icon={<Camera className="h-5 w-5" />}

           >

              <label className="group flex cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-[#bcdde5] bg-[#f7fbfc] px-5 py-8 text-center transition hover:border-[#16a6c9] hover:bg-[#f1fafc]">

                <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#e8f7fa] text-[#16a6c9] transition group-hover:scale-105">

                  <ImagePlus className="h-6 w-6" />

                </div>



                <p className="mt-4 text-sm font-extrabold text-[#0d2b4e]">

                  أضف صورًا للمشكلة

                </p>



                <p className="mt-2 text-[10px] font-bold leading-5 text-[#899ca8]">

                  JPG أو PNG أو WebP

                  <br />

                  حتى 5 صور، 5MB للصورة

                </p>



                <input

                  type="file"

                  multiple

                  accept="image/jpeg,image/png,image/webp"

                  onChange={handlePhotos}

                  className="hidden"

                />

              </label>



              {photoPreviews.length> 0 ? (

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">

                  {photoPreviews.map(

                    (preview, index) => (

                      <div

                        key={preview}

                        className="group relative aspect-square overflow-hidden rounded-[17px] border border-[#dce8ec] bg-[#f5f9fa]"

                     >

                        <img

                          src={preview}

                          alt={`صورة ${index + 1}`}

                          className="h-full w-full object-cover"

                        />



                        <button

                          type="button"

                          onClick={() =>

                            removePhoto(index)

                          }

                          className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#0d2b4e]/85 text-white backdrop-blur"

                       >

                          <X className="h-3.5 w-3.5" />

                        </button>

                      </div>

                    )

                  )}

                </div>

              ) : null}

            </SectionCard>



            <SectionCard

              number="03"

              title="عنوان التنفيذ"

              description="حدد مكان البرادة"

              icon={<MapPin className="h-5 w-5" />}

           >

              {addresses.length === 0 ? (

                <div className="rounded-[20px] border border-dashed border-[#cfe2e8] bg-[#f7fbfc] p-6 text-center">

                  <MapPin className="mx-auto h-7 w-7 text-[#16a6c9]" />



                  <h3 className="mt-3 text-sm font-extrabold text-[#0d2b4e]">

                    لا يوجد عنوان محفوظ

                  </h3>



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



                        <span className="flex-1">

                          <span className="text-sm font-extrabold text-[#0d2b4e]">

                            {address.label}

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

                </div>

              )}

            </SectionCard>



            <SectionCard

              number="04"

              title="موعد الخدمة"

              description="اختر الأولوية والوقت المناسب"

              icon={<Clock3 className="h-5 w-5" />}

           >

              <div className="grid gap-3 sm:grid-cols-2">

                <PriorityCard

                  active={

                    priority === "standard"

                  }

                  onClick={() =>

                    setPriority("standard")

                  }

                  title="طلب عادي"

                  description="تنفيذ ضمن الوقت المعتاد"

                  price="بدون رسوم إضافية"

                  icon={

                    <Clock3 className="h-5 w-5" />

                  }

                />



                <PriorityCard

                  active={

                    priority === "urgent"

                  }

                  onClick={() =>

                    setPriority("urgent")

                  }

                  title="طلب عاجل"

                  description="أولوية أعلى في التنفيذ"

                  price={`+ ${urgentFee.toFixed(

                    2

                  )} ر.س`}

                  icon={

                    <Zap className="h-5 w-5" />

                  }

                />

              </div>



              <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_1.5fr]">

                <div>

                  <label className="mb-2 block text-xs font-extrabold text-[#0d2b4e]">

                    التاريخ

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

              number="05"

              title="ملاحظات إضافية"

              description="اختياري"

              icon={<Sparkles className="h-5 w-5" />}

           >

              <textarea

                value={notes}

                onChange={(event) =>

                  setNotes(event.target.value)

                }

                rows={3}

                placeholder="أي تعليمات إضافية لفريق الخدمة..."

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

                    ملخص الطلب

                  </p>



                  <h2 className="mt-1 text-lg font-extrabold text-white">

                    صيانة البرادة

                  </h2>

                </div>

              </div>



              <div className="p-5">

                <SummaryRow

                  label="البرادة"

                  value={cooler.name}

                />



                <SummaryRow

                  label="المشكلة"

                  value={

                    issueType ||

                    "لم يتم الاختيار"

                  }

                />



                <SummaryRow

                  label="الصور"

                  value={`${photos.length} صورة`}

                />



                <SummaryRow

                  label="الأولوية"

                  value={

                    priority === "urgent"

                      ? "عاجل"

                      : "عادي"

                  }

                />



                {priority === "urgent" ? (

                  <SummaryRow

                    label="رسوم الاستعجال"

                    value={`${urgentFee.toFixed(

                      2

                    )} ر.س`}

                  />

                ) : null}



                <div className="my-4 border-t border-dashed border-[#dfe9ed]" />



                <div className="rounded-[16px] bg-[#f4fafb] p-4">

                  <p className="text-xs font-extrabold text-[#0d2b4e]">

                    لا يوجد دفع مقدم للصيانة

                  </p>



                  <p className="mt-2 text-[10px] font-bold leading-5 text-[#8497a4]">

                    يتم تسجيل طلب الصيانة

                    مباشرة ومتابعة حالته من قسم

                    طلباتي.

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

                      <span>

                        إرسال طلب الصيانة

                      </span>



                      <ArrowLeft className="h-4 w-4" />

                    </>

                  )}

                </motion.button>

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

              onCreated={

                handleAddressCreated

              }

            />

          ) : null}



          {successOrder ? (

            <SuccessModal

              order={successOrder}

              coolerId={cooler.id}

              onClose={() =>

                setSuccessOrder(null)

              }

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



      <span className="max-w-[190px] truncate text-xs font-extrabold text-[#0d2b4e]">

        {value}

      </span>

    </div>

  );

}



function SuccessModal({

  order,

  coolerId,

  onClose,

}: {

  order: Order;

  coolerId: number;

  onClose: () => void;

}) {

  return (

    <>

      <motion.div

        initial={{ opacity: 0 }}

        animate={{ opacity: 1 }}

        className="fixed inset-0 z-[100] bg-[#061a2f]/50 backdrop-blur-[4px]"

      />



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

        className="fixed inset-x-4 top-1/2 z-[110] mx-auto max-w-[440px] -translate-y-1/2 rounded-[30px] bg-white p-6 text-center shadow-[0_35px_100px_rgba(5,24,44,.28)] sm:p-8"

     >

        <motion.div

          initial={{ scale: 0 }}

          animate={{ scale: 1 }}

          transition={{

            type: "spring",

            stiffness: 180,

            damping: 15,

          }}

          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#e7f8f1]"

       >

          <Check className="h-9 w-9 text-[#27ae60]" />

        </motion.div>



        <h2 className="mt-5 text-xl font-extrabold text-[#0d2b4e]">

          تم إرسال طلب الصيانة

        </h2>



        <p className="mt-3 text-sm font-bold leading-7 text-[#7d909e]">

          تم تسجيل الطلب بنجاح ويمكنك

          متابعة حالته من طلباتك.

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

        </div>



        <div className="mt-6 grid grid-cols-2 gap-3">

          <Link

            href={`/coolers/${coolerId}`}

            className="flex h-[48px] items-center justify-center rounded-[15px] border border-[#dce8ec] text-xs font-extrabold text-[#718592]"

         >

            العودة للبرادة

          </Link>



          <button

            type="button"

            onClick={onClose}

            className="h-[48px] rounded-[15px] bg-[#0d2b4e] text-xs font-extrabold text-white"

         >

            تم

          </button>

        </div>

      </motion.div>

    </>

  );

}



function AddressModal({

  onClose,

  onCreated,

}: {

  onClose: () => void;

  onCreated: (address: Address) => void;

}) {

  const [label, setLabel] =

    useState("");



  const [city, setCity] = useState("");

  const [district, setDistrict] =

    useState("");



  const [street, setStreet] =

    useState("");



  const [building, setBuilding] =

    useState("");



  const [postalCode, setPostalCode] =

    useState("");



  const [notes, setNotes] =

    useState("");



  const [saving, setSaving] =

    useState(false);



  const [error, setError] =

    useState("");



  async function createAddress(

    event: FormEvent<HTMLFormElement>

  ) {

    event.preventDefault();



    const token = getAuthToken();



    if (!token) {

      return;

    }



    setSaving(true);

    setError("");



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

              building:

                building.trim() || null,

              postal_code:

                postalCode.trim() || null,

              notes:

                notes.trim() || null,

            }),

          }

        );



      onCreated(

        response.data.address

      );

    } catch (exception) {

      if (exception instanceof ApiError) {

        setError(exception.message);

      } else {

        setError(

          "تعذر إضافة العنوان"

        );

      }

    } finally {

      setSaving(false);

    }

  }



  return (

    <>

      <button

        type="button"

        onClick={onClose}

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

        className="fixed inset-x-4 top-1/2 z-[90] mx-auto max-h-[90vh] max-w-[540px] -translate-y-1/2 overflow-y-auto rounded-[28px] bg-white shadow-[0_30px_100px_rgba(5,24,44,.26)]"

     >

        <div className="sticky top-0 flex items-center justify-between bg-[#0d2b4e] px-5 py-4">

          <h2 className="font-extrabold text-white">

            أضف عنوان التنفيذ

          </h2>



          <button

            type="button"

            onClick={onClose}

            className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-white/10 text-white"

         >

            <X className="h-4 w-4" />

          </button>

        </div>



        <form

          onSubmit={createAddress}

          className="p-5"

       >

          <div className="grid gap-4 sm:grid-cols-2">

            <AddressInput

              label="اسم العنوان"

              value={label}

              onChange={setLabel}

            />



            <AddressInput

              label="المدينة"

              value={city}

              onChange={setCity}

            />



            <AddressInput

              label="الحي"

              value={district}

              onChange={setDistrict}

            />



            <AddressInput

              label="الشارع"

              value={street}

              onChange={setStreet}

            />



            <AddressInput

              label="رقم المبنى"

              value={building}

              onChange={setBuilding}

            />



            <AddressInput

              label="الرمز البريدي"

              value={postalCode}

              onChange={setPostalCode}

            />

          </div>



          <div className="mt-4">

            <label className="mb-2 block text-xs font-extrabold text-[#0d2b4e]">

              ملاحظات

            </label>



            <textarea

              value={notes}

              onChange={(event) =>

                setNotes(

                  event.target.value

                )

              }

              rows={3}

              className="w-full resize-none rounded-[15px] border border-[#dce8ec] p-4 text-sm font-bold text-[#0d2b4e] outline-none focus:border-[#16a6c9]"

            />

          </div>



          {error ? (

            <div className="mt-4 rounded-[14px] bg-red-50 px-4 py-3 text-xs font-bold text-red-600">

              {error}

            </div>

          ) : null}



          <button

            type="submit"

            disabled={saving}

            className="mt-5 h-[50px] w-full rounded-[15px] bg-[#0d2b4e] text-xs font-extrabold text-white disabled:opacity-60"

         >

            {saving

              ? "جاري الحفظ..."

              : "حفظ العنوان"}

          </button>

        </form>

      </motion.div>

    </>

  );

}



function AddressInput({

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

        required

        value={value}

        onChange={(event) =>

          onChange(event.target.value)

        }

        className="h-[52px] w-full rounded-[15px] border border-[#dce8ec] px-4 text-sm font-bold text-[#0d2b4e] outline-none focus:border-[#16a6c9]"

      />

    </div>

  );

}