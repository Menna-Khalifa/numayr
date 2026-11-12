"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowUpLeft, CheckCircle2, ChevronDown, ChevronUp, Droplets, Filter, Menu, ShieldCheck, Sparkles, Wrench, X, ClipboardCheck, CreditCard, ListChecks, HelpCircle, ArrowDown, Waves, CircleCheck, BadgeCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

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
    accent: "from-[#0e789f] to-[#71b9c5]",
  },
  {
    title: "صيانة البرادة",
    subtitle: "فحص وصيانة الأعطال",
    description: "قدّم طلب فحص أو صيانة لبرادتك مع وصف المشكلة وإرفاق الصور عند الحاجة.",
    icon: Wrench,
    number: "02",
    detail: "يُراجع طلب الصيانة ويُحدد السعر للموافقة عليه قبل الدفع.",
    pricing: "السعر يُحدد بعد مراجعة الطلب",
    accent: "from-[#134b7d] to-[#609eae]",
  },
  {
    title: "تغيير الفلاتر",
    subtitle: "عناية بنظام التنقية",
    description: "خدمات تبديل وفحص وتنظيف فلاتر البرادة، بما فيها خيارات التعقيم والفحص.",
    icon: Filter,
    number: "03",
    detail: "اختر نوع الخدمة المناسب من الخيارات المتاحة داخل المنصة.",
    pricing: "تُعرض أسعار الخيارات قبل تأكيد الطلب",
    accent: "from-[#086d82] to-[#6aabb5]",
  },
];

const steps = [
  { title: "أنشئ حسابك", body: "سجّل دخولك أو أنشئ حسابًا للوصول إلى خدمات برادتك." },
  { title: "اختر الخدمة", body: "اختر نوع الخدمة وحدد تفاصيل الطلب والكمية عند الحاجة." },
  { title: "راجع الطلب", body: "تابع حالة الطلب وراجع السعر المعتمد قبل الدفع." },
];


const highlights = [
  { icon: Droplets, title: "تعبئة مياه التحلية", description: "حدد كمية المياه المناسبة لبرادتك" },
  { icon: Wrench, title: "الصيانة والفحص", description: "وصف العطل وطلب عرض الخدمة" },
  { icon: Filter, title: "خدمات الفلاتر", description: "اختيارات للتغيير والفحص والتنظيف" },
];

const paymentSteps = [
  { icon: ListChecks, title: "تفاصيل الطلب", description: "تبدأ باختيار الخدمة وتحديد البرادة والتفاصيل المطلوبة من داخل حسابك" },
  { icon: ClipboardCheck, title: "مراجعة السعر", description: "تظهر تكلفة الخدمة بحسب نوعها وبيانات الطلب أو بعد مراجعة عرض السعر" },
  { icon: CreditCard, title: "الدفع والمتابعة", description: "عند إتاحة الدفع الإلكتروني يمكنك إتمام الدفع من صفحة الطلب ومتابعة حالته" },
];

const commonQuestions = [
  { q: "هل يمكن تصفح الخدمات بدون حساب؟", a: "نعم يمكن استعراض الخدمات والتعرف على طريقة الطلب من هذه الصفحة بدون تسجيل الدخول. إنشاء الطلب ومتابعته يتطلبان الدخول إلى حسابك." },
  { q: "كيف يتم تحديد سعر الخدمة؟", a: "تعبئة المياه تعتمد على كمية المياه المختارة. أما الصيانة فيتم تحديد سعرها وفق مراجعة الطلب، وخدمات الفلاتر لها خيارات وأسعار تظهر عند اختيار الخدمة داخل الحساب." },
  { q: "هل يتم الدفع قبل اعتماد طلب الصيانة؟", a: "في طلبات الصيانة التي تتطلب عرض سعر، تتم مراجعة تفاصيل الطلب والسعر والموافقة عليه قبل إتاحة الدفع." },
  { q: "كيف يمكنني متابعة طلب سابق؟", a: "بعد تسجيل الدخول إلى حسابك يمكنك الوصول إلى الطلبات ومتابعة الحالة والفواتير المتاحة من لوحة المستخدم." },
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
                <CheckCircle2 className="ml-2 inline h-4 w-4 text-[#358da2]" aria-hidden="true" />
                {service.pricing}
              </div>
              <p className="mt-4 text-xs leading-7 text-[#68818d]">{service.detail}</p>
              <Link href="/role" className="mt-7 inline-flex min-h-11 items-center gap-2 self-start text-sm font-extrabold text-[#0d718f] transition-colors hover:text-[#0d2b4e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#358da2]">
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
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const element = document.documentElement;
    const previous = element.style.scrollBehavior;
    element.style.scrollBehavior = "smooth";
    return () => { element.style.scrollBehavior = previous; };
  }, []);

  return (
    <div id="top" dir="rtl" className="min-h-screen scroll-smooth overflow-x-hidden bg-[#f0f8fa] text-[#0d2b4e]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#081f36]/95 text-white shadow-[0_8px_30px_rgba(4,22,40,.12)] backdrop-blur-xl">
        <nav aria-label="التنقل الرئيسي" className="mx-auto flex h-[84px] w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href={servicesPage ? "/" : "#top"} aria-label="نمير الصفحة الرئيسية" className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/95">
              <Image src={logo} alt="" width={45} height={45} className="h-10 w-10 object-contain" />
            </span>
            <span className="text-xl font-extrabold tracking-tight">نمير <span className="text-[#91cbd5]">NUMAYR</span></span>
          </Link>
          <div className="hidden items-center gap-6 text-sm font-bold text-[#cfebf3] lg:flex">
            <Link className="transition-colors hover:text-white" href={servicesPage ? "/" : "#top"}>الرئيسية</Link>
            <Link className="transition-colors hover:text-white" href={servicesPage ? "#service-list" : "#home-services"}>استعراض الخدمات</Link>
            <Link className="transition-colors hover:text-white" href="#how-it-works">كيف تعمل نمير</Link>
            <Link className="transition-colors hover:text-white" href="#pricing-process">الدفع والتسعير</Link>
          </div>
          <Link href="/role" className="hidden min-h-11 items-center gap-2 rounded-full bg-[#79bfca] px-6 text-sm font-extrabold text-[#07263c] transition-all hover:-translate-y-0.5 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 lg:inline-flex">
            تسجيل الدخول <ArrowUpLeft size={16} aria-hidden="true" />
          </Link>
          <button type="button" aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"} aria-expanded={menuOpen} aria-controls="public-mobile-navigation" onClick={() => setMenuOpen(!menuOpen)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 lg:hidden">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>
        {menuOpen && (
          <div id="public-mobile-navigation" className="border-t border-white/10 bg-[#0b2b49] px-6 py-5 lg:hidden">
            <div className="flex flex-col gap-5 text-sm font-bold">
              <Link onClick={() => setMenuOpen(false)} href={servicesPage ? "/" : "#top"}>الرئيسية</Link>
              <Link onClick={() => setMenuOpen(false)} href={servicesPage ? "#service-list" : "#home-services"}>استعراض الخدمات</Link>
              <Link onClick={() => setMenuOpen(false)} href="#how-it-works">كيف تعمل نمير</Link>
              <Link onClick={() => setMenuOpen(false)} href="#pricing-process">الدفع والتسعير</Link>
              <Link onClick={() => setMenuOpen(false)} className="text-[#91cbd5]" href="/role">تسجيل الدخول</Link>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="relative isolate overflow-hidden bg-[#071b33] text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_82%_22%,rgba(59,158,188,.43),transparent_42%),radial-gradient(ellipse_at_13%_67%,rgba(24,129,171,.36),transparent_43%),linear-gradient(135deg,#06162d_0%,#0b3855_49%,#061b33_100%)]" />

          {/* Atmospheric lighting, refracted water and drifting particles */}
          <motion.div aria-hidden="true" className="pointer-events-none absolute -right-[18%] -top-[42%] h-[850px] w-[850px] rounded-full bg-[#5ca5b9]/20 blur-[125px]" animate={reduced ? undefined : { x: [0,-70,25,0], y: [0,35,-35,0], scale: [1,1.2,1] }} transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }} />
          <motion.div aria-hidden="true" className="pointer-events-none absolute -bottom-[32%] left-[1%] h-[620px] w-[700px] rounded-full bg-[#5d9cce]/20 blur-[110px]" animate={reduced ? undefined : { x: [0,70,-30,0], scale: [1,1.1,1] }} transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }} />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[.16]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.12) 1px,transparent 1px)", backgroundSize: "88px 88px", maskImage: "linear-gradient(to bottom,transparent,black 30%,transparent)" }} />
          <motion.div aria-hidden="true" className="pointer-events-none absolute -bottom-48 left-[-15%] h-[350px] w-[130%] rounded-[50%] border-t border-[#a9dce3]/30 bg-[#3e8caa]/10 blur-[2px]" animate={reduced ? undefined : { y: [0,-30,0], rotate: [-2,1,-2] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} />
          <motion.div aria-hidden="true" className="pointer-events-none absolute -bottom-56 left-[-7%] h-[320px] w-[115%] rounded-[50%] border-t border-white/10 bg-[#62b2bc]/10" animate={reduced ? undefined : { y: [0,24,0], rotate: [2,-1,2] }} transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }} />
          {Array.from({ length: 14 }, (_, index) => {
            const x = (index * 23 + 9) % 96;
            const y = (index * 17 + 11) % 85;
            const size = 3 + (index % 4) * 3;
            return <motion.span key={index} aria-hidden="true" className="pointer-events-none absolute rounded-full border border-white/25 bg-[#b4f1f4]/25" style={{ left: x + "%", top: y + "%", width: size, height: size }} animate={reduced ? undefined : { y: [0,-45,0], opacity: [.1,.75,.1], scale: [.7,1.4,.7] }} transition={{ duration: 5 + index % 5, delay: index * .36, repeat: Infinity, ease: "easeInOut" }} />;
          })}
          <motion.div aria-hidden="true" className="pointer-events-none absolute -left-24 top-10 h-[360px] w-[360px] rounded-full border border-[#6ae4f4]/10 sm:h-[560px] sm:w-[560px]" animate={reduced ? undefined : { rotate: 360 }} transition={{ duration: 80, repeat: Infinity, ease: "linear" }} />
          <motion.div aria-hidden="true" className="pointer-events-none absolute -left-8 top-28 h-[260px] w-[260px] rounded-full border border-[#6ae4f4]/15 sm:h-[430px] sm:w-[430px]" animate={reduced ? undefined : { rotate: -360 }} transition={{ duration: 65, repeat: Infinity, ease: "linear" }} />
          <div className="relative mx-auto grid min-h-[860px] max-w-7xl items-center gap-12 px-5 pb-32 pt-28 sm:min-h-[900px] sm:px-8 lg:min-h-[970px] lg:grid-cols-[1.05fr_.95fr] lg:pb-36 lg:pt-32">
            <div className="relative z-10">
              <Reveal><span className="inline-flex items-center gap-2 rounded-full border border-[#91cbd5]/25 bg-white/5 px-4 py-2 text-xs font-bold text-[#a8d7de]"><Sparkles size={16} aria-hidden="true" /> منصة نمير لخدمات البرادات والمياه</span></Reveal>
              <Reveal delay={0.1}>
                <h1 className="mt-8 max-w-3xl text-[42px] font-extrabold leading-[1.4] tracking-tight sm:text-[58px] lg:text-[72px]">
                  {servicesPage ? "الخدمات التي تحتاجها" : "عناية تستحقها"} <span className="block bg-gradient-to-l from-[#e8fafc] via-[#8fd4df] to-[#5aaac8] bg-clip-text text-transparent">{servicesPage ? "لبرادتك في مكان واحد" : "برادتك"}</span>
                </h1>
              </Reveal>
              <Reveal delay={0.2}><p className="mt-6 max-w-xl text-base leading-9 text-[#c5e2e9] sm:text-lg">{servicesPage ? "استكشف خدمات تعبئة المياه والصيانة وتغيير الفلاتر، واطلع على طريقة طلب كل خدمة قبل تسجيل الدخول." : "من طلب تعبئة المياه إلى خدمات الصيانة وتغيير الفلاتر، تساعدك نمير على إدارة احتياجات برادتك ومتابعة الطلبات من مكان واحد."}</p></Reveal>
              <Reveal delay={0.3}>
                <div className="mt-9 flex flex-wrap gap-3">
                  <Link href={servicesPage ? "#service-list" : "#home-services"} className="inline-flex min-h-13 items-center gap-3 rounded-full bg-[#79bfca] px-7 py-4 text-sm font-extrabold text-[#092840] shadow-[0_12px_30px_rgba(40,191,216,.2)] transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4">{servicesPage ? "تصفح الخدمات" : "استعرض الخدمات"} <ArrowLeft size={18} aria-hidden="true" /></Link>
                  <Link href="/role" className="inline-flex min-h-13 items-center gap-2 rounded-full border border-white/30 px-7 py-4 text-sm font-extrabold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4">الدخول إلى المنصة</Link>
                </div>
              </Reveal>

              <Reveal delay={0.4} className="mt-10 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
                {["استعراض مجاني للخدمات", "طلب ومتابعة من الحساب", "تفاصيل واضحة للأسعار"].map((value) => (
                  <span key={value} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.05] px-3 py-3 text-[11px] font-bold text-[#d4eaf0]">
                    <CircleCheck className="h-4 w-4 shrink-0 text-[#91cbd5]" aria-hidden="true" />{value}
                  </span>
                ))}
              </Reveal>
            </div>
            <Reveal delay={0.2} className="mx-auto w-full max-w-[520px]">
              <motion.div animate={reduced ? undefined : { y: [0, -13, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="relative mx-auto flex aspect-square w-full items-center justify-center rounded-[52px] border border-[#caeef4]/20 bg-[radial-gradient(circle_at_50%_45%,rgba(110,163,171,.15),rgba(14,66,103,.55)_55%,rgba(9,35,58,.25)_75%)] shadow-[0_35px_110px_rgba(0,0,0,.18)]">
                <motion.div className="absolute -inset-[9%] rounded-full border border-[#a9dce3]/10" animate={reduced ? undefined : { rotate: 360 }} transition={{ duration: 55, repeat: Infinity, ease: "linear" }} /><motion.div className="absolute inset-[4%] rounded-full border border-dashed border-[#92c7d4]/30" animate={reduced ? undefined : { rotate: -360 }} transition={{ duration: 70, repeat: Infinity, ease: "linear" }} /><div className="absolute inset-[13%] rounded-full border border-[#88edfa]/20" />
                <motion.div className="absolute inset-[12%] rounded-full bg-[#88c9d7]/10 blur-2xl" animate={reduced ? undefined : { scale: [1,1.18,1], opacity: [.35,.85,.35] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} /><div className="absolute inset-[24%] rounded-full border border-[#88edfa]/15" /><div className="absolute inset-[19%] rounded-full bg-gradient-to-br from-white via-[#f8fcfd] to-[#d7ebef] shadow-[0_18px_70px_rgba(0,0,0,.25)]" />
                <Image src={logo} alt="شعار نمير" width={300} height={300} priority className="relative z-10 h-auto w-[56%] object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,.08)]" />
                <span className="absolute bottom-[6%] rounded-full border border-white/20 bg-[#0c3554]/90 px-4 py-2 text-xs font-bold text-[#c9f2f8]">خدمات موثوقة · متابعة سهلة</span>
              </motion.div>
            </Reveal>
          </div>
          <Link href={servicesPage ? "#service-list" : "#home-services"} aria-label="الانتقال إلى الخدمات" className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#d0eff4] transition-transform hover:translate-y-1"><ChevronDown size={25} aria-hidden="true" /></Link>
        </section>


        <section id="overview" className="relative overflow-hidden bg-[#eaf3f5] px-5 py-20 sm:px-8 lg:py-28">
          <div className="pointer-events-none absolute -left-28 top-12 h-80 w-80 rounded-full bg-[#a5cbd0]/20 blur-[80px]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[.85fr_1.15fr]">
            <Reveal>
              <div className="inline-flex items-center gap-2 text-xs font-extrabold text-[#277f93]"><Waves size={18} aria-hidden="true" /> عن منصة نمير</div>
              <h2 className="mt-5 text-3xl font-extrabold leading-[1.6] sm:text-4xl">كل ما تحتاجه برادتك <span className="block text-[#327b90]">بتجربة منظمة وواضحة</span></h2>
              <p className="mt-6 max-w-xl text-sm leading-9 text-[#5a7180]">نمير منصة إلكترونية لخدمات البرادات والمياه. يمكنك التعرف على الخدمات المتاحة قبل التسجيل، وبعد الدخول إلى حسابك تستطيع إضافة برادتك، تقديم طلب الخدمة، مراجعة تفاصيله ومتابعة حالته.</p>
              <Link href="#how-it-works" className="mt-8 inline-flex items-center gap-2 text-sm font-extrabold text-[#206b83] hover:text-[#0d2b4e]">اكتشف طريقة العمل <ArrowDown size={17} aria-hidden="true" /></Link>
            </Reveal>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {highlights.map((item, index) => {
                const Icon = item.icon;
                return <Reveal key={item.title} delay={index * .09}>
                  <div className="group flex min-h-[126px] items-center gap-5 rounded-[26px] border border-white/90 bg-white/85 p-6 shadow-[0_12px_45px_rgba(12,53,78,.045)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(12,53,78,.09)]">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-[#e4f2f4] text-[#327b90] transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-105"><Icon size={28} strokeWidth={1.8} aria-hidden="true" /></div>
                    <div><h3 className="text-base font-extrabold">{item.title}</h3><p className="mt-2 text-xs leading-7 text-[#6b8190]">{item.description}</p></div>
                    <span className="mr-auto text-sm font-extrabold text-[#c0d5dd]">0{index + 1}</span>
                  </div>
                </Reveal>;
              })}
            </div>
          </div>
        </section>

        <section id="pricing-process" className="scroll-mt-24 bg-[#0b2a43] px-5 py-20 text-white sm:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <span className="inline-flex items-center gap-2 text-xs font-bold text-[#a3d2dc]"><BadgeCheck size={18} aria-hidden="true" /> من الطلب إلى المتابعة</span>
              <h2 className="mt-4 text-3xl font-extrabold leading-relaxed sm:text-4xl">كيف تعرف التكلفة وتتابع الدفع؟</h2>
              <p className="mt-4 max-w-3xl text-sm leading-9 text-[#c3d8df]">يختلف تسعير الخدمة حسب نوعها. نوضح لك مراحل الطلب والاعتماد قبل إتمام عملية الدفع عند توفر وسيلة دفع مفعّلة.</p>
            </Reveal>
            <div className="mt-11 grid gap-5 md:grid-cols-3">
              {paymentSteps.map((item, index) => {
                const Icon = item.icon;
                return <Reveal key={item.title} delay={index * .1}>
                  <div className="group relative h-full overflow-hidden rounded-[28px] border border-white/10 bg-white/[.055] p-7 transition-all duration-300 hover:-translate-y-2 hover:border-[#a3d2dc]/45 hover:bg-white/[.085]">
                    <div className="mb-10 flex items-center justify-between"><div className="rounded-2xl bg-white/10 p-4 text-[#b7d9e2]"><Icon size={27} aria-hidden="true" /></div><span className="text-3xl font-extrabold text-white/15">0{index+1}</span></div>
                    <h3 className="text-xl font-extrabold">{item.title}</h3>
                    <p className="mt-4 text-sm leading-8 text-[#c7d9de]">{item.description}</p>
                  </div>
                </Reveal>;
              })}
            </div>
            <Reveal className="mt-8 rounded-2xl border border-[#a3d2dc]/20 bg-white/[.04] px-6 py-5 text-xs leading-8 text-[#d4e5ea]">
              تفاصيل المبلغ النهائي وأي رسوم أو ضرائب مطبقة تظهر في رحلة الطلب بحسب إعدادات الخدمة. هذه الصفحة تعريفية ولا تُعد فاتورة أو عرض سعر نهائي.
            </Reveal>
          </div>
        </section>

        <section id="faq" className="scroll-mt-24 bg-white px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.75fr_1.25fr]">
            <Reveal>
              <span className="inline-flex items-center gap-2 text-xs font-extrabold text-[#327b90]"><HelpCircle size={19} aria-hidden="true" /> الأسئلة الشائعة</span>
              <h2 className="mt-5 text-3xl font-extrabold leading-relaxed sm:text-4xl">كل التفاصيل <span className="block text-[#327b90]">قبل ما تبدأ</span></h2>
              <p className="mt-4 max-w-md text-sm leading-8 text-[#6b8190]">إجابات على أكثر الأسئلة ارتباطًا بطلب الخدمات والتسعير والمتابعة داخل نمير.</p>
            </Reveal>
            <div className="space-y-3">
              {commonQuestions.map((item, index) => <Reveal key={item.q} delay={index * .04}>
                <div className="overflow-hidden rounded-[22px] border border-[#e1eaee] bg-[#f7fafb] transition-colors hover:border-[#bdd5db]">
                  <button type="button" aria-expanded={activeFaq === index} onClick={() => setActiveFaq(activeFaq === index ? null : index)} className="flex w-full items-center justify-between gap-4 p-5 text-right text-sm font-extrabold text-[#12334a] sm:p-6">
                    <span>{item.q}</span>{activeFaq === index ? <ChevronUp size={20} className="shrink-0 text-[#397f90]" /> : <ChevronDown size={20} className="shrink-0 text-[#397f90]" />}
                  </button>
                  <AnimatePresence initial={false}>{activeFaq === index && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reduced ? 0 : .26 }} className="overflow-hidden"><p className="px-5 pb-6 text-sm leading-9 text-[#617c89] sm:px-6">{item.a}</p></motion.div>}</AnimatePresence>
                </div>
              </Reveal>)}
            </div>
          </div>
        </section>

        <section id={servicesPage ? "service-list" : "home-services"} className="scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <Reveal className="mb-11">
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-extrabold text-[#1088a7]"><span className="h-2 w-2 rounded-full bg-[#358da2]" /> خدمات نمير</div>
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div><h2 className="text-3xl font-extrabold sm:text-4xl">خدمات واضحة لاحتياجاتك</h2><p className="mt-4 max-w-2xl text-sm leading-8 text-[#667e8e]">تعرف على الخدمات المتاحة وكيفية احتساب الأسعار قبل البدء في طلبك</p></div>
                {!servicesPage && <Link href="/services" className="inline-flex items-center gap-2 text-sm font-extrabold text-[#0b819f] hover:text-[#0d2b4e]">عرض جميع الخدمات <ArrowLeft size={17} aria-hidden="true" /></Link>}
              </div>
            </Reveal>
            <ServiceGrid />
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 bg-white px-5 py-20 sm:px-8 lg:py-24">
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
              <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#358da2]/20 blur-[70px]" />
              <div className="relative"><ShieldCheck size={29} className="mb-4 text-[#73dbed]" aria-hidden="true" /><h2 className="text-2xl font-extrabold sm:text-3xl">جاهز تبدأ مع نمير؟</h2><p className="mt-3 max-w-xl text-sm leading-8 text-[#c5dfe8]">الدخول للحساب مطلوب لطلب الخدمات ومتابعة تفاصيل الطلبات، بينما يمكنك استعراض الخدمات هنا بدون تسجيل.</p></div>
              <Link href="/role" className="relative mt-7 inline-flex min-h-13 shrink-0 items-center gap-3 rounded-full bg-[#79bfca] px-7 py-4 text-sm font-extrabold text-[#092840] transition-transform hover:-translate-y-1 lg:mt-0">الدخول إلى نمير <ArrowLeft size={18} aria-hidden="true" /></Link>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-[#d7e7ed] bg-[#e8f4f7] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center text-xs font-bold text-[#657d8b] sm:flex-row sm:text-right">
          <span>© {new Date().getFullYear()} نمير — جميع الحقوق محفوظة</span>
          <div className="flex items-center gap-5"><Link href={servicesPage ? "#service-list" : "#home-services"} className="hover:text-[#0b819f]">الخدمات</Link><Link href="/role" className="hover:text-[#0b819f]">تسجيل الدخول</Link></div>
        </div>
      </footer>
    </div>
  );
}
