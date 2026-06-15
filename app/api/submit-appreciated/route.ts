import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Basic duplicate check by email
  const { data: existing } = await supabase
    .from('appreciated_submissions')
    .select('id')
    .eq('email', body.email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  const { error } = await supabase.from('appreciated_submissions').insert({
    full_name: body.fullName,
    mobile:    body.mobile,
    email:     body.email,
    ip,
  });

  if (error) {
    console.error('appreciated_submissions insert error:', error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true, duplicate: false });
}
