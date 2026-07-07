import CheckoutForm from "@/components/CheckoutForm"
import { PageHeader } from "@/components/MasarUI"

export default function CheckoutPage() {
  return (
    <main className="page">
      <div className="container">
        <PageHeader title="صفحة الدفع" text="أدخل بيانات المزرعة والتواصل لإتمام طلب المنتجات وربطها بالخدمة المناسبة." />
        <CheckoutForm />
      </div>
    </main>
  )
}
