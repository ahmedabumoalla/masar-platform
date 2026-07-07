"use client"

import { useState } from "react"
import { BookOpen, CheckCircle2, ChevronDown, Headphones, Link as LinkIcon, LockKeyhole, QrCode, Wifi } from "lucide-react"

const guideSteps = [
  "شغل الجهاز وتأكد من ظهور الكود على الشاشة",
  "أدخل الكود كما هو موضح على الجهاز",
  "اضغط على ربط الجهاز لبدء المزامنة"
]

const progressSteps = [
  { number: "1", label: "تشغيل الجهاز", active: true },
  { number: "2", label: "إدخال الكود", active: true },
  { number: "3", label: "تأكيد الربط", active: false }
]

export default function ConnectDevicePageView() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <main className="connectDevicePage">
      <div className="container connectDeviceContainer">
        <header className="connectDeviceHeader">
          <h1>ربط الجهاز</h1>
          <p>أدخل الكود الظاهر على جهاز مسار لإضافته وربطه بمزرعتك بسهولة وأمان.</p>
        </header>

        <div className="connectDeviceGrid">
          <aside className="connectDeviceAside">
            <section className="connectCard connectDevicePreview">
              <Wifi className="connectWifiIcon" size={48} strokeWidth={1.9} />
              <img src="/masar-device.svg" alt="جهاز مسار الذكي" className="connectDeviceImage" />

              <div className="connectInfoRows">
                <DeviceInfoRow icon={<QrCode size={23} />} label="كود الجهاز:" value="MAS-48291" strong />
                <DeviceInfoRow icon={<CheckCircle2 size={25} />} label="الحالة:" value="جاهز للربط" success />
                <DeviceInfoRow icon={<Wifi size={25} />} label="الاتصال:" value="نشط" blue />
              </div>
            </section>

            <section className="connectCard connectGuideCard">
              <h2><BookOpen size={27} /> طريقة الربط</h2>
              <div className="connectGuideSteps">
                {guideSteps.map((step, index) => (
                  <div className="connectGuideStep" key={step}>
                    <span>{index + 1}</span>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          <section className="connectCard connectFormCard">
            <div className="connectStepper" aria-label="خطوات ربط الجهاز">
              {progressSteps.map((step, index) => (
                <div className="connectStepItem" key={step.number}>
                  <div className="connectStepTop">
                    <span className={step.active ? "active" : ""}>{step.number}</span>
                    {index < progressSteps.length - 1 ? <i aria-hidden="true" /> : null}
                  </div>
                  <strong>{step.label}</strong>
                </div>
              ))}
            </div>

            <form
              className="connectForm"
              onSubmit={(event) => {
                event.preventDefault()
                setSubmitted(true)
              }}
            >
              <label className="connectField">
                <span>كود الجهاز <b>*</b></span>
                <div className="connectInputWrap">
                  <QrCode size={23} />
                  <input value="MAS-48291" readOnly />
                </div>
              </label>

              <label className="connectField">
                <span>اسم المزرعة <b>*</b></span>
                <div className="connectInputWrap">
                  <ChevronDown size={22} />
                  <select defaultValue="مزرعة الوادي الأخضر">
                    <option>مزرعة الوادي الأخضر</option>
                  </select>
                </div>
              </label>

              <label className="connectField">
                <span>اسم الجهاز <b>*</b></span>
                <div className="connectInputWrap">
                  <input placeholder="مثال: جهاز الري الرئيسي" />
                </div>
              </label>

              <label className="connectSync">
                <input type="checkbox" defaultChecked />
                <span>
                  <strong>تفعيل المزامنة التلقائية</strong>
                  <small>سيتم مزامنة البيانات تلقائيا مع حسابك في مسار</small>
                </span>
              </label>

              <button className="connectPrimaryButton" type="submit">
                ربط الجهاز الآن
                <LinkIcon size={22} />
              </button>

              <button className="connectSecondaryButton" type="button">
                الحصول على مساعدة
                <Headphones size={23} />
              </button>

              {submitted ? <p className="connectSuccessMessage">تم إرسال طلب ربط الجهاز بنجاح</p> : null}

              <p className="connectSecureText">
                <LockKeyhole size={18} />
                يتم الربط بشكل آمن ومباشر مع حسابك في مسار
              </p>
            </form>
          </section>
        </div>
      </div>
    </main>
  )
}

function DeviceInfoRow({ icon, label, value, strong, success, blue }: { icon: React.ReactNode; label: string; value: string; strong?: boolean; success?: boolean; blue?: boolean }) {
  return (
    <div className="connectInfoRow">
      <span className="connectInfoIcon">{icon}</span>
      <span className="connectInfoLabel">{label}</span>
      <strong className={`${strong ? "isStrong" : ""} ${success ? "isSuccess" : ""} ${blue ? "isBlue" : ""}`}>{value}</strong>
    </div>
  )
}
