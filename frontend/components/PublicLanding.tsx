"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowUpLeft, CheckCircle2, ChevronDown, Droplets, Filter, Menu, ShieldCheck, Sparkles, Wrench, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const logo = "https://res.cloudinary.com/deayevwds/image/upload/v1791205176/Numayr_Arch_and_Droplet_Logo_dt4yg5.png";

const services = [
  {
    title: "تعبئة مياه التحلية",
    subtitle: "خدمة تعبئة البرادات",
    description: "اطلب تعبئة مياه التحلية للبرادة وحدد الكمية التي تحتاجها باللتر من داخل حسابك.",
    icon: Droplets,
    number: "01",
    detail: "تحدد الكمية المطلوبة وتتابع حالة الطلب من حسابك.",
    pricing: "تُحسب حسب الكمية المختارة",
    accent: "from-[#0e789f] to-[#43cde3]",
  },
  {
    title: "صيانة البرادة",
    subtitle: "فحص وصيانة الأعطال",
    description: "قدّم طلب فحص أو صيانة لبرادتك مع وصف المشكلة وإرفاق الصور عند الحاجة.",
    icon: Wrench,
    number: "02",
    detail: "يُراجع طلب الصيانة ويُحدد السعر للموافقة عليه قبل الدفع.",
    pricing: "السعر يُحدد بعد مراجعة الطلب",
    accent: "from-[#134b7d] to-[#299ac4]",
  },
  {
    title: "تغيير الفلاتر",
    subtitle: "عناية بنظام التنقية",
    description: "خدمات تبديل وفحص وتنظيف فلاتر البرادة، بما فيها خيارات التعقيم والفحص.",
    icon: Filter,
    number: "03",
    detail: "اختر نوع الخدمة المناسب من الخيارات المتاحة داخل المنصة.",
    pricing: "تُعرض أسعار الخيارات قبل تأكيد الطلب",
    accent: "from-[#086d82] to-[#32b7bc]",
  },
];

const steps = [
  { title: "أنشئ حسابك", body: "سجّل دخولك أو أنشئ حسابًا للوصول إلى خدمات برادتك." },
  { title: "اختر الخدمة", body: "اختر نوع الخدمة وحدد تفاصيل الطلب والكمية عند الحاجة." },
  { title: "راجع الطلب", body: "تابع حالة الطلب وراجع السعر المعتمد قبل الدفع." },
];

const transition = { duration: 0.68, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.14 }}
      transition={{ ...transition, delay }}
    >
      {children}
    </motion.div>
  );
}

function ServiceGrid() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {services.map((service, index) => {
        const Icon = service.icon;
        return (
          <Reveal key={service.number} delay={index * 0.08} className="h-full">
            <article className="group relative flex h-full flex-col overflow-hidden rounded-[30px] border border-[#dcecf1] bg-white p-6 shadow-[0_18px_65px_rgba(10,52,82,.055)] transition-all duration-300 hover:-translate-y-2 hover:border-[#8fd9e7] hover:shadow-[0_28px_72px_rgba(10,52,82,.13)] sm:p-8">
              <div className={"absolute inset-x-0 top-0 h-1.5 bg-gradient-to-l " + service.accent} />
              <div className="mb-9 flex items-start justify-between">
                <div className={"flex h-[72px] w-[72px] items-center justify-center rounded-[24px] bg-gradient-to-br text-white shadow-[0_14px_28px_rgba(22,166,201,.2)] transition-transform duration-300 group-hover:rotate-[-7deg] group-hover:scale-110 " + service.accent}>
                  <Icon size={31} strokeWidth={1.7} aria-hidden="true" />
                </div>
                <span className="text-3xl font-extrabold text-[#d9e9ed]">{service.number}</span>
              </div>
              <p className="mb-2 text-xs font-bold text-[#118eae]">{service.subtitle}</p>
              <h3 className="text-[22px] font-extrabold text-[#0d2b4e]">{service.title}</h3>
              <p className="mt-4 flex-1 text-sm leading-8 text-[#647d8c]">{service.description}</p>
              <div className="mt-6 rounded-2xl bg-[#f0f8fa] px-4 py-4 text-xs leading-7 text-[#496679]">
                <CheckCircle2 className="ml-2 inline h-4 w-4 text-[#16a6c9]" aria-hidden="true" />
                {service.pricing}
              </div>
              <p className="mt-4 text-xs leading-7 text-[#68818d]">{service.detail}</p>
              <Link href="/role" className="mt-7 inline-flex min-h-11 items-center gap-2 self-start text-sm font-extrabold text-[#0d718f] transition-colors hover:text-[#0d2b4e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#16a6c9]">
                اطلب الخدمة من حسابك <ArrowLeft size={17} aria-hidden="true" />
              </Link>
            </article>
          </Reveal>
        );
      })}
    </div>
  );
}

export default function PublicLanding({ servicesPage = false }: { servicesPage?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const reduced = useReducedMotion();

  return (
    <div dir="rtl" className="min-h-screen overflow-x-hidden bg-[#f0f8fa] text-[#0d2b4e]">
      <header className="relative z-30 border-b border-white/10 bg-[#081f36] text-white">
        <nav aria-label="التنقل الرئيسي" className="mx-auto flex h-[84px] w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" aria-label="نمير الصفحة الرئيسية" className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95">
              <Image src={logo} alt="" width={45} height={45} className="h-10 w-10 object-contain" />
            </span>
            <span className="text-xl font-extrabold tracking-tight">نمير <span className="text-[#67d8ec]">NUMAYR</span></span>
          </Link>
          <div className="hidden items-center gap-8 text-sm font-bold text-[#cfebf3] md:flex">
            <Link className="transition-colors hover:text-white" href="/">الرئيسية</Link>
            <Link className="transition-colors hover:text-white" href="/services">استعراض الخدمات</Link>
            <Link className="transition-colors hover:text-white" href="/#how-it-works">كيف تعمل نمير</Link>
          </div>
          <Link href="/role" className="hidden min-h-11 items-center gap-2 rounded-full bg-[#48c9e2] px-6 text-sm font-extrabold text-[#07263c] transition-all hover:-translate-y-0.5 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 md:inline-flex">
            تسجيل الدخول <ArrowUpLeft size={16} aria-hidden="true" />
          </Link>
          <button type="button" aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"} aria-expanded={menuOpen} aria-controls="public-mobile-navigation" onClick={() => setMenuOpen(!menuOpen)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 md:hidden">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>
        {menuOpen && (
          <div id="public-mobile-navigation" className="border-t border-white/10 bg-[#0b2b49] px-6 py-5 md:hidden">
            <div className="flex flex-col gap-5 text-sm font-bold">
              <Link onClick={() => setMenuOpen(false)} href="/">الرئيسية</Link>
              <Link onClick={() => setMenuOpen(false)} href="/services">استعراض الخدمات</Link>
              <Link onClick={() => setMenuOpen(false)} href="/#how-it-works">كيف تعمل نمير</Link>
              <Link onClick={() => setMenuOpen(false)} className="text-[#69ddef]" href="/role">تسجيل الدخول</Link>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="relative isolate overflow-hidden bg-[#081f36] text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(22,166,201,.23),transparent_35%),radial-gradient(circle_at_12%_75%,rgba(56,166,194,.15),transparent_38%)]" />
          <motion.div aria-hidden="true" className="pointer-events-none absolute -left-24 top-10 h-[360px] w-[360px] rounded-full border border-[#6ae4f4]/10 sm:h-[560px] sm:w-[560px]" animate={reduced ? undefined : { rotate: 360 }} transition={{ duration: 80, repeat: Infinity, ease: "linear" }} />
          <motion.div aria-hidden="true" className="pointer-events-none absolute -left-8 top-28 h-[260px] w-[260px] rounded-full border border-[#6ae4f4]/15 sm:h-[430px] sm:w-[430px]" animate={reduced ? undefined : { rotate: -360 }} transition={{ duration: 65, repeat: Infinity, ease: "linear" }} />
          <div className="relative mx-auto grid min-h-[570px] max-w-7xl items-center gap-8 px-5 py-20 sm:px-8 lg:grid-cols-[1.12fr_.88fr] lg:py-28">
            <div className="relative z-10">
              <Reveal><span className="inline-flex items-center gap-2 rounded-full border border-[#69ddef]/25 bg-white/5 px-4 py-2 text-xs font-bold text-[#82e4f0]"><Sparkles size={16} aria-hidden="true" /> منصة نمير لخدمات البرادات والمياه</span></Reveal>
              <Reveal delay={0.1}>
                <h1 className="mt-7 max-w-3xl text-4xl font-extrabold leading-[1.45] tracking-tight sm:text-5xl lg:text-[60px]">
                  {servicesPage ? "الخدمات التي تحتاجها" : "عناية تستحقها"} <span className="block text-[#67d8ec]">{servicesPage ? "لبرادتك في مكان واحد" : "برادتك"}</span>
                </h1>
              </Reveal>
              <Reveal delay={0.2}><p className="mt-6 max-w-xl text-base leading-9 text-[#c5e2e9] sm:text-lg">{servicesPage ? "استكشف خدمات تعبئة المياه والصيانة وتغيير الفلاتر، واطلع على طريقة طلب كل خدمة قبل تسجيل الدخول." : "من طلب تعبئة المياه إلى خدمات الصيانة وتغيير الفلاتر، تساعدك نمير على إدارة احتياجات برادتك ومتابعة الطلبات من مكان واحد."}</p></Reveal>
              <Reveal delay={0.3}>
                <div className="mt-9 flex flex-wrap gap-3">
                  <Link href={servicesPage ? "#service-list" : "/services"} className="inline-flex min-h-13 items-center gap-3 rounded-full bg-[#54d2e8] px-7 py-4 text-sm font-extrabold text-[#092840] shadow-[0_12px_30px_rgba(40,191,216,.2)] transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4">{servicesPage ? "تصفح الخدمات" : "استعرض الخدمات"} <ArrowLeft size={18} aria-hidden="true" /></Link>
                  <Link href="/role" className="inline-flex min-h-13 items-center gap-2 rounded-full border border-white/30 px-7 py-4 text-sm font-extrabold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4">الدخول إلى المنصة</Link>
                </div>
              </Reveal>
            </div>
            <Reveal delay={0.2} className="mx-auto w-full max-w-[430px]">
              <motion.div animate={reduced ? undefined : { y: [0, -13, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="relative mx-auto flex aspect-square w-full items-center justify-center rounded-[42px] border border-white/10 bg-[radial-gradient(circle_at_50%_45%,rgba(65,214,236,.24),rgba(14,66,103,.55)_55%,rgba(9,35,58,.25)_75%)] shadow-[0_35px_110px_rgba(0,0,0,.18)]">
                <div className="absolute inset-[13%] rounded-full border border-[#88edfa]/20" />
                <div className="absolute inset-[24%] rounded-full border border-[#88edfa]/15" />
                <Image src={logo} alt="شعار نمير" width={300} height={300} priority className="relative z-10 h-auto w-[60%] object-contain drop-shadow-[0_18px_35px_rgba(0,0,0,.2)]" />
                <span className="absolute bottom-[10%] rounded-full border border-white/15 bg-[#0c3554]/80 px-4 py-2 text-xs font-bold text-[#c9f2f8]">خدمات موثوقة · متابعة سهلة</span>
              </motion.div>
            </Reveal>
          </div>
          <Link href={servicesPage ? "#service-list" : "#home-services"} aria-label="الانتقال إلى الخدمات" className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[#9bdbe6] transition-transform hover:translate-y-1"><ChevronDown size={25} aria-hidden="true" /></Link>
        </section>

        <section id={servicesPage ? "service-list" : "home-services"} className="scroll-mt-8 px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <Reveal className="mb-11">
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-extrabold text-[#1088a7]"><span className="h-2 w-2 rounded-full bg-[#16a6c9]" /> خدمات نمير</div>
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div><h2 className="text-3xl font-extrabold sm:text-4xl">خدمات واضحة لاحتياجاتك</h2><p className="mt-4 max-w-2xl text-sm leading-8 text-[#667e8e]">تعرف على الخدمات المتاحة وكيفية احتساب الأسعار قبل البدء في طلبك</p></div>
                {!servicesPage && <Link href="/services" className="inline-flex items-center gap-2 text-sm font-extrabold text-[#0b819f] hover:text-[#0d2b4e]">عرض جميع الخدمات <ArrowLeft size={17} aria-hidden="true" /></Link>}
              </div>
            </Reveal>
            <ServiceGrid />
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-5 bg-white px-5 py-20 sm:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <Reveal><div className="text-xs font-extrabold text-[#0e9cbb]">تجربة منظمة وبسيطة</div><h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">كيف تعمل نمير؟</h2><p className="mt-4 text-sm leading-8 text-[#698090]">تعرّف على الخطوات الأساسية قبل الدخول إلى حسابك</p></Reveal>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {steps.map((step, index) => (
                <Reveal key={step.title} delay={index * .1}>
                  <div className="relative h-full rounded-[28px] border border-[#e0edf1] bg-[#f6fbfc] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#a6dce8]">
                    <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#def5fa] text-xl font-extrabold text-[#128cac]">{index + 1}</div>
                    <h3 className="text-xl font-extrabold">{step.title}</h3>
                    <p className="mt-3 text-sm leading-8 text-[#718695]">{step.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8">
          <Reveal className="mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded-[35px] bg-[#0d2b4e] px-7 py-12 text-white sm:px-12 lg:flex lg:items-center lg:justify-between lg:gap-10">
              <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#16a6c9]/20 blur-[70px]" />
              <div className="relative"><ShieldCheck size={29} className="mb-4 text-[#73dbed]" aria-hidden="true" /><h2 className="text-2xl font-extrabold sm:text-3xl">جاهز تبدأ مع نمير؟</h2><p className="mt-3 max-w-xl text-sm leading-8 text-[#c5dfe8]">الدخول للحساب مطلوب لطلب الخدمات ومتابعة تفاصيل الطلبات، بينما يمكنك استعراض الخدمات هنا بدون تسجيل.</p></div>
              <Link href="/role" className="relative mt-7 inline-flex min-h-13 shrink-0 items-center gap-3 rounded-full bg-[#55d0e7] px-7 py-4 text-sm font-extrabold text-[#092840] transition-transform hover:-translate-y-1 lg:mt-0">الدخول إلى نمير <ArrowLeft size={18} aria-hidden="true" /></Link>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-[#d7e7ed] bg-[#e8f4f7] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center text-xs font-bold text-[#657d8b] sm:flex-row sm:text-right">
          <span>© {new Date().getFullYear()} نمير — جميع الحقوق محفوظة</span>
          <div className="flex items-center gap-5"><Link href="/services" className="hover:text-[#0b819f]">الخدمات</Link><Link href="/role" className="hover:text-[#0b819f]">تسجيل الدخول</Link></div>
        </div>
      </footer>
    </div>
  );
}
