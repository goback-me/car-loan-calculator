import { NextRequest, NextResponse } from 'next/server';

// ── Redirect URLs ─────────────────────────────────────────────
// Update BAD_URL once the second landing page is live
const DISQUALIFY_URL = 'https://tryrevvy.com.au/appreciated/';
const GOOD_URL       = 'https://tryrevvy.com.au/thank-you-appreciated/';
const BAD_URL        = 'https://tryrevvy.com.au/thank-you/';

type Quality = 'disqualify' | 'bad' | 'good';

type Body = Record<string, string | number | boolean>;

const GOOD_INCOME = new Set(['50-70k', '70-90k', '90k+']);

function classify(b: Body): Quality {
  const employment    = String(b.employment    ?? '');
  const annualIncome  = String(b.annualIncome  ?? '');
  const residency     = String(b.residency     ?? '');
  const creditHistory = String(b.creditHistory ?? '');
  const gstRegistered = String(b.gstRegistered ?? '');
  const gstVerified   = String(b.gstVerified   ?? '');
  const hasDefaults   = String(b.hasDefaults   ?? '');
  const inPaymentPlan = String(b.inPaymentPlan ?? '');
  const purchasePrice = Number(b.purchasePrice ?? 0);

  // ── DISQUALIFY ───────────────────────────────────────────────
  // Retired or Centrelink
  if (employment === 'retired-centrelink') return 'disqualify';
  // Income too low
  if (annualIncome === 'under30k') return 'disqualify';
  // Visa holder
  if (residency === 'visa') return 'disqualify';
  // ABN < 2 years old — disqualify
  if (employment === 'abn' && gstVerified === 'no') return 'disqualify';
  // Has defaults and NOT in a payment plan
  if (hasDefaults === 'yes' && inPaymentPlan === 'no') return 'disqualify';

  // ── BAD QUALITY LEAD ─────────────────────────────────────────
  // ABN but not GST registered
  if (employment === 'abn' && gstRegistered === 'no') return 'bad';
  // Casual or Part-Time employment
  if (employment === 'casual-parttime') return 'bad';
  // Income between $30k–$50k
  if (annualIncome === '30-50k') return 'bad';
  // Permanent Resident (not full citizen)
  if (residency === 'pr') return 'bad';
  // Bad credit history
  if (creditHistory === 'bad') return 'bad';
  // Has defaults and IS in a payment plan
  if (hasDefaults === 'yes' && inPaymentPlan === 'yes') return 'bad';
  // Purchase price under $20k
  if (purchasePrice < 20000) return 'bad';
  // Income not in good range
  if (!GOOD_INCOME.has(annualIncome)) return 'bad';

  // ── GOOD LEAD ────────────────────────────────────────────────
  return 'good';
}

export async function POST(req: NextRequest) {
  const body: Body = await req.json();
  const quality    = classify(body);

  const params = new URLSearchParams({
    vehicleType:      String(body.vehicleType      ?? ''),
    vehicleCondition: String(body.vehicleCondition ?? ''),
    purchasePrice:    String(body.purchasePrice    ?? ''),
    employment:       String(body.employment       ?? ''),
    annualIncome:     String(body.annualIncome     ?? ''),
    residency:        String(body.residency        ?? ''),
    creditHistory:    String(body.creditHistory    ?? ''),
    state:            String(body.state            ?? ''),
    fullName:         String(body.fullName         ?? ''),
    mobile:           String(body.mobile           ?? ''),
    email:            String(body.email            ?? ''),
    quality,
  });

  const base = quality === 'disqualify' ? DISQUALIFY_URL
             : quality === 'good'       ? GOOD_URL
             :                           BAD_URL;

  return NextResponse.json({ quality, redirectUrl: `${base}?${params.toString()}` });
}
