"use client";

import { ApiError, apiRequest } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import {
  BadgeDollarSign, Bell, Check, CircleDollarSign, Crown, Gauge,
  Percent, RefreshCw, Save, Settings, ShieldCheck, SlidersHorizontal,
  Sparkles, WalletCards, X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";

type Setting = {
  id: number; key: string; value: string | number | boolean | null;
  type?: string | null; group?: string | null; description?: string | null;
};
type Benefits = {
  annual_inspections?: number; smart_alerts?: boolean; priority_service?: boolean;
  discount_percent?: number; included_filter_changes?: number;
};
type Plan = {
  id: number; code: string; name_ar: string; name_en: string;
  description_ar?: string | null; description_en?: string | null;
  billing_cycle: "monthly" | "yearly"; price: number | string; currency: string;
  benefits?: Benefits | null; savings_percent?: number | string | null;
  is_featured: boolean; is_active: boolean; sort_order: number;
};
type Tab = "overview" | "billing" | "plans" | "operations";

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [settings, setSettings] = useState<Setting[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [drafts, setDrafts] = useState<Record<string,string>>({});
  const [editing, setEditing] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    setLoading(true); setError("");
    try {
      const [a,b] = await Promise.all([
        apiRequest<{data:{settings:Setting[]}}>("/admin/settings",{token}),
        apiRequest<{data:{plans:Plan[]}}>("/admin/subscription-plans",{token}),
      ]);
      const s = a.data.settings || [];
      setSettings(s);
      setDrafts(Object.fromEntries(s.map((x:Setting)=>[x.key,String(x.value??"")])));
      setPlans(b.data.plans || []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "تعذر تحميل الإعدادات");
    } finally { setLoading(false); }
  },[]);

  useEffect(()=>{queueMicrotask(()=>{void load()})},[load]);

  const tax = useMemo(()=>settings.find(x=>x.key==="tax_rate"),[settings]);
  const currency = useMemo(()=>settings.find(x=>x.key==="currency"),[settings]);
  const featured = plans.find(x=>x.is_featured);

  async function saveSetting(item:Setting) {
    const token=getAuthToken(); if(!token) return;
    setSaving(item.key); setError(""); setSuccess("");
    try {
      const raw=drafts[item.key]??"";
      const value=item.type==="decimal"||item.type==="integer"?Number(raw):raw;
      const r=await apiRequest<{data:{setting:Setting}}>(`/admin/settings/${encodeURIComponent(item.key)}`,{
        method:"PATCH",token,body:JSON.stringify({value})
      });
      setSettings(cur=>cur.map(x=>x.key===item.key?r.data.setting:x));
      setSuccess("تم حفظ الإعداد بنجاح");
    } catch(e){ setError(e instanceof ApiError?e.message:"تعذر الحفظ"); }
    finally{ setSaving(""); }
  }

  async function savePlan() {
    if(!editing) return;
    const token=getAuthToken(); if(!token) return;
    setSaving("plan"); setError(""); setSuccess("");
    try {
      const r=await apiRequest<{data:{plan:Plan}}>(`/admin/subscription-plans/${editing.id}`,{
        method:"PATCH",token,body:JSON.stringify({
          ...editing,
          price:Number(editing.price),
          savings_percent: editing.savings_percent===""?null:editing.savings_percent,
          benefits:{
            annual_inspections:Number(editing.benefits?.annual_inspections||0),
            smart_alerts:Boolean(editing.benefits?.smart_alerts),
            priority_service:Boolean(editing.benefits?.priority_service),
            discount_percent:Number(editing.benefits?.discount_percent||0),
            included_filter_changes:Number(editing.benefits?.included_filter_changes||0),
          }
        })
      });
      setPlans(cur=>cur.map(x=>x.id===editing.id?r.data.plan:x));
      setEditing(null);
      setSuccess("تم تحديث الباقة بنجاح");
    } catch(e){ setError(e instanceof ApiError?e.message:"تعذر حفظ الباقة"); }
    finally{ setSaving(""); }
  }

  return <div className="space-y-6">
    <section className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(125deg,#0d2b4e_0%,#123e68_55%,#0d607a_100%)] p-6 sm:p-8">
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.07] px-3 py-1.5 text-[10px] font-extrabold text-[#72e0f5]">
            <Settings className="h-3.5 w-3.5"/> مركز إعدادات نمير
          </span>
          <h1 className="mt-4 text-[28px] font-extrabold text-white sm:text-[34px]">إعدادات المنصة</h1>
          <p className="mt-2 max-w-2xl text-[13px] font-bold leading-7 text-white/70">
            تحكم فعلي في المالية وباقات الاشتراك مع روابط تشغيل واضحة لكل أجزاء الإدارة.
          </p>
        </div>
        <button onClick={()=>void load()} className="inline-flex h-11 items-center gap-2 rounded-[14px] border border-white/10 bg-white/[.08] px-4 text-xs font-extrabold text-white">
          <RefreshCw className={`h-4 w-4 ${loading?"animate-spin":""}`}/> تحديث
        </button>
      </div>
    </section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card icon={BadgeDollarSign} label="العملة" value={String(currency?.value||"SAR")} />
      <Card icon={Percent} label="الضريبة" value={`${tax?.value??15}%`} />
      <Card icon={Crown} label="الباقات النشطة" value={`${plans.filter(x=>x.is_active).length}`} />
      <Card icon={Sparkles} label="الباقة المميزة" value={featured?.name_ar||"غير محددة"} small />
    </section>

    <section className="overflow-x-auto rounded-[22px] border border-[#dfecef] bg-white p-2">
      <div className="flex min-w-max gap-1">
        {([
          ["overview","نظرة عامة",Gauge],
          ["billing","المالية والضرائب",CircleDollarSign],
          ["plans","باقات الاشتراك",Crown],
          ["operations","التشغيل",SlidersHorizontal],
        ] as const).map(([id,label,Icon])=>
          <button key={id} onClick={()=>setTab(id)} className={`inline-flex h-11 items-center gap-2 rounded-[13px] px-4 text-[11px] font-extrabold ${tab===id?"bg-[#0d2b4e] text-white":"text-[#6f8594] hover:bg-[#f1f7f9]"}`}>
            <Icon className="h-4 w-4"/>{label}
          </button>
        )}
      </div>
    </section>

    {success&&<div className="rounded-[18px] border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">{success}</div>}
    {error&&<div className="rounded-[18px] border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">{error}</div>}

    {loading?<div className="grid min-h-[360px] place-items-center rounded-[26px] border border-[#dfecef] bg-white">
      <span className="h-11 w-11 animate-spin rounded-full border-[3px] border-[#d8e8ec] border-t-[#16a6c9]"/>
    </div>:null}

    {!loading&&tab==="overview"&&<div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
      <section className="rounded-[26px] border border-[#dfecef] bg-white p-6">
        <h2 className="text-[16px] font-extrabold text-[#0d2b4e]">ملخص النظام</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Info label="العملة الأساسية" value={String(currency?.value||"SAR")}/>
          <Info label="نسبة الضريبة" value={`${tax?.value??15}%`}/>
          <Info label="الباقات المتاحة" value={`${plans.filter(x=>x.is_active).length}`}/>
          <Info label="الباقة المميزة" value={featured?.name_ar||"غير محددة"}/>
        </div>
        <div className="mt-5 flex gap-3 rounded-[18px] border border-[#cfe8ee] bg-[#edf9fb] p-4">
          <ShieldCheck className="h-5 w-5 shrink-0 text-[#16a6c9]"/>
          <p className="text-[10px] font-bold leading-6 text-[#6f8796]">كل العناصر القابلة للتعديل هنا مربوطة بالـBackend الفعلي، بدون Toggles وهمية.</p>
        </div>
      </section>
      <section className="rounded-[26px] border border-[#dfecef] bg-white p-6">
        <h2 className="text-[16px] font-extrabold text-[#0d2b4e]">وصول سريع</h2>
        <div className="mt-5 space-y-3">
          <Quick href="/admin/services" icon={SlidersHorizontal} title="الخدمات والأسعار"/>
          <Quick href="/admin/subscriptions" icon={Crown} title="اشتراكات العملاء"/>
          <Quick href="/admin/payments" icon={WalletCards} title="المدفوعات"/>
          <Quick href="/admin/notifications" icon={Bell} title="الإشعارات"/>
        </div>
      </section>
    </div>}

    {!loading&&tab==="billing"&&<section className="rounded-[26px] border border-[#dfecef] bg-white p-6">
      <h2 className="text-[16px] font-extrabold text-[#0d2b4e]">المالية والضرائب</h2>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {settings.filter(x=>x.key==="tax_rate"||x.key==="currency"||x.group==="billing").map(item=>
          <div key={item.key} className="rounded-[20px] border border-[#e2ecef] bg-[#fbfdfe] p-5">
            <p className="text-[12px] font-extrabold text-[#0d2b4e]">{item.key==="tax_rate"?"نسبة الضريبة":item.key==="currency"?"العملة":item.key}</p>
            {item.key==="currency"?
              <select value={drafts[item.key]??""} onChange={e=>setDrafts(c=>({...c,[item.key]:e.target.value}))} className="mt-4 h-12 w-full rounded-[15px] border border-[#dce9ed] bg-white px-4 text-xs font-extrabold">
                {["SAR","USD","AED","KWD","BHD","QAR","OMR"].map(x=><option key={x}>{x}</option>)}
              </select>
              :<input type="number" value={drafts[item.key]??""} onChange={e=>setDrafts(c=>({...c,[item.key]:e.target.value}))} className="mt-4 h-12 w-full rounded-[15px] border border-[#dce9ed] bg-white px-4 text-xs font-bold"/>
            }
            <button onClick={()=>void saveSetting(item)} className="mt-3 h-11 w-full rounded-[14px] bg-[#0d2b4e] text-[10px] font-extrabold text-white">
              {saving===item.key?"جاري الحفظ...":"حفظ التعديل"}
            </button>
          </div>
        )}
      </div>
    </section>}

    {!loading&&tab==="plans"&&<section>
      <div className="mb-4">
        <h2 className="text-[17px] font-extrabold text-[#0d2b4e]">باقات نمير</h2>
        <p className="mt-1 text-[11px] font-bold text-[#879aa6]">القيم الحالية مطابقة لآخر نسخة معتمدة من الديمو.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {plans.map(plan=><article key={plan.id} className={`relative rounded-[26px] border bg-white p-5 ${plan.is_featured?"border-[#9cddea] ring-2 ring-[#16a6c9]/10":"border-[#dfecef]"}`}>
          {plan.is_featured&&<span className="absolute left-4 top-4 rounded-full bg-[#0d2b4e] px-3 py-1 text-[9px] font-extrabold text-white">الأكثر اختيارًا</span>}
          <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#eaf8fb] text-[#16a6c9]"><Crown className="h-5 w-5"/></div>
          <h3 className="mt-5 text-[15px] font-extrabold text-[#0d2b4e]">{plan.name_ar}</h3>
          <p className="mt-1 text-[9px] font-black text-[#9aabb5]">{plan.code}</p>
          <div className="mt-5 flex items-end gap-2"><strong className="text-[30px] font-black">{Number(plan.price)}</strong><span className="pb-1 text-[10px] font-extrabold text-[#7f929e]">{plan.currency} / {plan.billing_cycle==="yearly"?"سنة":"شهر"}</span></div>
          {plan.savings_percent?<span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-extrabold text-emerald-700">وفر {Number(plan.savings_percent)}%</span>:null}
          <p className="mt-4 min-h-[52px] text-[11px] font-bold leading-7 text-[#718795]">{plan.description_ar}</p>
          <div className="mt-4 space-y-2">
            <Benefit text={`${plan.benefits?.annual_inspections||0} فحوص سنويًا`}/>
            <Benefit text={`${plan.benefits?.included_filter_changes||0} تغييرات فلاتر مشمولة`}/>
            <Benefit text={`خصم ${plan.benefits?.discount_percent||0}%`}/>
            <Benefit text={plan.benefits?.smart_alerts?"تنبيهات ذكية":"بدون تنبيهات ذكية"}/>
            <Benefit text={plan.benefits?.priority_service?"أولوية في الخدمة":"بدون أولوية"}/>
          </div>
          <button onClick={()=>setEditing({...plan,benefits:{...plan.benefits}})} className="mt-5 h-11 w-full rounded-[14px] bg-[#0d2b4e] text-[10px] font-extrabold text-white">تعديل الباقة</button>
        </article>)}
      </div>
    </section>}

    {!loading&&tab==="operations"&&<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <Op href="/admin/services" icon={SlidersHorizontal} title="الخدمات والأسعار" text="إدارة الأسعار والتفعيل"/>
      <Op href="/admin/payments" icon={WalletCards} title="المدفوعات" text="متابعة المعاملات"/>
      <Op href="/admin/notifications" icon={Bell} title="الإشعارات" text="متابعة التنبيهات"/>
      <Op href="/admin/subscriptions" icon={Crown} title="الاشتراكات" text="متابعة اشتراكات العملاء"/>
      <Op href="/admin/coolers" icon={ShieldCheck} title="اعتماد البرادات" text="المراجعة والاعتماد"/>
      <Op href="/admin/invoices" icon={CircleDollarSign} title="الفواتير" text="الفواتير المالية"/>
    </div>}

    {editing&&<div className="fixed inset-0 z-[80] grid place-items-center bg-[#06192f]/45 p-3 backdrop-blur-[3px]">
      <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-[30px] bg-white p-6">
        <div className="flex items-center justify-between"><div><p className="text-[9px] font-extrabold text-[#16a6c9]">تعديل الباقة</p><h2 className="mt-1 text-lg font-extrabold">{editing.name_ar}</h2></div><button onClick={()=>setEditing(null)}><X/></button></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="الاسم بالعربية" value={editing.name_ar} onChange={v=>setEditing(c=>c?{...c,name_ar:v}:c)}/>
          <Field label="الاسم بالإنجليزية" value={editing.name_en} onChange={v=>setEditing(c=>c?{...c,name_en:v}:c)}/>
          <Field label="السعر" type="number" value={String(editing.price)} onChange={v=>setEditing(c=>c?{...c,price:v}:c)}/>
          <Field label="نسبة التوفير" type="number" value={String(editing.savings_percent??"")} onChange={v=>setEditing(c=>c?{...c,savings_percent:v===""?null:v}:c)}/>
          <Field label="الفحوص السنوية" type="number" value={String(editing.benefits?.annual_inspections||0)} onChange={v=>setEditing(c=>c?{...c,benefits:{...c.benefits,annual_inspections:Number(v)}}:c)}/>
          <Field label="تغييرات الفلاتر" type="number" value={String(editing.benefits?.included_filter_changes||0)} onChange={v=>setEditing(c=>c?{...c,benefits:{...c.benefits,included_filter_changes:Number(v)}}:c)}/>
          <Field label="نسبة الخصم" type="number" value={String(editing.benefits?.discount_percent||0)} onChange={v=>setEditing(c=>c?{...c,benefits:{...c.benefits,discount_percent:Number(v)}}:c)}/>
          <div><label className="mb-2 block text-[10px] font-extrabold">دورة الفوترة</label><select value={editing.billing_cycle} onChange={e=>setEditing(c=>c?{...c,billing_cycle:e.target.value as Plan["billing_cycle"]}:c)} className="h-12 w-full rounded-[15px] border border-[#dce9ed] px-4 text-xs"><option value="monthly">شهري</option><option value="yearly">سنوي</option></select></div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Toggle label="تنبيهات ذكية" checked={!!editing.benefits?.smart_alerts} onChange={v=>setEditing(c=>c?{...c,benefits:{...c.benefits,smart_alerts:v}}:c)}/>
          <Toggle label="أولوية في الخدمة" checked={!!editing.benefits?.priority_service} onChange={v=>setEditing(c=>c?{...c,benefits:{...c.benefits,priority_service:v}}:c)}/>
          <Toggle label="باقة مميزة" checked={editing.is_featured} onChange={v=>setEditing(c=>c?{...c,is_featured:v}:c)}/>
        </div>
        <div className="mt-3"><Toggle label="الباقة مفعلة" checked={editing.is_active} onChange={v=>setEditing(c=>c?{...c,is_active:v}:c)}/></div>
        <button onClick={()=>void savePlan()} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[16px] bg-[#0d2b4e] text-xs font-extrabold text-white"><Save className="h-4 w-4"/>{saving==="plan"?"جاري الحفظ...":"حفظ الباقة"}</button>
      </div>
    </div>}
  </div>;
}

function Card({icon:Icon,label,value,small=false}:{icon:LucideIcon,label:string,value:string,small?:boolean}){return <article className="rounded-[22px] border border-[#dfecef] bg-white p-5"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#eaf8fb] text-[#16a6c9]"><Icon className="h-5 w-5"/></div><div className="min-w-0"><p className="text-[9px] font-extrabold text-[#94a5af]">{label}</p><strong className={`mt-1 block truncate font-black text-[#0d2b4e] ${small?"text-[13px]":"text-xl"}`}>{value}</strong></div></div></article>}
function Info({label,value}:{label:string,value:string}){return <div className="rounded-[16px] bg-[#f7fafb] p-4"><p className="text-[9px] font-bold text-[#97a7b1]">{label}</p><p className="mt-1.5 text-[12px] font-extrabold text-[#38536a]">{value}</p></div>}
function Quick({href,icon:Icon,title}:{href:string,icon:LucideIcon,title:string}){return <Link href={href} className="flex items-center gap-3 rounded-[17px] border border-[#e2ecef] bg-[#fbfdfe] p-4"><div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#eaf8fb] text-[#16a6c9]"><Icon className="h-4 w-4"/></div><p className="text-[11px] font-extrabold">{title}</p></Link>}
function Benefit({text}:{text:string}){return <div className="flex items-center gap-2 text-[10px] font-bold text-[#607887]"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Check className="h-3 w-3"/></span>{text}</div>}
function Op({href,icon:Icon,title,text}:{href:string,icon:LucideIcon,title:string,text:string}){return <article className="rounded-[24px] border border-[#dfecef] bg-white p-5"><div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#eaf8fb] text-[#16a6c9]"><Icon className="h-5 w-5"/></div><h3 className="mt-4 text-[14px] font-extrabold">{title}</h3><p className="mt-2 text-[10px] font-bold text-[#8497a3]">{text}</p><Link href={href} className="mt-4 inline-flex text-[10px] font-extrabold text-[#16a6c9]">فتح الصفحة</Link></article>}
function Field({label,value,onChange,type="text"}:{label:string,value:string,onChange:(v:string)=>void,type?:string}){return <div><label className="mb-2 block text-[10px] font-extrabold">{label}</label><input type={type} value={value} onChange={e=>onChange(e.target.value)} className="h-12 w-full rounded-[15px] border border-[#dce9ed] px-4 text-xs"/></div>}
function Toggle({label,checked,onChange}:{label:string,checked:boolean,onChange:(v:boolean)=>void}){return <label className="flex items-center justify-between rounded-[15px] border border-[#e2ecef] bg-[#fbfdfe] p-4"><span className="text-[10px] font-extrabold">{label}</span><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} className="h-5 w-5 accent-[#16a6c9]"/></label>}
