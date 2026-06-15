import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  const row = {
    vehicle_type:      body.vehicleType,
    vehicle_condition: body.vehicleCondition,
    purchase_price:    body.purchasePrice,
    employment:        body.employment,
    gst_registered:    body.gstRegistered,
    gst_verified:      body.gstVerified,
    annual_income:     body.annualIncome,
    residency:         body.residency,
    credit_history:    body.creditHistory,
    has_defaults:      body.hasDefaults,
    in_payment_plan:   body.inPaymentPlan,
    state:             body.state,
    full_name:         body.fullName,
    mobile:            body.mobile,
    email:             body.email,
    ip,
  };

  const webhookPayload = {
    ...row,
    submitted_at: new Date().toISOString(),
    source: 'car-loan-calculator',
  };

  // Run Supabase insert and webhook in parallel
  const [dbResult, webhookResult] = await Promise.allSettled([
    supabase.from('apply_submissions').insert(row),
    process.env.WEBHOOK_URL
      ? fetch(process.env.WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload),
        })
      : Promise.resolve(null),
  ]);

  if (dbResult.status === 'rejected' || (dbResult.status === 'fulfilled' && dbResult.value.error)) {
    const msg = dbResult.status === 'rejected'
      ? dbResult.reason
      : dbResult.value.error?.message;
    console.error('apply_submissions insert error:', msg);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  if (webhookResult.status === 'rejected') {
    console.error('webhook delivery failed:', webhookResult.reason);
  }

  return NextResponse.json({ ok: true });
}
