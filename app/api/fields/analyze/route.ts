import { NextResponse } from "next/server";
import OpenAI from "openai";
import { Buffer } from "buffer";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// دالة لتحويل رابط الصورة إلى data URL (base64)
async function imageUrlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(
      `فشل تحميل الصورة من Supabase: ${res.status} ${res.statusText}`
    );
  }

  const contentType = res.headers.get("content-type") || "image/jpeg";
  const arrayBuffer = await res.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return `data:${contentType};base64,${base64}`;
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "تعذر تحليل الصور بالذكاء الاصطناعي: مفتاح OPENAI_API_KEY غير موجود في إعدادات البيئة.",
        },
        { status: 500 }
      );
    }

    const {
      imageUrls,
      cropType,
      fieldName,
      farmName,
      notes,
      last_watering_at,
    } = await req.json();

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json(
        { error: "لم يتم استلام أي صور للتحليل." },
        { status: 400 }
      );
    }

    // ✅ نستخدم أول صورتين فقط لتقليل الحجم والوقت
    const limitedUrls: string[] = imageUrls.slice(0, 2);

    // نحمل الصور من Supabase ونحوّلها إلى base64
    const dataUrls: string[] = [];
    for (const url of limitedUrls) {
      const dataUrl = await imageUrlToDataUrl(url);
      dataUrls.push(dataUrl);
    }

    const lastWateringText = last_watering_at
      ? `تاريخ ووقت آخر ري ذكره المزارع: ${last_watering_at}.`
      : "المزارع لم يحدد موعد آخر ري، فاعتمد تقديرًا عامًا لاحتياجات الري بناءً على حالة النبات في الصور ونوع المحصول.";

    const userText = `
أنت خبير زراعي يستخدم رؤية حاسوبية لتحليل صور النباتات.

لدينا حقل باسم "${fieldName || ""}" في مزرعة "${farmName || ""}".

نوع المحصول (من إدخال المزارع): ${cropType || "غير محدد"}.
ملاحظات المزارع الإضافية: ${notes || "لا توجد ملاحظات إضافية."}
${lastWateringText}

اعتمد على الصور والبيانات السابقة وقدّم تقريرًا موجزًا باللغة العربية يشمل:

- نوع النبات المحتمل (إن أمكن).
- العمر التقريبي للنبات (شتلة، صغير، متوسط، جاهز حصاد...).
- حالة النبات الصحية (سليم، إجهاد مائي، آفات، أمراض فطرية، نقص عناصر...).
- الأمراض أو الآفات أو نقص العناصر المحتملة (مع ذكر الاحتمال إن كان غير مؤكد).
- توصيات للري بشكل عام (عدد مرات تقريبية في الأسبوع أو وصف مثل: ري خفيف/متوسط/غزير مع توضيح الوقت الأنسب صباحًا أو مساءً).
- توصيات للعلاج (اسم المادة الفعّالة + مثال اسم تجاري إن أمكن).
- أي ملاحظات إضافية مفيدة للمزارع.

اكتب الرد في شكل عناوين وفقرات مرتبة، بدون استخدام اللغة الإنجليزية داخل النص قدر الإمكان.
    `.trim();

    const content: any[] = [
      {
        type: "input_text",
        text: userText,
      },
    ];

    for (const dataUrl of dataUrls) {
      content.push({
        type: "input_image",
        image_url: dataUrl,
      });
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content,
        },
      ],
    });

    const anyRes: any = response;
    const analysis =
      anyRes.output?.[0]?.content?.[0]?.text?.value ||
      anyRes.output_text ||
      "لم يتم الحصول على نص من النموذج. حاول مجددًا لاحقًا.";

    return NextResponse.json({ analysis });
  } catch (error: any) {
    console.error("AI Error:", error);

    const message =
      error?.message ||
      error?.error?.message ||
      "سبب غير معروف من خادم الذكاء الاصطناعي.";

    return NextResponse.json(
      {
        error: `تعذر تحليل الصور بالذكاء الاصطناعي: ${message}`,
      },
      { status: 500 }
    );
  }
}
