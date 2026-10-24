"use client";

import AppShell from "@/components/app/AppShell";
import { apiRequest } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type CheckoutResult = {
  data: {
    payment: { id: number; amount: string; currency: string; checkout_url: string | null };
    checkout: null | {
      intent_id: string;
      client_secret: string;
      publishable_key: string;
      callback_url: string;
    };
  };
};

type MoyasarForm = {
  init: (settings: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    Moyasar?: MoyasarForm;
  }
}

const SCRIPT_SRC = "https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.3.0/dist/moyasar.umd.min.js";
const STYLE_SRC = "https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.3.0/dist/moyasar.css";

export default function OrderCheckoutPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const mounted = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!getAuthToken()) router.replace("/login");
    if (!document.querySelector('link[data-moyasar-style]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = STYLE_SRC;
      link.dataset.moyasarStyle = "true";
      document.head.appendChild(link);
    }
    if (window.Moyasar) {
      queueMicrotask(() => setReady(true));
      return;
    }
    let active = true;
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => { if (active) setReady(true); };
    script.onerror = () => { if (active) setError("تعذر تحميل نموذج الدفع الآمن"); };
    document.body.appendChild(script);
    return () => { active = false; };
  }, [router]);

  async function startCheckout() {
    if (busy || mounted.current || !window.Moyasar) return;
    const token = getAuthToken();
    if (!token) { router.replace("/login"); return; }
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest<CheckoutResult>(`/orders/${params.id}/payments`, {
        token,
        method: "POST",
        body: JSON.stringify({ method: "card" }),
      });
      const checkout = result.data.checkout;
      const payment = result.data.payment;
      if (!checkout?.client_secret || !checkout.intent_id || !checkout.publishable_key) {
        throw new Error("توجد محاولة دفع سابقة تحتاج مراجعة حالتها قبل إنشاء محاولة جديدة");
      }
      const amount = Math.round(Number(payment.amount) * 100);
      if (!Number.isSafeInteger(amount) || amount < 100 || payment.currency !== "SAR") {
        throw new Error("مبلغ الدفع غير صالح");
      }
      sessionStorage.setItem("numayr-moyasar-return-order", params.id);
      mounted.current = true;
      setStarted(true);
      window.Moyasar.init({
        element: "#numayr-moyasar-form",
        amount,
        currency: "SAR",
        description: `NUMAYR Order ${params.id}`,
        publishable_api_key: checkout.publishable_key,
        callback_url: checkout.callback_url,
        language: "ar",
        methods: ["creditcard"],
        use_payment_intent: true,
        payment_intent: {
          id: checkout.intent_id,
          client_secret: checkout.client_secret,
        },
      });
    } catch (exception) {
      mounted.current = false;
      setStarted(false);
      setError(exception instanceof Error ? exception.message : "تعذر بدء الدفع");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-slate-900">الدفع الآمن عبر ميسر</h1>
        <p className="mt-3 text-sm text-slate-600">سيتم تأكيد الطلب بعد التحقق من الدفع لدى ميسر، وليس بمجرد الرجوع إلى الموقع.</p>
        {!started && (
          <button type="button" disabled={!ready || busy} onClick={() => void startCheckout()}
            className="mt-6 rounded-xl bg-sky-700 px-5 py-3 font-bold text-white disabled:opacity-50">
            {busy ? "جاري تجهيز الدفع..." : "الانتقال إلى نموذج الدفع"}
          </button>
        )}
        {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
        <div id="numayr-moyasar-form" dir="ltr" className="mt-5" />
        <Link className="mt-6 block text-sm text-sky-800" href={`/orders/${params.id}`}>العودة إلى تفاصيل الطلب</Link>
      </main>
    </AppShell>
  );
}
