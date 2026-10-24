"use client";

import AppShell from "@/components/app/AppShell";
import { apiRequest } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type SubscriptionSelection = { plan_code: string; address_id: number; cooler_ids: number[] };
type CheckoutResponse = {
  data: {
    subscription: { id: number };
    payment: { amount: string; currency: string };
    checkout: null | {
      intent_id: string;
      client_secret: string;
      publishable_key: string;
      callback_url: string;
    };
  };
};
type MoyasarWidget = { init: (settings: Record<string, unknown>) => void };
declare global { interface Window { Moyasar?: MoyasarWidget } }

const SCRIPT = "https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.3.0/dist/moyasar.umd.min.js";
const STYLE = "https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.3.0/dist/moyasar.css";

export default function SubscriptionCheckoutPage() {
  const router = useRouter();
  const active = useRef(false);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getAuthToken()) { router.replace("/login"); return; }
    if (!document.querySelector('link[data-moyasar-style]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = STYLE;
      link.dataset.moyasarStyle = "true";
      document.head.appendChild(link);
    }
    if (window.Moyasar) { queueMicrotask(() => setReady(true)); return; }
    let alive = true;
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => { if (alive) setReady(true); };
    script.onerror = () => { if (alive) setError("تعذر تحميل نموذج الدفع الآمن"); };
    document.body.appendChild(script);
    return () => { alive = false; };
  }, [router]);

  async function start() {
    if (active.current || loading || !window.Moyasar) return;
    const token = getAuthToken();
    if (!token) { router.replace("/login"); return; }
    const raw = sessionStorage.getItem("numayr_subscription_checkout");
    if (!raw) { setError("اختر الباقة والموقع والبرادات أولًا."); return; }

    let selection: SubscriptionSelection;
    try {
      selection = JSON.parse(raw) as SubscriptionSelection;
      if (!selection.plan_code || !selection.address_id || !selection.cooler_ids?.length)
        throw new Error();
    } catch {
      setError("اختيار الاشتراك غير صالح. ارجع واختر الباقة مجددًا.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await apiRequest<CheckoutResponse>("/subscriptions", {
        method: "POST",
        token,
        body: JSON.stringify({ ...selection, method: "card" }),
      });
      const checkout = response.data.checkout;
      const payment = response.data.payment;
      const amount = Math.round(Number(payment.amount) * 100);
      if (!checkout?.client_secret || !checkout.intent_id || !checkout.publishable_key ||
          !Number.isSafeInteger(amount) || amount < 100 || payment.currency !== "SAR") {
        throw new Error("تعذر تجهيز الدفع. راجع حالة الاشتراك قبل إعادة المحاولة.");
      }
      sessionStorage.setItem("numayr-moyasar-return-subscription", String(response.data.subscription.id));
      active.current = true;
      setStarted(true);
      window.Moyasar.init({
        element: "#numayr-subscription-moyasar",
        amount,
        currency: "SAR",
        description: `NUMAYR Subscription ${response.data.subscription.id}`,
        publishable_api_key: checkout.publishable_key,
        callback_url: checkout.callback_url,
        language: "ar",
        methods: ["creditcard"],
        use_payment_intent: true,
        payment_intent: { id: checkout.intent_id, client_secret: checkout.client_secret },
      });
    } catch (e) {
      active.current = false;
      setStarted(false);
      setError(e instanceof Error ? e.message : "تعذر بدء دفع الاشتراك");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-extrabold text-slate-900">دفع الاشتراك عبر ميسر</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">لن يتفعّل اشتراكك إلا بعد أن يتحقق نظام نمير من نجاح الدفع لدى ميسر.</p>
        {!started && <button type="button" onClick={() => void start()} disabled={!ready || loading}
          className="mt-6 rounded-xl bg-sky-700 px-5 py-3 font-bold text-white disabled:opacity-50">
          {loading ? "جاري تجهيز الدفع..." : "المتابعة إلى نموذج الدفع"}
        </button>}
        {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
        <div id="numayr-subscription-moyasar" dir="ltr" className="mt-5" />
        <Link href="/subscriptions" className="mt-6 block text-sm text-sky-800">العودة إلى الاشتراكات</Link>
      </main>
    </AppShell>
  );
}
