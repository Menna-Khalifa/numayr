"use client";

import AppShell from "@/components/app/AppShell";
import { apiRequest } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type ConfirmResult = { data: { status: string; order_id: number } };

function PaymentReturnContent() {
  const params = useSearchParams();
  const reference = params.get("id");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [state, setState] = useState<"verifying" | "paid" | "pending" | "error">("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const order = sessionStorage.getItem("numayr-moyasar-return-order") ?? params.get("order");
    const token = getAuthToken();
    queueMicrotask(() => setOrderId(order));
    if (!order || !reference || !token) {
      queueMicrotask(() => {
        setState("error");
        setMessage("تعذر تحديد الطلب. سجل الدخول وافتح تفاصيل طلبك لمراجعة الدفع.");
      });
      return;
    }
    let active = true;
    void apiRequest<ConfirmResult>(`/orders/${order}/payments/confirm`, {
      method: "POST",
      token,
      body: JSON.stringify({ provider_payment_id: reference }),
    })
      .then((response) => {
        if (!active) return;
        setState(response.data.status === "paid" ? "paid" : "pending");
        if (response.data.status === "paid") {
          sessionStorage.removeItem("numayr-moyasar-return-order");
        }
      })
      .catch(() => {
        if (!active) return;
        setState("error");
        setMessage("تعذر تأكيد الدفع حاليًا. لا تدفع مرة أخرى قبل مراجعة حالة الطلب.");
      });
    return () => { active = false; };
  }, [reference]);

  const title = state === "paid" ? "تم تأكيد الدفع" :
    state === "verifying" ? "جاري التحقق من الدفع لدى ميسر" :
    state === "pending" ? "الدفع لم يتأكد بعد" : "تعذر التحقق من نتيجة الدفع";
  const description = state === "paid" ?
    "تم التحقق من العملية لدى ميسر وتحديث حالة الطلب." :
    state === "verifying" ?
    "يرجى عدم إجراء عملية دفع أخرى أثناء التحقق." :
    message || "راجع تفاصيل الطلب. لا تعتمد على نتيجة الرابط وحدها.";

  return (
    <AppShell>
      <main className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
        <p className="mt-4 leading-8 text-slate-700">{description}</p>
        <Link
          href={orderId ? `/orders/${orderId}` : "/orders"}
          className="mt-6 inline-block rounded-xl bg-sky-700 px-5 py-3 font-bold text-white"
        >عرض تفاصيل الطلب</Link>
      </main>
    </AppShell>
  );
}

export default function PaymentCallbackPage() {
  return <Suspense fallback={<p>جاري التحقق من الدفع...</p>}><PaymentReturnContent /></Suspense>;
}
