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
    utm_adset:         body.utmAdset    || null,
    utm_ad:            body.utmAd       || null,
    lead_source:       body.leadSource  || null,
    campaign:          body.campaign    || null,
    adset:             body.adset       || null,
    ad_name:           body.adName      || null,
    page_url:          body.pageUrl     || null,
  };

  const webhookPayload = {
    ...row,
    submitted_at: new Date().toISOString(),
    source: 'rate-roast-calculator',
  };

  // Comma-separated list of webhook URLs — split, trim, drop empties
  const webhookUrls = (process.env.WEBHOOK_URL || '')
    .split(',')
    .map(u => u.trim())
    .filter(Boolean);

  // Run Supabase insert and all webhooks in parallel
  const [dbResult, ...webhookResults] = await Promise.allSettled([
    supabase.from('calculator_submissions').insert(row),
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
    console.error('calculator_submissions insert error:', msg);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  webhookResults.forEach((r, i) => {
    if (r.status === 'rejected') console.error(`webhook delivery failed (${webhookUrls[i]}):`, r.reason);
  });

  return NextResponse.json({ ok: true });
}
