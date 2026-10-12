"use client";

import AdminEmpty from "@/components/admin/AdminEmpty";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { ApiError, apiRequest } from "@/lib/api";
import { getAuthToken } from "@/lib/auth";
import { Bell, CheckCheck, Clock3, Droplets, PackageCheck, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type N={id:number;type:string;title:string;body:string;data?:Record<string,unknown>|null;read_at?:string|null;created_at?:string|null};
type Response={success:true;data:{notifications:{data:N[]};unread_count:number}};

export default function Page(){
 const router=useRouter();
 const [items,setItems]=useState<N[]>([]);const [unread,setUnread]=useState(0);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
 const load=useCallback(async()=>{const token=getAuthToken();if(!token)return;setLoading(true);setError("");try{const r=await apiRequest<Response>("/notifications?per_page=100",{token});setItems(r.data.notifications.data||[]);setUnread(Number(r.data.unread_count||0))}catch(e){setError(e instanceof ApiError?e.message:"تعذر تحميل الإشعارات")}finally{setLoading(false)}},[]);
 useEffect(()=>{void load()},[load]);

 async function markAll(){const token=getAuthToken();if(!token)return;await apiRequest("/notifications/read-all",{method:"PATCH",token});setItems(a=>a.map(x=>({...x,read_at:new Date().toISOString()})));setUnread(0);window.dispatchEvent(new Event("numayr:notifications-updated"))}
 async function open(n:N){const token=getAuthToken();if(!token)return;if(!n.read_at){try{await apiRequest(`/notifications/${n.id}/read`,{method:"PATCH",token});setItems(a=>a.map(x=>x.id===n.id?{...x,read_at:new Date().toISOString()}:x));setUnread(x=>Math.max(0,x-1));window.dispatchEvent(new Event("numayr:notifications-updated"))}catch{}}
   const d=n.data||{}; if(d.cooler_id)router.push(`/admin/coolers/${d.cooler_id}`);else if(d.order_id)router.push(`/admin/orders/${d.order_id}`);else if(d.payment_id)router.push(`/admin/payments/${d.payment_id}`);else if(d.invoice_id)router.push(`/admin/invoices/${d.invoice_id}`);
 }

 return <div className="space-y-6">
  <AdminPageHeader icon={Bell} eyebrow="مركز التنبيهات" title="إشعارات الإدارة" description="تنبيهات الإدارة مع انتقال مباشر للطلب أو البرادة أو العملية المرتبطة." action={<div className="flex gap-2"><button onClick={()=>void load()} className="inline-flex h-11 items-center gap-2 rounded-[14px] border border-white/10 bg-white/[0.08] px-4 text-xs font-extrabold text-white"><RefreshCw className={`h-4 w-4 ${loading?"animate-spin":""}`}/>تحديث</button>{unread>0?<button onClick={()=>void markAll()} className="inline-flex h-11 items-center gap-2 rounded-[14px] bg-white px-4 text-xs font-extrabold text-[#0d2b4e]"><CheckCheck className="h-4 w-4"/>قراءة الكل</button>:null}</div>}/>
  {error?<div className="rounded-[18px] border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">{error}</div>:null}
  <section className="overflow-hidden rounded-[26px] border border-[#dfecef] bg-white">{loading?<div className="grid min-h-[300px] place-items-center"><span className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#d8e8ec] border-t-[#16a6c9]"/></div>:items.length?<div className="divide-y divide-[#edf2f4]">{items.map(n=>{const Icon=n.type.includes("cooler")?Droplets:n.type.includes("order")?PackageCheck:Bell;return <button key={n.id} onClick={()=>void open(n)} className={`flex w-full gap-4 p-5 text-right hover:bg-[#fbfdfe] ${n.read_at?"bg-white":"bg-[#f7fcfd]"}`}><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${n.read_at?"bg-[#f1f6f8] text-[#8096a4]":"bg-[#e7f8fb] text-[#16a6c9]"}`}><Icon className="h-5 w-5"/></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="text-[12px] font-extrabold">{n.title}</p>{!n.read_at?<span className="h-2 w-2 rounded-full bg-[#e53935]"/>:null}</div><p className="mt-1 text-[11px] font-bold leading-6 text-[#758b99]">{n.body}</p><div className="mt-2 flex items-center gap-1 text-[9px] font-bold text-[#9aabb5]"><Clock3 className="h-3 w-3"/>{n.created_at?new Intl.DateTimeFormat("ar-EG-u-nu-latn",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(n.created_at)):"—"}</div></div></button>})}</div>:<AdminEmpty icon={Bell} title="لا توجد إشعارات" description="لا توجد تنبيهات حاليًا."/>}</section>
 </div>
}
