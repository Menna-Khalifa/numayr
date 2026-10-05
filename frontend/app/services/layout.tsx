import { Suspense } from "react";

export default function ServicesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<ServicesLoading />}>
      {children}
    </Suspense>
  );
}

function ServicesLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f9fb]">
      <div className="flex flex-col items-center">
        <span className="h-11 w-11 animate-spin rounded-full border-[3px] border-[#d4e8ed] border-t-[#16a6c9]" />

        <p className="mt-4 text-sm font-extrabold text-[#718197]">
          جاري تجهيز الخدمة...
        </p>
      </div>
    </div>
  );
}