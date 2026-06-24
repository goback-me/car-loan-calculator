import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  const row = {
    loan_amount:       body.loanAmt,
    current_rate:      body.currentRate,
    remaining_balance: body.remBal,
    remaining_term:    body.remTerm,
    loan_source:       body.loanSource,
    employment:        body.employment,
    income:            body.income,
    state:             body.state,
    first_name:        body.firstName,
    last_name:         body.lastName,
    phone:             body.phone,
    email:             body.email,
    savings:           body.savings,
    monthly_diff:      body.monthlyDiff,
    grade:             body.grade,
    grade_label:       body.gradeLabel,
    market_rate:       body.marketRate,
    rate_gap:          body.rateGap,
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
    source: 'rate-roast-calculator',
  };

  // Run Supabase insert and webhook in parallel
  const [dbResult, webhookResult] = await Promise.allSettled([
    supabase.from('calculator_submissions').insert(row),
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
    console.error('calculator_submissions insert error:', msg);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  if (webhookResult.status === 'rejected') {
    console.error('webhook delivery failed:', webhookResult.reason);
  }

  return NextResponse.json({ ok: true });
}
