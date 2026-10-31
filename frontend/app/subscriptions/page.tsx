"use client";

import AppShell from "@/components/app/AppShell";
import { ApiError, apiRequest } from "@/lib/api";
import { getAuthToken, removeAuthToken } from "@/lib/auth";
import { AnimatePresence, motion } from "framer-motion";
import {
  BellRing,
  Check,
  ChevronLeft,
  Crown,
  Filter,
  MapPin,
  ShieldCheck,
  Snowflake,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type PlanBenefits = {
  annual_inspections: number;
  smart_alerts: boolean;
  priority_service: boolean;
  discount_percent: number;
  included_filter_changes: number;
};

type SubscriptionPlan = {
  id: number;
  code: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  billing_cycle: "monthly" | "yearly";
  price: string;
  currency: string;
  benefits: PlanBenefits;
  savings_percent: string | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
};

type Address = {
  id: number;
  label: string;
  city: string;
  district: string;
  street: string;
  building: string | null;
  is_default: boolean;
};

type Cooler = {
  id: number;
  address_id: number | null;
  name: string;
  photo: string | null;
  landmark: string | null;
  is_active: boolean;
  approval_status?: "pending_review" | "approved" | "rejected" | "disabled";
};

type Subscription = {
  id: number;
  address_id: number;
  plan_code: string;
  plan_name_ar: string;
  billing_cycle: string;
  price: string;
  currency: string;
  status: string;
  coolers_count: number;
  starts_at: string | null;
  ends_at: string | null;
  cancelled_at: string | null;
  benefits: PlanBenefits;
  address?: Address | null;
  coolers?: Cooler[];
};

type PlansResponse = {
  success: true;
  data: {
    plans: SubscriptionPlan[];
  };
};

type AddressesResponse = {
  success: true;
  data: {
    addresses: Address[];
  };
};

type CoolersResponse = {
  success: true;
  data: {
    coolers: Cooler[];
  };
};

type SubscriptionsResponse = {
  success: true;
  data: {
    subscriptions: Subscription[];
  };
};

type SavedSelection = {
  plan_code: string;
  address_id: number;
  cooler_ids: number[];
};

export default function SubscriptionsPage() {
  const router = useRouter();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [coolers, setCoolers] = useState<Cooler[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const [selectedPlan, setSelectedPlan] =
    useState<SubscriptionPlan | null>(null);

  const [selectionOpen, setSelectionOpen] = useState(false);

  useEffect(() => {
    const token = getAuthToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    async function loadPage() {
      try {
        const [
          plansResponse,
          addressesResponse,
          coolersResponse,
          subscriptionsResponse,
        ] = await Promise.all([
          apiRequest<PlansResponse>("/subscription-plans", {
            token,
          }),
          apiRequest<AddressesResponse>("/addresses", {
            token,
          }),
          apiRequest<CoolersResponse>("/coolers", {
            token,
          }),
          apiRequest<SubscriptionsResponse>("/subscriptions", {
            token,
          }),
        ]);

        setPlans(plansResponse.data.plans);
        setAddresses(addressesResponse.data.addresses);
        setCoolers(coolersResponse.data.coolers);
        setSubscriptions(
          subscriptionsResponse.data.subscriptions
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

        setError("تعذر تحميل الاشتراكات");
      } finally {
        setLoading(false);
      }
    }

    void loadPage();
  }, [router]);

  async function cancelPendingSubscription(subscriptionId: number) {
    if (cancellingId !== null) return;
    if (!window.confirm("هل تريد إلغاء الاشتراك غير المدفوع؟ سيتم التحقق من أن محاولة الدفع لدى ميسر لم تُستخدم.")) return;
    const token = getAuthToken();
    if (!token) { router.replace("/login"); return; }
    setCancellingId(subscriptionId);
    setError("");
    try {
      const response = await apiRequest<{ data: { subscription: Subscription } }>(
        `/subscriptions/${subscriptionId}/cancel`,
        { method: "POST", token }
      );
      setSubscriptions((items) => items.map((item) =>
        item.id === subscriptionId ? response.data.subscription : item));
    } catch (exception) {
      setError(exception instanceof ApiError ? exception.message :
        "تعذر إلغاء محاولة الدفع، راجع حالتها قبل تكرار الاشتراك.");
    } finally {
      setCancellingId(null);
    }
  }

  function choosePlan(plan: SubscriptionPlan) {
    setSelectedPlan(plan);
    setSelectionOpen(true);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f9fb]">
        <div className="flex flex-col items-center">
          <span className="h-11 w-11 animate-spin rounded-full border-[3px] border-[#d4e8ed] border-t-[#16a6c9]" />

          <p className="mt-4 text-sm font-extrabold text-[#718197]">
            جاري تحميل باقات نمير...
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
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(22,166,201,.32),transparent_30%),radial-gradient(circle_at_90%_100%,rgba(85,218,244,.10),transparent_30%),linear-gradient(135deg,#123d67,#0d2b4e_55%,#081f39)]" />

          <motion.div
            className="absolute -left-20 -top-20 h-72 w-72 rounded-full border border-white/[0.06]"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 50,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3.5 py-2 text-[11px] font-extrabold text-[#70dff5]">
              <Crown className="h-4 w-4" />
              عناية مستمرة لبرادتك
            </div>

            <h1 className="mt-5 text-[30px] font-extrabold leading-tight text-white sm:text-[38px]">
              اختر مستوى{" "}
              <span className="bg-gradient-to-l from-[#63def5] to-[#23b7d7] bg-clip-text text-transparent">
                العناية المناسب
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-sm font-bold leading-7 text-white/55">
              خطط مصممة لمتابعة البرادة وتذكيرك بالخدمات
              الدورية وتقديم مزايا إضافية حسب الباقة.
            </p>
          </div>
        </motion.section>

        {error ? (
          <div className="mt-5 rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            {error}
          </div>
        ) : null}

        {subscriptions.length > 0 ? (
          <section className="mt-7">
            <div className="mb-5">
              <p className="text-[11px] font-extrabold text-[#16a6c9]">
                حسابك
              </p>

              <h2 className="mt-1 text-xl font-extrabold text-[#0d2b4e]">
                اشتراكاتي
              </h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {subscriptions.map((subscription) => (
                <CurrentSubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                  onCancel={cancelPendingSubscription}
                  cancelling={cancellingId === subscription.id}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-9">
          <div className="mb-6 text-center">
            <p className="text-[11px] font-extrabold text-[#16a6c9]">
              باقات نمير
            </p>

            <h2 className="mt-2 text-[25px] font-extrabold text-[#0d2b4e] sm:text-[30px]">
              اختر الباقة التي تناسب احتياجك
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm font-bold leading-7 text-[#7d909e]">
              الأسعار والمزايا المعروضة هنا تأتي مباشرة من
              إعدادات النظام.
            </p>
          </div>

          <div className="grid items-stretch gap-5 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                index={index}
                onSelect={() => choosePlan(plan)}
              />
            ))}
          </div>
        </section>

        <section className="mt-9 rounded-[28px] border border-[#dfebef] bg-white p-5 shadow-[0_12px_40px_rgba(13,43,78,.04)] sm:p-7">
          <div className="grid gap-5 md:grid-cols-3">
            <TrustItem
              icon={<ShieldCheck className="h-5 w-5" />}
              title="عناية دورية"
              text="متابعة الخدمات والفحوص حسب مزايا باقتك."
            />

            <TrustItem
              icon={<BellRing className="h-5 w-5" />}
              title="تنبيهات ذكية"
              text="تذكيرات تساعدك على عدم تفويت العناية بالبرادة."
            />

            <TrustItem
              icon={<Zap className="h-5 w-5" />}
              title="أولوية الخدمة"
              text="الباقات تتضمن أولوية حسب إعدادات الخطة."
            />
          </div>
        </section>

        <AnimatePresence>
          {selectionOpen && selectedPlan ? (
            <PlanSelectionModal
              plan={selectedPlan}
              addresses={addresses}
              coolers={coolers}
              onClose={() => {
                setSelectionOpen(false);
                setSelectedPlan(null);
              }}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

function PlanCard({
  plan,
  index,
  onSelect,
}: {
  plan: SubscriptionPlan;
  index: number;
  onSelect: () => void;
}) {
  const price = Number(plan.price);

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 22,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: index * 0.08,
      }}
      whileHover={{
        y: -5,
      }}
      className={`relative flex min-h-[570px] flex-col overflow-hidden rounded-[28px] border p-6 transition ${
        plan.is_featured
          ? "border-[#16a6c9] bg-[#0d2b4e] shadow-[0_24px_70px_rgba(13,43,78,.17)]"
          : "border-[#dfecef] bg-white shadow-[0_14px_44px_rgba(13,43,78,.05)]"
      }`}
    >
      {plan.is_featured ? (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(22,166,201,.22),transparent_32%)]" />

          <span className="absolute left-5 top-5 rounded-full bg-[#16a6c9] px-3 py-1.5 text-[10px] font-extrabold text-white">
            الأكثر اختيارًا
          </span>
        </>
      ) : null}

      <div className="relative z-10">
        <div
          className={`flex h-13 w-13 items-center justify-center rounded-[17px] ${
            plan.is_featured
              ? "bg-white/10 text-[#68def5]"
              : "bg-[#eaf8fb] text-[#16a6c9]"
          }`}
        >
          {plan.code === "peace_of_mind" ? (
            <ShieldCheck className="h-6 w-6" />
          ) : plan.code === "full_care" ? (
            <Crown className="h-6 w-6" />
          ) : (
            <Sparkles className="h-6 w-6" />
          )}
        </div>

        <h3
          className={`mt-5 text-xl font-extrabold ${
            plan.is_featured
              ? "text-white"
              : "text-[#0d2b4e]"
          }`}
        >
          {plan.name_ar}
        </h3>

        <p
          className={`mt-3 min-h-[52px] text-xs font-bold leading-6 ${
            plan.is_featured
              ? "text-white/55"
              : "text-[#8094a2]"
          }`}
        >
          {plan.description_ar}
        </p>

        <div className="mt-6 flex items-end gap-1.5">
          <span
            className={`text-[40px] font-extrabold leading-none ${
              plan.is_featured
                ? "text-white"
                : "text-[#0d2b4e]"
            }`}
          >
            {price.toFixed(0)}
          </span>

          <div className="mb-1">
            <p
              className={`text-xs font-extrabold ${
                plan.is_featured
                  ? "text-[#68def5]"
                  : "text-[#16a6c9]"
              }`}
            >
              ر.س
            </p>

            <p
              className={`text-[9px] font-bold ${
                plan.is_featured
                  ? "text-white/35"
                  : "text-[#99aab4]"
              }`}
            >
              {plan.billing_cycle === "monthly"
                ? "شهريًا"
                : "سنويًا"}
            </p>
          </div>
        </div>

        {plan.savings_percent ? (
          <div className="mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-extrabold text-emerald-700">
            وفر {Number(plan.savings_percent).toFixed(0)}%
          </div>
        ) : null}

        <div
          className={`my-6 border-t ${
            plan.is_featured
              ? "border-white/10"
              : "border-[#e7eff2]"
          }`}
        />

        <div className="space-y-3">
          <BenefitRow
            dark={plan.is_featured}
            text={`${plan.benefits.annual_inspections} فحوص سنويًا`}
          />

          {plan.benefits.smart_alerts ? (
            <BenefitRow
              dark={plan.is_featured}
              text="تنبيهات ذكية"
            />
          ) : null}

          {plan.benefits.priority_service ? (
            <BenefitRow
              dark={plan.is_featured}
              text="أولوية في الخدمة"
            />
          ) : null}

          {plan.benefits.discount_percent > 0 ? (
            <BenefitRow
              dark={plan.is_featured}
              text={`خصم ${plan.benefits.discount_percent}%`}
            />
          ) : null}

          {plan.benefits.included_filter_changes > 0 ? (
            <BenefitRow
              dark={plan.is_featured}
              text={`${plan.benefits.included_filter_changes} تغييرات فلاتر مشمولة`}
            />
          ) : null}
        </div>
      </div>

      <motion.button
        whileTap={{
          scale: 0.985,
        }}
        type="button"
        onClick={onSelect}
        className={`relative z-10 mt-auto flex h-[54px] w-full items-center justify-center gap-2 rounded-[17px] text-sm font-extrabold transition ${
          plan.is_featured
            ? "bg-white text-[#0d2b4e]"
            : "bg-[#0d2b4e] text-white"
        }`}
      >
        اختيار الباقة
        <ChevronLeft className="h-4 w-4" />
      </motion.button>
    </motion.article>
  );
}

function BenefitRow({
  dark,
  text,
}: {
  dark: boolean;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          dark
            ? "bg-[#16a6c9]/20 text-[#65dcf3]"
            : "bg-[#e8f8fb] text-[#16a6c9]"
        }`}
      >
        <Check className="h-3.5 w-3.5" />
      </span>

      <span
        className={`text-xs font-bold ${
          dark ? "text-white/70" : "text-[#718693]"
        }`}
      >
        {text}
      </span>
    </div>
  );
}

function TrustItem({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#eaf8fb] text-[#16a6c9]">
        {icon}
      </div>

      <div>
        <h3 className="text-sm font-extrabold text-[#0d2b4e]">
          {title}
        </h3>

        <p className="mt-1 text-xs font-bold leading-6 text-[#8497a4]">
          {text}
        </p>
      </div>
    </div>
  );
}

function CurrentSubscriptionCard({
  subscription,
  onCancel,
  cancelling,
}: {
  subscription: Subscription;
  onCancel: (id: number) => void;
  cancelling: boolean;
}) {
  const status = subscription.status;

  return (
    <div className="rounded-[24px] border border-[#dfebef] bg-white p-5 shadow-[0_12px_38px_rgba(13,43,78,.045)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span
            className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-extrabold ${
              status === "active"
                ? "bg-emerald-50 text-emerald-700"
                : status === "pending"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-slate-100 text-slate-600"
            }`}
          >
            {status === "active"
              ? "نشط"
              : status === "pending"
                ? "بانتظار الدفع"
                : "ملغي"}
          </span>

          <h3 className="mt-3 text-base font-extrabold text-[#0d2b4e]">
            {subscription.plan_name_ar}
          </h3>

          <p className="mt-1 text-xs font-bold text-[#8497a4]">
            {subscription.address?.label || "الموقع"} ·{" "}
            {subscription.coolers_count} برادة
          </p>
        </div>

        <div className="text-left">
          <p className="text-lg font-extrabold text-[#0d2b4e]">
            {Number(subscription.price).toFixed(0)}
          </p>

          <p className="text-[9px] font-bold text-[#16a6c9]">
            ر.س
          </p>
        </div>
      </div>
      {status === "pending" ? (
        <button type="button" disabled={cancelling} onClick={() => onCancel(subscription.id)}
          className="mt-4 rounded-xl border border-amber-200 px-4 py-2 text-xs font-bold text-amber-800 disabled:opacity-50">
          {cancelling ? "جاري التحقق من ميسر..." : "إلغاء الاشتراك غير المدفوع"}
        </button>
      ) : null}
    </div>
  );
}

function PlanSelectionModal({
  plan,
  addresses,
  coolers,
  onClose,
}: {
  plan: SubscriptionPlan;
  addresses: Address[];
  coolers: Cooler[];
  onClose: () => void;
}) {
  const [addressId, setAddressId] =
    useState<number | null>(null);

  const [selectedCoolers, setSelectedCoolers] = useState<number[]>(
    []
  );

  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const availableCoolers = useMemo(() => {
    if (!addressId) {
      return [];
    }

    return coolers.filter(
      (cooler) =>
        cooler.is_active &&
        cooler.approval_status === "approved" &&
        cooler.address_id === addressId
    );
  }, [addressId, coolers]);

  function chooseAddress(id: number) {
    setAddressId(id);
    setSelectedCoolers([]);
    setError("");
  }

  function toggleCooler(id: number) {
    setSelectedCoolers((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function saveSelection() {
    if (!addressId) {
      setError("اختر الموقع أولًا");
      return;
    }

    if (selectedCoolers.length === 0) {
      setError("اختر برادة واحدة على الأقل");
      return;
    }

    const selection: SavedSelection = {
      plan_code: plan.code,
      address_id: addressId,
      cooler_ids: selectedCoolers,
    };

    sessionStorage.setItem(
      "numayr_subscription_checkout",
      JSON.stringify(selection)
    );

    setSaved(true);
    setError("");
    router.push("/subscriptions/checkout");
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
        className="fixed inset-0 z-[80] bg-[#061a2f]/50 backdrop-blur-[4px]"
      />

      <motion.div
        initial={{
          opacity: 0,
          scale: 0.96,
          y: 25,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.97,
        }}
        className="fixed inset-x-3 top-1/2 z-[90] mx-auto max-h-[90vh] max-w-[650px] -translate-y-1/2 overflow-y-auto rounded-[30px] bg-[#f8fbfc] shadow-[0_35px_100px_rgba(4,20,39,.30)]"
      >
        <div className="sticky top-0 z-20 overflow-hidden bg-[#0d2b4e] px-5 py-5 sm:px-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(22,166,201,.25),transparent_40%)]" />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[10px] font-extrabold text-[#68dcf3]">
                تجهيز الاشتراك
              </p>

              <h2 className="mt-1 text-lg font-extrabold text-white">
                {plan.name_ar}
              </h2>

              <p className="mt-1 text-xs font-bold text-white/45">
                {Number(plan.price).toFixed(0)} ر.س /{" "}
                {plan.billing_cycle === "monthly"
                  ? "شهر"
                  : "سنة"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-white/10 text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {saved ? (
          <div className="p-6 text-center sm:p-8">
            <motion.div
              initial={{
                scale: 0,
              }}
              animate={{
                scale: 1,
              }}
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#e5f8f0]"
            >
              <Check className="h-9 w-9 text-[#27ae60]" />
            </motion.div>

            <h3 className="mt-5 text-xl font-extrabold text-[#0d2b4e]">
              تم تجهيز اختيارك
            </h3>

            <p className="mx-auto mt-3 max-w-md text-sm font-bold leading-7 text-[#7f929f]">
              حفظنا الباقة والموقع والبرادات المختارة.
              لن يتفعل الاشتراك إلا بعد إتمام الدفع والتحقق منه.
            </p>

            <div className="mt-5 rounded-[18px] border border-[#dcebef] bg-[#f1f9fb] p-4">
              <p className="text-xs font-extrabold text-[#0d2b4e]">
                لم يتم خصم أي مبلغ ولم يتم إنشاء محاولة دفع.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 h-[50px] w-full rounded-[16px] bg-[#0d2b4e] text-xs font-extrabold text-white"
            >
              تم
            </button>
          </div>
        ) : (
          <div className="p-5 sm:p-7">
            <section>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#e7f7fa] text-[#16a6c9]">
                  <MapPin className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-[#0d2b4e]">
                    اختر الموقع
                  </h3>

                  <p className="mt-1 text-[10px] font-bold text-[#8799a6]">
                    كل البرادات في الاشتراك يجب أن تكون في نفس الموقع
                  </p>
                </div>
              </div>

              {addresses.length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-[#cfdee4] bg-white p-5 text-center">
                  <p className="text-sm font-extrabold text-[#0d2b4e]">
                    لا يوجد عنوان محفوظ
                  </p>

                  <p className="mt-2 text-xs font-bold text-[#8799a6]">
                    أضف عنوانًا من حسابك أولًا.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {addresses.map((address) => {
                    const active =
                      addressId === address.id;

                    return (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() =>
                          chooseAddress(address.id)
                        }
                        className={`flex w-full items-center gap-3 rounded-[17px] border p-4 text-right transition ${
                          active
                            ? "border-[#16a6c9] bg-[#eaf9fc]"
                            : "border-[#dfeaed] bg-white"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] ${
                            active
                              ? "bg-[#16a6c9] text-white"
                              : "bg-[#f1f7f9] text-[#879aa7]"
                          }`}
                        >
                          <MapPin className="h-4 w-4" />
                        </span>

                        <span className="flex-1">
                          <span className="text-xs font-extrabold text-[#0d2b4e]">
                            {address.label}
                          </span>

                          <span className="mt-1 block text-[10px] font-bold text-[#8799a6]">
                            {address.city}، {address.district}،{" "}
                            {address.street}
                          </span>
                        </span>

                        {active ? (
                          <Check className="h-4 w-4 text-[#16a6c9]" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="mt-7">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#e7f7fa] text-[#16a6c9]">
                  <Snowflake className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-[#0d2b4e]">
                    اختر البرادات
                  </h3>

                  <p className="mt-1 text-[10px] font-bold text-[#8799a6]">
                    اختر برادة واحدة أو أكثر في الموقع المحدد
                  </p>
                </div>
              </div>

              {!addressId ? (
                <div className="rounded-[18px] bg-white p-5 text-center text-xs font-bold text-[#8a9da9]">
                  اختر الموقع أولًا لعرض البرادات.
                </div>
              ) : availableCoolers.length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-[#cfdee4] bg-white p-5 text-center">
                  <Snowflake className="mx-auto h-6 w-6 text-[#9badb8]" />

                  <p className="mt-3 text-xs font-extrabold text-[#0d2b4e]">
                    لا توجد برادات مرتبطة بهذا الموقع
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {availableCoolers.map((cooler) => {
                    const active =
                      selectedCoolers.includes(
                        cooler.id
                      );

                    return (
                      <button
                        key={cooler.id}
                        type="button"
                        onClick={() =>
                          toggleCooler(cooler.id)
                        }
                        className={`relative flex min-h-[100px] items-center gap-3 rounded-[18px] border p-4 text-right transition ${
                          active
                            ? "border-[#16a6c9] bg-[#eaf9fc]"
                            : "border-[#dfeaed] bg-white"
                        }`}
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[15px] bg-[#edf8fa]">
                          {cooler.photo ? (
                            <img
                              src={cooler.photo}
                              alt={cooler.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Snowflake className="h-5 w-5 text-[#16a6c9]" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-extrabold text-[#0d2b4e]">
                            {cooler.name}
                          </p>

                          <p className="mt-1 truncate text-[10px] font-bold text-[#899ba7]">
                            {cooler.landmark ||
                              "بدون معلم محدد"}
                          </p>
                        </div>

                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                            active
                              ? "bg-[#16a6c9] text-white"
                              : "border border-[#d4e2e6]"
                          }`}
                        >
                          {active ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {error ? (
              <div className="mt-5 rounded-[15px] border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
                {error}
              </div>
            ) : null}

            <div className="mt-7 rounded-[18px] border border-[#d8eaf0] bg-[#edf9fb] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#16a6c9]" />

                <div>
                  <p className="text-xs font-extrabold text-[#0d2b4e]">
                    إتمام الاشتراك عبر بوابة الدفع
                  </p>

                  <p className="mt-1 text-[10px] font-bold leading-5 text-[#8195a2]">
                    بعد تأكيد اختيارك ستنتقل إلى نموذج الدفع الآمن. لن يتفعّل الاشتراك قبل تأكيد الدفع لدى ميسر.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={saveSelection}
              className="mt-5 flex h-[54px] w-full items-center justify-center gap-2 rounded-[16px] bg-[#0d2b4e] text-xs font-extrabold text-white"
            >
              المتابعة إلى الدفع الآمن
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}