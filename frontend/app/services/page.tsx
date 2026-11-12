import type { Metadata } from "next";
import PublicLanding from "@/components/PublicLanding";

export const metadata: Metadata = {
  title: "خدمات نمير | تعبئة المياه والصيانة وتغيير الفلاتر",
  description: "تعرّف على خدمات نمير لتعبئة مياه التحلية وصيانة البرادات وتغيير الفلاتر وكيفية تقديم طلبات الخدمات.",
};

export default function ServicesPage() {
  return <PublicLanding servicesPage />;
}
