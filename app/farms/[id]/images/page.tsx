"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type FieldImage = {
  id: string;
  image_url: string;
  ai_status: string | null;
  ai_notes: string | null;
};

export default function FieldImagesPage() {
  const params = useParams();
  const fieldId = params?.id as string;

  const [images, setImages] = useState<FieldImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("field_images")
        .select("*")
        .eq("field_id", fieldId)
        .order("created_at", { ascending: false });
      if (error) setErrorMsg("تعذر تحميل الصور.");
      else setImages(data || []);
      setLoading(false);
    };
    if (fieldId) load();
  }, [fieldId]);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${fieldId}-${Date.now()}.${fileExt}`;
    const filePath = `field-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("masar-images")
      .upload(filePath, file);

    if (uploadError) {
      setErrorMsg("تعذر رفع الصورة.");
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("masar-images")
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData?.publicUrl;

    const { error: insertError } = await supabase.from("field_images").insert([
      {
        field_id: fieldId,
        image_url: publicUrl,
      },
    ]);

    setUploading(false);
    if (insertError) {
      setErrorMsg("تم رفع الصورة لكن تعذر حفظها في قاعدة البيانات.");
      return;
    }

    const { data } = await supabase
      .from("field_images")
      .select("*")
      .eq("field_id", fieldId)
      .order("created_at", { ascending: false });
    setImages(data || []);
  };

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-gradient-to-b from-[#020617] via-[#020617] to-black text-white">
        <div className="rounded-3xl bg-black/70 border border-white/10 px-6 py-4 text-sm text-white/70">
          يتم تحميل الصور...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-[#020617] via-[#020617] to-black text-white">
      <div className="mx-auto max-w-4xl px-4 pt-10 pb-16 space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold mb-1">
            صور الحقل وتحليلات الذكاء الاصطناعي
          </h1>
          <p className="text-xs md:text-sm text-white/60">
            ارفع صورًا للنباتات في هذا الحقل، وسيتم تحليلها لاحقًا لاكتشاف
            الأمراض واقتراح جداول ري.
          </p>
        </div>

        {errorMsg && (
          <p className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/40 rounded-xl px-3 py-2">
            {errorMsg}
          </p>
        )}

        <div className="rounded-3xl bg-black/60 border border-white/10 p-4 space-y-3 text-sm">
          <p className="text-xs text-white/70 mb-2">
            اختر صورة من جهازك (يُفضّل أن تكون واضحة وقريبة من النبات):
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="text-xs"
          />
          {uploading && (
            <p className="text-[11px] text-white/60 mt-1">
              جاري رفع الصورة...
            </p>
          )}
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {images.length === 0 ? (
            <p className="text-[11px] text-white/60">
              لا توجد صور بعد. ارفع أول صورة لبدء التحليل لاحقًا.
            </p>
          ) : (
            images.map((img) => (
              <div
                key={img.id}
                className="rounded-2xl bg-black/60 border border-white/10 overflow-hidden"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.image_url}
                  alt="صورة حقل"
                  className="w-full h-40 object-cover"
                />
                <div className="p-3 space-y-1">
                  <p className="text-[11px] text-white/60">
                    حالة الذكاء الاصطناعي:{" "}
                    <span className="text-emerald-300">
                      {img.ai_status || "بإنتظار الربط بالموديل"}
                    </span>
                  </p>
                  <p className="text-[11px] text-white/60">
                    {img.ai_notes ||
                      "سيتم لاحقًا تخزين ملاحظات الموديل واقتراحات الري هنا."}
                  </p>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
