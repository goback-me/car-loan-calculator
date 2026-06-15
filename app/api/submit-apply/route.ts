import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { error } = await supabase.from('apply_submissions').insert({
    vehicle_type:      body.vehicleType,
    vehicle_condition: body.vehicleCondition,
    purchase_price:    body.purchasePrice,
    employment:        body.employment,
    gst_registered:    body.gstRegistered,
    gst_verified:      body.gstVerified,
    annual_income:     body.annualIncome,
    residency:         body.residency,
    credit_history:    body.creditHistory,
    state:             body.state,
    full_name:         body.fullName,
    mobile:            body.mobile,
    email:             body.email,
    is_low_quality:    body.isLowQualityLead,
  });

  if (error) {
    console.error('apply_submissions insert error:', error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
