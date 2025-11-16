// app/api/farms/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// نوع البيانات اللي راح نستقبلها من الفورم
type CreateFarmBody = {
  name: string;
  area?: number | null;
  latitude?: number | null;
  longitude?: number | null;
};

export async function GET() {
  const { data, error } = await supabase
    .from('farms')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase GET error:', error);
    return NextResponse.json(
      { message: 'حدث خطأ أثناء جلب المزارع', error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateFarmBody;

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { message: 'اسم المزرعة مطلوب' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('farms')
      .insert([
        {
          name: body.name,
          area: body.area ?? null,
          latitude: body.latitude ?? null,
          longitude: body.longitude ?? null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase POST error:', error);
      return NextResponse.json(
        { message: 'حدث خطأ أثناء حفظ المزرعة', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/farms error:', err);
    return NextResponse.json(
      { message: 'طلب غير صالح', error: err?.message },
      { status: 400 }
    );
  }
}
