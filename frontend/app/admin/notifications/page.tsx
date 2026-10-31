"use client";

import AdminEmpty from "@/components/admin/AdminEmpty";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { ApiError, apiRequest } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import { Bell, Check, CheckCheck, Clock3, Droplets, PackageCheck, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type N={id:number;type:string;title:string;body:string;data?:Record<string,unknown>|null;read_at?:string|null;created_at?:string|null};
type Response={success:true;data:{notifications:{data:N[];current_page:number;last_page:number};unread_count:number}};

export default function Page(){
 const router=useRouter();
 const [items,setItems]=useState<N[]>([]);const [nextPage,setNextPage]=useState(2);const [hasMore,setHasMore]=useState(false);const [loadingMore,setLoadingMore]=useState(false);const [unread,setUnread]=useState(0);const [loading,setLoading]=useState(true);const [markingAll,setMarkingAll]=useState(false);const [readingId,setReadingId]=useState<number|null>(null);const [filter,setFilter]=useState<"all"|"unread"|"read">("all");const [search,setSearch]=useState("");const [error,setError]=useState("");
 const load=useCallback(async()=>{const token=getAuthToken();if(!token)return;setLoading(true);setError("");try{const r=await apiRequest<Response>("/notifications?per_page=100",{token});setItems(r.data.notifications.data||[]);setHasMore(r.data.notifications.current_page<r.data.notifications.last_page);setNextPage(2);setUnread(Number(r.data.unread_count||0))}catch(e){setError(e instanceof ApiError?e.message:"تعذر تحميل الإشعارات")}finally{setLoading(false)}},[]);
 useEffect(()=>{queueMicrotask(()=>{void load()})},[load]);

 async function loadMore(){
  if(loadingMore||!hasMore)return;
  const token=getAuthToken();if(!token)return;
  setLoadingMore(true);
  try{
   const r=await apiRequest<Response>(`/notifications?per_page=100&page=${nextPage}`,{token});
   setItems(current=>{const ids=new Set(current.map(x=>x.id));return [...current,...r.data.notifications.data.filter(x=>!ids.has(x.id))]});
   setHasMore(r.data.notifications.current_page<r.data.notifications.last_page);
   setNextPage(r.data.notifications.current_page+1);
  }catch(e){setError(e instanceof ApiError?e.message:"تعذر تحميل بقية الإشعارات")}
  finally{setLoadingMore(false)}
 }
 async function markAll(){
 if(markingAll)return;
 const token=getAuthToken();if(!token)return;
 setMarkingAll(true);setError("");
 try{
  await apiRequest("/notifications/read-all",{method:"PATCH",token});
  setItems(a=>a.map(x=>({...x,read_at:x.read_at||new Date().toISOString()})));
  setUnread(0);
  window.dispatchEvent(new Event("numayr:notifications-updated"));
 }catch(e){
  setError(e instanceof ApiError?e.message:"تعذر تحديد جميع الإشعارات كمقروءة");
 }finally{
  setMarkingAll(false);
 }
}
 async function markOne(n:N){
  if(n.read_at||readingId!==null)return;
  const token=getAuthToken();if(!token)return;
  setReadingId(n.id);setError("");
  try{
   await apiRequest(`/notifications/${n.id}/read`,{method:"PATCH",token});
   setItems(a=>a.map(x=>x.id===n.id?{...x,read_at:new Date().toISOString()}:x));
   setUnread(x=>Math.max(0,x-1));
   window.dispatchEvent(new Event("numayr:notifications-updated"));
  }catch(e){
   setError(e instanceof ApiError?e.message:"تعذر تحديث حالة قراءة الإشعار");
  }finally{
   setReadingId(null);
  }
 }
 const visibleItems=items.filter(n=>{
  if(filter==="unread"&&n.read_at)return false;
  if(filter==="read"&&!n.read_at)return false;
  const q=search.trim().toLowerCase();
  return !q||n.title.toLowerCase().includes(q)||n.body.toLowerCase().includes(q);
 });
 async function open(n: N) {
  const token = getAuthToken();
  if (!token) return;

  if (!n.read_at) {
   try {
    await apiRequest(`/notifications/${n.id}/read`, {
     method: "PATCH",
     token,
    });

    setItems(items =>
     items.map(item =>
      item.id === n.id
       ? { ...item, read_at: new Date().toISOString() }
       : item
     )
    );

    setUnread(count => Math.max(0, count - 1));
    window.dispatchEvent(new Event("numayr:notifications-updated"));
   } catch (e) {
    setError(
     e instanceof ApiError
      ? e.message
      : "تعذر تحديث حالة قراءة الإشعار"
    );
   }
  }

  const data = n.data ?? {};

  function validId(value: unknown): number | null {
   if (
    typeof value !== "number" &&
    typeof value !== "string"
   ) return null;

   if (typeof value === "string" && !/^[1-9]\d*$/.test(value)) return null;

   const id = Number(value);
   return Number.isSafeInteger(id) && id > 0 ? id : null;
  }

  const orderId = validId(data.order_id);
  const customerId = validId(data.customer_id);
  const coolerId = validId(data.cooler_id);
  const paymentId = validId(data.payment_id);
  const invoiceId = validId(data.invoice_id);

  if (n.type === "payment" && paymentId) {
   router.push(`/admin/payments/${paymentId}`);
  } else if (n.type === "subscription" && paymentId) {
   router.push(`/admin/payments/${paymentId}`);
  } else if (n.type === "invoice" && invoiceId) {
   router.push(`/admin/invoices/${invoiceId}`);
  } else if (orderId) {
   router.push(`/admin/orders/${orderId}`);
  } else if (n.type === "customer_registration" && customerId) {
   router.push(`/admin/customers/${customerId}`);
  } else if (coolerId) {
   router.push(`/admin/coolers/${coolerId}`);
  } else if (customerId) {
   router.push(`/admin/customers/${customerId}`);
  } else if (paymentId) {
   router.push(`/admin/payments/${paymentId}`);
  } else if (invoiceId) {
   router.push(`/admin/invoices/${invoiceId}`);
  }
 }

 return <div className="space-y-6">
  <AdminPageHeader icon={Bell} eyebrow="مركز التنبيهات" title="إشعارات الإدارة" description="تنبيهات الإدارة مع انتقال مباشر للطلب أو البرادة أو العملية المرتبطة." action={<div className="flex gap-2"><button onClick={()=>void load()} className="inline-flex h-11 items-center gap-2 rounded-[14px] border border-white/10 bg-white/[0.08] px-4 text-xs font-extrabold text-white"><RefreshCw className={`h-4 w-4 ${loading?"animate-spin":""}`}/>تحديث</button><button disabled={markingAll||unread===0} onClick={()=>void markAll()} className="inline-flex h-11 items-center gap-2 rounded-[14px] bg-white px-5 text-xs font-extrabold text-[#0d2b4e] transition hover:bg-[#dff5fb] disabled:cursor-not-allowed disabled:opacity-50"><CheckCheck className="h-4 w-4"/>{markingAll?"جاري التحديث...":"تحديد الكل كمقروء"}</button></div>}/>
  {error?<div className="rounded-[18px] border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">{error}</div>:null}
  <section className="rounded-[22px] border border-[#dfecef] bg-white p-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
  <div className="relative min-w-[200px] flex-1">
   <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#91a4af]"/>
   <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث في الإشعارات المعروضة..." className="h-11 w-full rounded-[13px] border border-[#dfecef] bg-[#f9fcfd] pr-10 pl-3 text-xs outline-none focus:border-[#16a6c9]"/>
  </div>
  <div className="flex flex-wrap items-center gap-2">
   {(["all","unread","read"] as const).map(f=><button key={f} type="button" onClick={()=>setFilter(f)} className={`rounded-[12px] px-4 py-2.5 text-xs font-bold transition ${filter===f?"bg-[#0d2b4e] text-white":"bg-[#f1f7f9] text-[#678092] hover:bg-[#dceff4]"}`}>{f==="all"?"الكل":f==="unread"?"غير المقروء":"المقروء"}</button>)}
   <span className="rounded-full bg-[#e8f8fb] px-3 py-2 text-[11px] font-bold text-[#108baa]">{unread} غير مقروء</span>
  </div>
 </div>
</section>
<section className="overflow-hidden rounded-[26px] border border-[#dfecef] bg-white">{loading?<div className="grid min-h-[300px] place-items-center"><span className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#d8e8ec] border-t-[#16a6c9]"/></div>:visibleItems.length?<div className="divide-y divide-[#edf2f4]">{visibleItems.map(n=>{const Icon=n.type.includes("cooler")?Droplets:n.type.includes("order")?PackageCheck:Bell;return <div key={n.id} className="group flex items-center gap-4 border-r-4 border-transparent px-5 py-5 transition-all duration-200 hover:border-[#16a6c9] hover:bg-[#e2f5fa] hover:shadow-[inset_0_0_0_1px_rgba(22,166,201,.15)]"><button type="button" onClick={()=>void open(n)} className={`flex w-full items-center gap-4 py-2 text-right transition-transform duration-200 group-hover:-translate-x-1 ${n.read_at?"bg-white":"bg-[#f7fcfd]"}`}><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${n.read_at?"bg-[#f1f6f8] text-[#8096a4]":"bg-[#e7f8fb] text-[#16a6c9]"}`}><Icon className="h-5 w-5"/></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="text-[14px] font-extrabold">{n.title}</p>{!n.read_at?<span className="h-2 w-2 rounded-full bg-[#e53935]"/>:null}</div><p className="mt-1 text-[13px] font-bold leading-7 text-[#647f90]">{n.body}</p><div className="mt-2 flex items-center gap-1 text-[9px] font-bold text-[#9aabb5]"><Clock3 className="h-3 w-3"/>{n.created_at?new Intl.DateTimeFormat("ar-EG-u-nu-latn",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(n.created_at)):"—"}</div></div></button>{!n.read_at?<button type="button" title="تحديد كمقروء" aria-label="تحديد كمقروء" disabled={readingId===n.id} onClick={()=>void markOne(n)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border border-[#bfe4ec] bg-white text-[#108baa] transition hover:border-[#16a6c9] hover:bg-[#cdeff6] disabled:opacity-50">{readingId===n.id?<span className="h-4 w-4 animate-spin rounded-full border-2 border-t-[#16a6c9]"/>:<Check className="h-4 w-4"/>}</button>:null}</div>})}</div>:<AdminEmpty icon={Bell} title="لا توجد إشعارات" description="لا توجد تنبيهات حاليًا."/>}</section>
 {hasMore&&!loading?<div className="flex justify-center"><button type="button"
 onClick={()=>void loadMore()} disabled={loadingMore}
 className="rounded-xl border border-[#c9e3e9] bg-white px-6 py-3 text-xs font-bold text-[#0d2b4e] disabled:opacity-50">
 {loadingMore?"جاري تحميل المزيد...":"عرض إشعارات أقدم"}</button></div>:null}
 </div>
}
