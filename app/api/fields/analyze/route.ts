import { NextResponse } from "next/server";
import { Buffer } from "buffer";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

// لتحويل رابط صورة من Supabase إلى data URL
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

// لتحويل ملف صورة (من FormData) إلى data URL
async function fileToDataUrl(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const contentType = file.type || "image/jpeg";
  return `data:${contentType};base64,${base64}`;
}

// برومبت مشترك لتحليل الصور
function buildPrompt(opts: {
  cropType?: string | null;
  fieldName?: string | null;
  farmName?: string | null;
  notes?: string | null;
  last_watering_at?: string | null;
}) {
  const { cropType, fieldName, farmName, notes, last_watering_at } = opts;

  const lastWateringText = last_watering_at
    ? `تاريخ ووقت آخر ري ذكره المزارع: ${last_watering_at}.`
    : "المزارع لم يحدد موعد آخر ري، فاعتمد تقديرًا عامًا لاحتياجات الري بناءً على حالة النبات في الصور ونوع المحصول.";

  return `
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
}

export async function POST(req: Request) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "تعذر تحليل الصور بالذكاء الاصطناعي: مفتاح OPENAI_API_KEY غير موجود في إعدادات البيئة.",
        },
        { status: 500 }
      );
    }

    const contentType = req.headers.get("content-type") || "";

    let dataUrls: string[] = [];
    let cropType: string | null = null;
    let fieldName: string | null = null;
    let farmName: string | null = null;
    let notes: string | null = null;
    let last_watering_at: string | null = null;

    // 🟢 الحالة 1: طلب JSON من صفحة إضافة الحقل (imageUrls من Supabase)
    if (contentType.includes("application/json")) {
      const body = await req.json();

      const imageUrls = body.imageUrls as string[] | undefined;
      cropType = body.cropType || null;
      fieldName = body.fieldName || null;
      farmName = body.farmName || null;
      notes = body.notes || null;
      last_watering_at = body.last_watering_at || null;

      if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
        return NextResponse.json(
          { error: "لم يتم استلام أي صور للتحليل." },
          { status: 400 }
        );
      }

      const limitedUrls: string[] = imageUrls.slice(0, 3);
      for (const url of limitedUrls) {
        const dataUrl = await imageUrlToDataUrl(url);
        dataUrls.push(dataUrl);
      }
    }
    // 🟢 الحالة 2: FormData من صفحة إضافة المزرعة (ملفات مباشرة)
    else if (contentType.startsWith("multipart/form-data")) {
      const formData = await req.formData();
      const files: File[] = [];

      formData.forEach((value, key) => {
        if (key === "images" && value instanceof File) {
          files.push(value);
        }
      });

      cropType = (formData.get("cropType") as string) || null;
      farmName = (formData.get("farmName") as string) || null;
      notes = (formData.get("notes") as string) || null;
      last_watering_at = (formData.get("last_watering_at") as string) || null;
      fieldName = (formData.get("fieldName") as string) || null;

      if (files.length === 0) {
        return NextResponse.json(
          { error: "لم يتم استلام أي صور للتحليل." },
          { status: 400 }
        );
      }

      const limitedFiles = files.slice(0, 3);
      for (const file of limitedFiles) {
        const dataUrl = await fileToDataUrl(file);
        dataUrls.push(dataUrl);
      }
    } else {
      // نوع طلب غير مدعوم
      return NextResponse.json(
        {
          error:
            "نوع الطلب غير مدعوم لتحليل الصور. تأكد أن الطلب JSON أو FormData.",
        },
        { status: 400 }
      );
    }

    // الآن dataUrls جاهزة في الحالتين
    const prompt = buildPrompt({
      cropType,
      fieldName,
      farmName,
      notes,
      last_watering_at,
    });

    const messageContent: any[] = [
      {
        type: "text",
        text: prompt,
      },
      ...dataUrls.map((url) => ({
        type: "image_url",
        image_url: { url },
      })),
    ];

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "user",
            content: messageContent,
          },
        ],
        max_tokens: 800,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("OpenAI error:", aiRes.status, errText);
      return NextResponse.json(
        {
          error: `تعذر تحليل الصور بالذكاء الاصطناعي: ${aiRes.status}، يمكنك المحاولة لاحقًا.`,
        },
        { status: 500 }
      );
    }

    const json: any = await aiRes.json();

    // 🔍 نحاول استخراج النص بأكثر من شكل، ولو ما حصلناه نعرض محتوى الرسالة كـ JSON
    let analysisText: string | undefined;

    const message = json?.choices?.[0]?.message;

    const respContent = message?.content;

    if (typeof respContent === "string") {
      // محتوى نصي مباشر
      analysisText = respContent;
    } else if (Array.isArray(respContent)) {
      // محتوى مصفوفة أجزاء
      const textPart = respContent.find(
        (part: any) => part?.type === "text" && typeof part?.text === "string"
      );
      if (textPart?.text) {
        analysisText = textPart.text;
      }
    } else if (respContent != null) {
      // أي شكل آخر للمحتوى → نطبعه كنص
      analysisText = JSON.stringify(respContent, null, 2);
    } else if (message) {
      analysisText = JSON.stringify(message, null, 2);
    }

    if (!analysisText) {
      analysisText =
        "تم تحليل الصور بنجاح، لكن لم يتم استلام نص واضح من نموذج الذكاء الاصطناعي.";
    }

    return NextResponse.json({ analysis: analysisText });
  } catch (error: any) {
    console.error("AI route unexpected error:", error);

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
