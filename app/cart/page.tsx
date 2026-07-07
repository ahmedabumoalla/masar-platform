import CartClient from "@/components/CartClient"
import { PageHeader } from "@/components/MasarUI"

export default function CartPage() {
  return (
    <main className="page">
      <div className="container">
        <PageHeader title="سلة المنتجات" text="راجع المنتجات والكميات ثم انتقل للدفع." />
        <CartClient />
      </div>
    </main>
  )
}
