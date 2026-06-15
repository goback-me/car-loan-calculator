import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { error } = await supabase.from('qualify_submissions').insert({
    loan_purpose:           body.loanPurpose,
    loan_amount:            body.loanAmount,
    employment_status:      body.employmentStatus,
    monthly_income:         body.monthlyIncome,
    citizenship_status:     body.citizenshipStatus,
    abn_over_2_years:       body.abnOver2Years,
    gst_registered:         body.gstRegistered,
    credit_score:           body.creditScore,
    has_defaults:           body.hasDefaults,
    defaults_in_payment_plan: body.defaultsInPaymentPlan,
    first_name:             body.firstName,
    last_name:              body.lastName,
    email:                  body.email,
    phone:                  body.phone,
    state:                  body.state,
  });

  if (error) {
    console.error('qualify_submissions insert error:', error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
