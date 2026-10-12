import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export default function AdminPageHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(125deg,#0d2b4e_0%,#123e68_58%,#0d607a_100%)] p-6 shadow-[0_24px_70px_rgba(13,43,78,.12)] sm:p-8">
      <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-[#16a6c9]/20 blur-[70px]" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-extrabold text-[#72e0f5]">
            <Icon className="h-3.5 w-3.5" />
            {eyebrow}
          </span>
          <h1 className="mt-4 text-[27px] font-extrabold leading-[1.45] text-white sm:text-[32px]">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] font-bold leading-7 text-white/70 sm:text-sm">
            {description}
          </p>
        </div>
        {action ? <div className="self-start sm:self-auto">{action}</div> : null}
      </div>
    </section>
  );
}
