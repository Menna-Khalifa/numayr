import { LucideIcon } from "lucide-react";

export default function AdminEmpty({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="grid min-h-[300px] place-items-center px-6 py-10 text-center">
      <div>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#edf8fa] text-[#16a6c9]">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-extrabold text-[#0d2b4e]">{title}</h3>
        <p className="mt-2 max-w-md text-xs font-bold leading-6 text-[#8da0ab]">
          {description}
        </p>
      </div>
    </div>
  );
}
