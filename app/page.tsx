import Image from "next/image"
import { Leaf } from "lucide-react"
import { HomeFeatures, StatsGrid } from "@/components/MasarUI"

export default function Home() {
  return (
    <main className="page" style={{ paddingTop: 0 }}>
      <section className="homeHero">
        <div className="container homeHeroGrid">
          <div className="homeCopy">
            <span className="badgePill"><Leaf size={18} /> منصة زراعية ذكية تربطك بنجاح مزرعتك</span>
            <h1>لكل قطرة ماء مسار</h1>
            <p className="homeLead">منصة ذكية لإدارة المزرعة تساعدك على إدارة الري، اكتشاف الأعطال والآفات، حماية المحاصيل والوصول إلى الحلول الزراعية من مكان واحد.</p>
          </div>

          <div className="homeDeviceCluster" aria-label="جهاز مسار وبطاقات القياسات">
            <Image
              src="/home-device-cluster.png"
              alt="جهاز مسار الذكي مع بطاقات حالة الري واستهلاك المياه ورطوبة التربة ودرجة الحرارة"
              width={836}
              height={508}
              priority
            />
          </div>
        </div>
      </section>

      <section className="container">
        <StatsGrid />
      </section>

      <HomeFeatures />
    </main>
  )
}
