import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { error } = await supabase.from('apply_submissions').insert({
    vehicle:      body.vehicle,
    borrow_amount: body.borrowAmount,
    employment:   body.employment,
    income:       body.income,
    citizenship:  body.citizenship,
    credit_score: body.creditScore,
    first_name:   body.firstName,
    last_name:    body.lastName,
    email:        body.email,
    phone:        body.phone,
    state:        body.state,
  });

  if (error) {
    console.error('apply_submissions insert error:', error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
