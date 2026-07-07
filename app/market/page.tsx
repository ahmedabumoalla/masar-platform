import ProductGrid from "@/components/ProductGrid"
import { MarketSidebar, PageHeader, StoreBenefits } from "@/components/MasarUI"

export default function MarketPage() {
  return (
    <main className="page">
      <div className="container">
        <PageHeader title="السوق الرقمي" text="تصفح المنتجات والخدمات الزراعية المناسبة لمزرعتك من موردين موثوقين." />
        <div className="marketLayout">
          <section>
            <ProductGrid />
            <StoreBenefits />
          </section>
          <MarketSidebar />
        </div>
      </div>
    </main>
  )
}
