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
    utm_source:        body.utmSource   || null,
    utm_medium:        body.utmMedium   || null,
    utm_campaign:      body.utmCampaign || null,
    utm_term:          body.utmTerm     || null,
    utm_content:       body.utmContent  || null,
    page_url:          body.pageUrl     || null,
  };

  const webhookPayload = {
    ...row,
    submitted_at: new Date().toISOString(),
    source: 'apply-form',
  };

  // Comma-separated list of webhook URLs — split, trim, drop empties
  const webhookUrls = (process.env.WEBHOOK_URL_QUIZ || '')
    .split(',')
    .map(u => u.trim())
    .filter(Boolean);

  // Run Supabase insert and all webhooks in parallel
  const [dbResult, ...webhookResults] = await Promise.allSettled([
    supabase.from('car_loan_quiz_submissions').insert(row),
    ...webhookUrls.map(url =>
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      })
    ),
  ]);

  if (dbResult.status === 'rejected' || (dbResult.status === 'fulfilled' && dbResult.value.error)) {
    const msg = dbResult.status === 'rejected'
      ? dbResult.reason
      : dbResult.value.error?.message;
    console.error('car_loan_quiz_submissions insert error:', msg);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  webhookResults.forEach((r, i) => {
    if (r.status === 'rejected') console.error(`webhook delivery failed (${webhookUrls[i]}):`, r.reason);
  });

  return NextResponse.json({ ok: true });
}
