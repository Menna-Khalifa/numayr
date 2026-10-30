import Link from "next/link";

type ServiceLoadErrorProps = {
  serviceName: string;
  message?: string;
};

export default function ServiceLoadError({
  serviceName,
  message,
}: ServiceLoadErrorProps) {
  return (
    <div role="alert" className="mx-auto max-w-[800px]">
      <div className="rounded-[28px] border border-[#e0ecef] bg-white p-8 text-center shadow-sm">
        <h2 className="font-extrabold text-[#0d2b4e]">
          تعذر فتح خدمة {serviceName}
        </h2>
        <p className="mt-3 text-sm font-bold text-[#708697]">
          {message || "تعذر تحميل بيانات الخدمة أو البرادة. حاول مرة أخرى لاحقًا."}
        </p>
        <Link
          href="/coolers"
          className="mt-5 inline-flex rounded-xl bg-[#0d2b4e] px-5 py-3 text-xs font-extrabold text-white transition hover:bg-[#16436d]"
        >
          العودة إلى براداتي
        </Link>
      </div>
    </div>
  );
}
