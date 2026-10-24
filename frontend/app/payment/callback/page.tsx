"use client";

import AppShell from "@/components/app/AppShell";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PaymentReturnContent() {
  const params = useSearchParams();
  const reference = params.get("id");
  return (
    <AppShell>
      <main className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-extrabold text-slate-900">العودة من بوابة الدفع</h1>
        <p className="mt-4 leading-8 text-slate-700">
          رجوعك من ميسر لا يعني أن الدفع نجح. يتم اعتماد العملية بعد التحقق من حالة الدفع لدى ميسر.
          راجع حالة الطلب من صفحة طلباتك.
        </p>
        {reference && <p className="mt-4 text-xs text-slate-500">تم استلام مرجع الدفع للمتابعة.</p>}
        <Link href="/orders" className="mt-6 inline-block rounded-xl bg-sky-700 px-5 py-3 font-bold text-white">عرض طلباتي</Link>
      </main>
    </AppShell>
  );
}

export default function PaymentCallbackPage() {
  return <Suspense fallback={<p>جاري تحميل نتيجة الدفع...</p>}><PaymentReturnContent /></Suspense>;
}
