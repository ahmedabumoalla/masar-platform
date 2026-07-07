"use client"

import { useState } from "react"
import { AlertTriangle, Download, Droplets, FileText, Gauge, Leaf, PieChart, RefreshCw, TrendingUp } from "lucide-react"

const metrics = [
  { title: "استهلاك المياه", value: "32.4 م³", description: "اليوم", icon: Droplets },
  { title: "متوسط الرطوبة", value: "62%", description: "آخر قراءة", icon: Leaf },
  { title: "الأعطال المكتشفة", value: "3", description: "تحتاج مراجعة", icon: AlertTriangle },
  { title: "كفاءة الري", value: "92%", description: "أداء ممتاز", icon: TrendingUp }
]

const weeklyPerformance = [
  { day: "السبت", value: 68 },
  { day: "الأحد", value: 74 },
  { day: "الاثنين", value: 81 },
  { day: "الثلاثاء", value: 77 },
  { day: "الأربعاء", value: 85 },
  { day: "الخميس", value: 88 },
  { day: "الجمعة", value: 92 }
]

const alerts = [
  { title: "انخفاض رطوبة التربة", text: "المنطقة الشمالية تحتاج ري خلال ساعتين", status: "متوسط", tone: "blue" },
  { title: "ارتفاع استهلاك المياه", text: "زيادة 12% عن المعدل الطبيعي", status: "مهم", tone: "orange" },
  { title: "تأخر جدولة الري", text: "لم يتم تنفيذ مهمة الري المجدولة", status: "مراجعة", tone: "gray" },
  { title: "اتصال الجهاز مستقر", text: "آخر مزامنة تمت بنجاح", status: "مستقر", tone: "green" }
]

const reportRows = [
  { date: "2024/05/20", type: "تقرير الري", farm: "مزرعة الوادي الأخضر", status: "مكتمل" },
  { date: "2024/05/18", type: "تقرير الأعطال", farm: "مزرعة الوادي الأخضر", status: "قيد المراجعة" },
  { date: "2024/05/15", type: "تقرير التربة", farm: "مزرعة الوادي الأخضر", status: "مكتمل" },
  { date: "2024/05/12", type: "تقرير استهلاك المياه", farm: "مزرعة الوادي الأخضر", status: "مكتمل" }
]

export default function ReportsPageView() {
  const [updated, setUpdated] = useState(false)

  return (
    <main className="reportsPage">
      <div className="container reportsContainer">
        <header className="reportsHeader">
          <div>
            <h1>التقارير</h1>
            <p>تابع تقارير مزرعتك وقراءات جهاز مسار وتحليلات الأداء من مكان واحد.</p>
          </div>
          <span className="reportsUpdateBadge">آخر تحديث: اليوم 09:20 ص</span>
        </header>

        <section className="reportsMetrics" aria-label="مؤشرات التقارير">
          {metrics.map(({ title, value, description, icon: Icon }) => (
            <article className="reportsCard reportsMetricCard" key={title}>
              <span className="reportsIconBubble"><Icon size={28} /></span>
              <div>
                <h2>{title}</h2>
                <strong>{value}</strong>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="reportsMainGrid">
          <article className="reportsCard reportsChartCard">
            <div className="reportsSectionHead">
              <h2><PieChart size={23} /> تقرير الأداء الأسبوعي</h2>
              <span>كفاءة الري</span>
            </div>
            <div className="reportsBars" aria-label="رسم الأداء الأسبوعي">
              {weeklyPerformance.map((item) => (
                <div className="reportsBarItem" key={item.day}>
                  <strong>{item.value}%</strong>
                  <span style={{ height: `${item.value}%` }} />
                  <p>{item.day}</p>
                </div>
              ))}
            </div>
            <div className="reportsChartSummary">
              <Gauge size={20} />
              تحسن الأداء بنسبة 18% مقارنة بالأسبوع الماضي.
            </div>
          </article>

          <article className="reportsCard reportsAlertsCard">
            <div className="reportsSectionHead">
              <h2><AlertTriangle size={23} /> ملخص التنبيهات</h2>
            </div>
            <div className="reportsAlertsList">
              {alerts.map((alert) => (
                <div className="reportsAlertItem" key={alert.title}>
                  <div>
                    <h3>{alert.title}</h3>
                    <p>{alert.text}</p>
                  </div>
                  <span className={`reportsStatus ${alert.tone}`}>{alert.status}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="reportsCard reportsTableCard">
          <div className="reportsSectionHead">
            <h2><FileText size={23} /> سجل التقارير</h2>
          </div>
          <div className="reportsTableWrap">
            <table className="reportsTable">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>نوع التقرير</th>
                  <th>المزرعة</th>
                  <th>الحالة</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.map((row) => (
                  <tr key={`${row.date}-${row.type}`}>
                    <td>{row.date}</td>
                    <td>{row.type}</td>
                    <td>{row.farm}</td>
                    <td><span className={`reportsTableStatus ${row.status === "مكتمل" ? "done" : "review"}`}>{row.status}</span></td>
                    <td><button className="reportsViewButton" type="button">عرض التقرير</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="reportsActions">
          <button
            className="reportsPrimaryAction"
            type="button"
            onClick={() => {
              setUpdated(true)
              window.setTimeout(() => setUpdated(false), 1800)
            }}
          >
            <RefreshCw size={21} />
            تحديث التقارير
          </button>
          <button className="reportsSecondaryAction" type="button"><Download size={21} /> تصدير CSV</button>
          <button className="reportsSecondaryAction" type="button"><FileText size={21} /> تصدير PDF</button>
        </div>

        {updated ? <p className="reportsToast">تم تحديث التقارير بنجاح</p> : null}
      </div>
    </main>
  )
}
