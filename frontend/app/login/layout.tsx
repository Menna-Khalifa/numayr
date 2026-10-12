import { Suspense } from "react";

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<LoginLoading />}>
      {children}
    </Suspense>
  );
}

function LoginLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#edf7fa]">
      <div className="flex flex-col items-center">
        <span className="h-11 w-11 animate-spin rounded-full border-[3px] border-[#d4e8ed] border-t-[#16a6c9]" />
        <p className="mt-4 text-sm font-extrabold text-[#718197]">
          جاري تجهيز بوابة الدخول...
        </p>
      </div>
    </main>
  );
}
