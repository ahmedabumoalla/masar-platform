import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { imageUrl, cropCategory } = body as {
      imageUrl?: string;
      cropCategory?: string;
    };

    if (!imageUrl || !cropCategory) {
      return new Response(
        JSON.stringify({
          error: "البيانات غير مكتملة (الصورة أو نوع المحصول مفقود).",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "أنت مستشار زراعي ذكي متخصص في محاصيل المملكة العربية السعودية. حلّل صورة النبات وحدد المشكلة المحتملة، ثم قدم توصيات عملية للري والتسميد ومكافحة الآفات. أجب بصيغة JSON فقط بدون أي شرح خارجي.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `حلل هذه الصورة لنبات من فئة: "${cropCategory}". 
أعطني:
- diagnosis_ar: وصف مختصر بالعربية للحالة (مرض / آفة / إجهاد / نقص عناصر / سليم).
- diagnosis_en: نفس الوصف بالإنجليزية.
- confidence: رقم بين 0 و 1 يدل على درجة الثقة.
- recommendations_ar: خطة عمل مختصرة بالعربية تشمل:
   - ما الذي يبدو أنه يحدث للنبات
   - إن كان يلزم تقليل أو زيادة الري
   - إن كان هناك تسميد مقترح (نوع عام مثل NPK أو سماد عضوي) بدون ذكر أسماء تجارية
   - تنبيه بضرورة استشارة مرشد زراعي محلي قبل التنفيذ
- recommendations_en: نفس التوصيات بالإنجليزية.`,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      response_format: {
        type: "json_object",
      },
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      throw new Error("نموذج الذكاء الاصطناعي لم يرجع محتوى.");
    }

    let parsed: {
      diagnosis_ar: string;
      diagnosis_en: string;
      confidence?: number;
      recommendations_ar: string;
      recommendations_en: string;
    };

    try {
      parsed = JSON.parse(rawContent);
    } catch (err) {
      console.error("JSON parse error:", err, rawContent);
      throw new Error("تعذر قراءة استجابة نموذج الذكاء الاصطناعي.");
    }

    const {
      diagnosis_ar,
      diagnosis_en,
      recommendations_ar,
      recommendations_en,
      confidence,
    } = parsed;

    return new Response(
      JSON.stringify({
        diagnosis_ar,
        diagnosis_en,
        recommendations_ar,
        recommendations_en,
        confidence:
          typeof confidence === "number"
            ? Math.min(Math.max(confidence, 0), 1)
            : null,
        raw_model: parsed,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("assistant/inspect error:", err);
    return new Response(
      JSON.stringify({
        error:
          "حدث خطأ أثناء تحليل الصورة بالذكاء الاصطناعي، حاول مرة أخرى لاحقاً.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
