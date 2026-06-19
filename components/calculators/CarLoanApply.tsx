'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

/* ── DATA ── */
const TOTAL_STEPS = 9; // Name/Mobile/Email combined into one contact step

const vehicleTypes = [
  { id: 'car',            img: '/car.png',        label: 'Car' },
  { id: 'suv',            img: '/suv.png',        label: 'SUV' },
  { id: 'ute-commercial', img: '/commercial.png', label: 'Ute / Commercial' },
  { id: 'ev',             img: '/ev.png',         label: 'EV' },
];

const employmentTypes = [
  { id: 'full-time',          emoji: '💼', label: 'Full-Time' },
  { id: 'casual-parttime',    emoji: '⏰', label: 'Casual / Part-Time' },
  { id: 'retired-centrelink', emoji: '🏖️', label: 'Retired / Centrelink' },
  { id: 'abn',                emoji: '🧾', label: 'ABN / Self-Employed' },
];

const residencyOptions = [
  { id: 'citizen', emoji: '',    img: '/australia-flag..png', label: 'Australian Citizen' },
  { id: 'pr',      emoji: '🏠',  img: '',                     label: 'Permanent Resident' },
  { id: 'visa',    emoji: '✈️',  img: '',                     label: 'Visa Holder' },
];

const creditOptions = [
  { id: 'good',      emoji: '⭐', label: 'Good' },
  { id: 'average',   emoji: '📊', label: 'Average' },
  { id: 'bad',       emoji: '⚠️', label: 'Bad' },
  { id: 'dont-know', emoji: '🤷', label: "Don't Know" },
];

const AU_STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

const LOADING_MSGS = [
  'Matching you with lenders...',
  'Checking your eligibility...',
  'Comparing 20+ lenders...',
  'Preparing your personalised results...',
];

const MIN_PRICE = 10000;
const MAX_PRICE = 200000;

/* ── TYPES ── */
interface FormState {
  vehicleType: string;
  vehicleCondition: string;
  purchasePrice: number;
  employment: string;
  gstRegistered: string;
  gstVerified: string;
  annualIncome: string;
  residency: string;
  creditHistory: string;
  hasDefaults: string;   // from credit popup: 'yes' | 'no'
  inPaymentPlan: string; // from credit popup: 'yes' | 'no' (when hasDefaults = 'yes')
  state: string;
  fullName: string;
  mobile: string;
  email: string;
}

const EMPTY_FORM: FormState = {
  vehicleType: '', vehicleCondition: '', purchasePrice: 30000,
  employment: '', gstRegistered: '', gstVerified: '', annualIncome: '',
  residency: '', creditHistory: '', hasDefaults: '', inPaymentPlan: '',
  state: '', fullName: '', mobile: '', email: '',
};

/* ── Shared disqualify helper — redirects the top frame ── */
function goAppreciated() {
  // try { localStorage.setItem('car_loan_disqualified', '1'); } catch {} // re-entry lock disabled
  (window.top || window).location.href = '/appreciated';
}

/* ── MAIN ── */
export default function CarLoanApply() {
  const [step, setStep]                 = useState(0);
  const [animDir, setAnimDir]           = useState<'forward' | 'back'>('forward');
  const [isAnimating, setIsAnimating]   = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [form, setForm]                 = useState<FormState>(EMPTY_FORM);
  const [showGSTPopup, setShowGSTPopup]       = useState(false);
  const [showCreditPopup, setShowCreditPopup] = useState(false);
  const [contactErrors, setContactErrors]     = useState<Partial<Record<'fullName'|'mobile'|'email', string>>>({});

  // Explicit resize ping on every step/popup state change — belt-and-suspenders
  // alongside the global IframeResizer MutationObserver.
  useEffect(() => {
    if (typeof window === 'undefined' || window === window.parent) return;
    const height = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
    );
    window.parent.postMessage({ type: 'calculator-resize', height }, '*');
  }, [step, showGSTPopup, showCreditPopup, isLoading]);

  // Re-entry lock disabled — uncomment to block disqualified users from re-opening the form
  // useEffect(() => {
  //   function checkDisqualified() {
  //     try {
  //       if (localStorage.getItem('car_loan_disqualified') === '1') {
  //         (window.top || window).location.href = '/appreciated';
  //       }
  //     } catch {}
  //   }
  //   checkDisqualified();
  //   window.addEventListener('pageshow', checkDisqualified);
  //   return () => window.removeEventListener('pageshow', checkDisqualified);
  // }, []);

  const set = useCallback(<K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm(f => ({ ...f, [key]: val })), []);

  const goNext = useCallback(() => {
    setAnimDir('forward');
    setIsAnimating(true);
    setTimeout(() => { setStep(s => s + 1); setIsAnimating(false); }, 200);
  }, []);

  const goBack = useCallback(() => {
    setAnimDir('back');
    setIsAnimating(true);
    setTimeout(() => { setStep(s => s - 1); setIsAnimating(false); }, 200);
  }, []);

  const pick = useCallback(<K extends keyof FormState>(key: K, val: FormState[K]) => {
    // ── Instant disqualifiers — no point collecting more data ──
    if (key === 'employment' && val === 'retired-centrelink') {
      goAppreciated();
      return;
    }
    if (key === 'annualIncome' && val === 'under30k') {
      goAppreciated();
      return;
    }
    if (key === 'residency' && val === 'visa') {
      goAppreciated();
      return;
    }

    // ── Popups that collect extra data (API decides from here) ──
    if (key === 'employment' && val === 'abn') {
      setForm(f => ({ ...f, [key]: val }));
      setShowGSTPopup(true);
      return;
    }
    if (key === 'creditHistory' && val === 'bad') {
      setForm(f => ({ ...f, [key]: val }));
      setShowCreditPopup(true);
      return;
    }

    // ── Everything else: store and advance immediately ──
    setForm(f => ({ ...f, [key]: val }));
    setAnimDir('forward');
    setIsAnimating(true);
    setTimeout(() => { setStep(s => s + 1); setIsAnimating(false); }, 200);
  }, []);

  async function handleContactSubmit() {
    const errs: Partial<Record<'fullName'|'mobile'|'email', string>> = {};
    if (!form.fullName.trim())                              errs.fullName = 'Please enter your full name';
    if (form.mobile.replace(/\D/g,'').length < 8)          errs.mobile   = 'Please enter a valid mobile number';
    if (!form.email || !form.email.includes('@'))           errs.email    = 'Please enter a valid email address';
    setContactErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsLoading(true);

    // Save submission (fire-and-forget)
    fetch('/api/submit-apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).catch(() => {});

    // Classify lead server-side to get the correct redirect URL
    const res = await fetch('/api/classify-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).catch(() => null);

    const { redirectUrl } = (res?.ok ? await res.json() : null) ?? {
      redirectUrl: 'https://aizall53.sg-host.com/result/',
    };

    setTimeout(() => {
      (window.top || window).location.href = redirectUrl;
    }, 2200);
  }

  const progress = useMemo(() => ((step + 1) / TOTAL_STEPS) * 100, [step]);

  const onCreditComplete = useCallback((hasDefaults: string, inPaymentPlan: string) => {
    setForm(f => ({ ...f, hasDefaults, inPaymentPlan }));
    setShowCreditPopup(false);
    goNext();
  }, [goNext]);

  const onGSTComplete = useCallback((gstRegistered: string, gstVerified: string) => {
    setForm(f => ({ ...f, gstRegistered, gstVerified }));
    setShowGSTPopup(false);
    goNext();
  }, [goNext]);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="w-full bg-white">
      <div className="w-full bg-white overflow-hidden">

        <div className="h-[2px] bg-gradient-to-r from-[#008D3B] to-[#00b84d]" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5">
          <span className="inline-flex items-center bg-[#008D3B] text-white rounded-full px-3 py-1 text-[10px] sm:text-[11px] font-bold tracking-widest uppercase">
            Find My Best Rate
          </span>
        </div>

        {/* Progress bar */}
        <div className="mx-4 sm:mx-6 mt-3 h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full rounded-full transition-[width] duration-500 ease-out relative overflow-hidden"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #005c26, #008D3B 60%, #00e064)',
              boxShadow: '0 0 8px rgba(0,141,59,0.55)',
            }}
          >
            {/* shimmer sweep */}
            <span
              className="absolute inset-0 animate-[shimmer_1.6s_linear_infinite]"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)',
              }}
            />
          </div>
        </div>

        {/* Animated step content */}
        <div className="overflow-hidden">
          <div
            className="transition-[opacity,transform] duration-[250ms] ease-in-out"
            style={{
              opacity: isAnimating ? 0 : 1,
              transform: isAnimating
                ? (animDir === 'forward' ? 'translateX(-14px)' : 'translateX(14px)')
                : 'translateX(0)',
            }}
          >
            {step === 0 && (
              <StepVehicleType selected={form.vehicleType} onSelect={v => pick('vehicleType', v)} />
            )}
            {step === 1 && (
              <StepVehicleCondition selected={form.vehicleCondition} onSelect={v => pick('vehicleCondition', v)} onBack={goBack} />
            )}
            {step === 2 && (
              <StepPurchasePrice value={form.purchasePrice} onChange={v => set('purchasePrice', v)} onNext={goNext} onBack={goBack} />
            )}
            {step === 3 && (
              <StepEmployment selected={form.employment} onSelect={v => pick('employment', v)} onBack={goBack} />
            )}
            {step === 4 && (
              <StepAnnualIncome selected={form.annualIncome} onSelect={v => pick('annualIncome', v)} onBack={goBack} />
            )}
            {step === 5 && (
              <StepResidency selected={form.residency} onSelect={v => pick('residency', v)} onBack={goBack} />
            )}
            {step === 6 && (
              <StepCreditHistory selected={form.creditHistory} onSelect={v => pick('creditHistory', v)} onBack={goBack} />
            )}
            {step === 7 && (
              <StepState selected={form.state} onSelect={v => pick('state', v)} onBack={goBack} />
            )}
            {step === 8 && (
              <StepContact
                form={form}
                set={(k: keyof FormState, v: string) => set(k, v as FormState[typeof k])}
                errors={contactErrors}
                onSubmit={handleContactSubmit}
                onBack={goBack}
              />
            )}
          </div>
        </div>
      </div>

      {/* Credit Popup — collects defaults data; API decides qualification */}
      {showCreditPopup && (
        <CreditPopup onComplete={onCreditComplete} />
      )}

      {/* GST Popup — collects GST data; API decides qualification */}
      {showGSTPopup && (
        <GSTPopup onComplete={onGSTComplete} />
      )}
    </div>
  );
}

/* ── STEP 0: VEHICLE TYPE ── */
function StepVehicleType({ selected, onSelect }: { selected: string; onSelect: (v: string) => void }) {
  return (
    <div className="px-4 sm:px-6 py-5 sm:py-6">
      <StepHeader title="What type of vehicle are you looking to buy?" sub="Select the vehicle type you want to finance" />
      <div className="grid grid-cols-2 gap-3">
        {vehicleTypes.map(v => (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v.id)}
            className={cn(
              'group flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center cursor-pointer transition-all duration-150',
              selected === v.id
                ? 'border-[#008D3B] bg-[#ecfdf5] shadow-sm ring-1 ring-[#008D3B]/30'
                : 'border-gray-200 bg-white hover:border-[#008D3B] hover:bg-[#f0fdf4]',
            )}
          >
            <img
              src={v.img}
              alt={v.label}
              loading="eager"
              fetchPriority="high"
              className={cn(
                'w-28 h-28 object-contain transition-all duration-200',
                selected === v.id ? 'scale-105' : 'group-hover:scale-110',
              )}
            />
            <span className="text-[15px] font-semibold text-slate-800">{v.label}</span>
          </button>
        ))}
      </div>
      <p className="text-center text-[11px] text-gray-400 mt-4">No credit check. Free service.</p>
    </div>
  );
}

/* ── STEP 1: NEW OR USED ── */
function StepVehicleCondition({ selected, onSelect, onBack }: { selected: string; onSelect: (v: string) => void; onBack: () => void }) {
  return (
    <div className="px-4 sm:px-6 py-5 sm:py-6">
      <StepHeader title="Is the vehicle New or Used?" sub="This helps us find the right lenders for your situation" />
      <div className="grid grid-cols-2 gap-3">
        {[
          { id: 'new',  img: '/new-car.png', label: 'New' },
          { id: 'used', img: '/old-car.png', label: 'Used' },
        ].map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(opt.id)}
            className={cn(
              'group flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center cursor-pointer transition-all duration-150',
              selected === opt.id
                ? 'border-[#008D3B] bg-[#ecfdf5] shadow-sm ring-1 ring-[#008D3B]/30'
                : 'border-gray-200 bg-white hover:border-[#008D3B] hover:bg-[#f0fdf4]',
            )}
          >
            <img
              src={opt.img}
              alt={opt.label}
              className={cn(
                'w-28 h-28 object-contain transition-all duration-200',
                selected === opt.id ? 'scale-105' : 'group-hover:scale-110',
              )}
            />
            <span className="text-[15px] font-semibold text-slate-800">{opt.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-4">
        <BackButton onClick={onBack}>Back</BackButton>
      </div>
    </div>
  );
}

/* ── STEP 2: PURCHASE PRICE ── */
function StepPurchasePrice({ value, onChange, onNext, onBack }: {
  value: number; onChange: (v: number) => void; onNext: () => void; onBack: () => void;
}) {
  const pct = ((value - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;

  return (
    <div className="px-4 sm:px-6 py-5 sm:py-6">
      <StepHeader title="What's the purchase price of the vehicle?" sub="Drag the slider to select the approximate price" />

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500 font-medium">${MIN_PRICE.toLocaleString()}</span>
        <span className="text-2xl sm:text-3xl font-bold text-[#008D3B]">${value.toLocaleString()}</span>
        <span className="text-sm text-gray-500 font-medium">${(MAX_PRICE / 1000).toFixed(0)}k</span>
      </div>

      <div className="relative mb-6">
        <div className="relative h-2 bg-gray-100 rounded-full">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#008D3B] to-[#00b84d] rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          min={MIN_PRICE}
          max={MAX_PRICE}
          step={1000}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          onMouseUp={onNext}
          onTouchEnd={onNext}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
          style={{ margin: 0 }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-[#008D3B] rounded-full shadow-md pointer-events-none"
          style={{ left: `calc(${pct}% - 10px)` }}
        />
      </div>

      <p className="text-center text-[11px] text-gray-400 mt-1 mb-2">Release the slider to continue</p>
      <BackButton onClick={onBack}>Back</BackButton>
    </div>
  );
}

/* ── STEP 3: EMPLOYMENT ── */
function StepEmployment({ selected, onSelect, onBack }: { selected: string; onSelect: (v: string) => void; onBack: () => void }) {
  return (
    <div className="px-4 sm:px-6 py-5 sm:py-6">
      <StepHeader title="What's your employment status?" sub="Lenders assess eligibility based on your employment type" />
      <div className="flex flex-col gap-2">
        {employmentTypes.map(e => {
          const active = selected === e.id;
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => onSelect(e.id)}
              className={cn(
                'w-full text-left rounded-xl border px-4 py-3 transition-all duration-150 flex items-center gap-3',
                active
                  ? 'border-[#008D3B] bg-[#ecfdf5] shadow-sm ring-1 ring-[#008D3B]/30'
                  : 'border-gray-200 bg-white hover:border-[#008D3B] hover:bg-[#f0fdf4]',
              )}
            >
              <span className="text-2xl leading-none shrink-0">{e.emoji}</span>
              <span className={cn('flex-1 text-sm font-semibold', active ? 'text-[#008D3B]' : 'text-slate-700')}>{e.label}</span>
              {active && <span className="w-5 h-5 rounded-full bg-[#008D3B] flex items-center justify-center shrink-0"><svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M1 4L4 7L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></span>}
            </button>
          );
        })}
      </div>
      <div className="mt-4">
        <BackButton onClick={onBack}>Back</BackButton>
      </div>
    </div>
  );
}

/* ── STEP 4: ANNUAL INCOME ── */
const MIN_INCOME = 10000;
const MAX_INCOME = 120000;

function incomeToRangeId(v: number): string {
  if (v < 30000)  return 'under30k';  // disqualified in pick()
  if (v < 50000)  return '30-50k';
  if (v < 70000)  return '50-70k';
  if (v < 90000)  return '70-90k';
  return '90k+';
}

function formatIncome(v: number): string {
  if (v >= 120000) return '$120,000+';
  return `$${v.toLocaleString()}`;
}

function incomeRangeLabel(v: number): string {
  if (v < 30000)  return 'Under $30,000 — not eligible';
  if (v < 50000)  return '$30,000 – $49,999';
  if (v < 70000)  return '$50,000 – $69,999';
  if (v < 90000)  return '$70,000 – $89,999';
  return '$90,000+';
}

function StepAnnualIncome({ onSelect, onBack }: { selected: string; onSelect: (v: string) => void; onBack: () => void }) {
  const [value, setValue] = useState(60000);
  const pct = ((value - MIN_INCOME) / (MAX_INCOME - MIN_INCOME)) * 100;

  return (
    <div className="px-4 sm:px-6 py-5 sm:py-6">
      <StepHeader title="What's your annual income before tax?" sub="Used to match you with lenders suited to your income level" />

      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-500 font-medium">$10k</span>
        <span className="text-2xl sm:text-3xl font-bold text-[#008D3B]">{formatIncome(value)}</span>
        <span className="text-sm text-gray-500 font-medium">$120k+</span>
      </div>
      <p className="text-center text-xs text-gray-400 mb-5">{incomeRangeLabel(value)}</p>

      <div className="relative mb-6">
        <div className="relative h-2 bg-gray-100 rounded-full">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#008D3B] to-[#00b84d] rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          min={MIN_INCOME}
          max={MAX_INCOME}
          step={5000}
          value={value}
          onChange={e => setValue(Number(e.target.value))}
          onMouseUp={() => onSelect(incomeToRangeId(value))}
          onTouchEnd={() => onSelect(incomeToRangeId(value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
          style={{ margin: 0 }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-[#008D3B] rounded-full shadow-md pointer-events-none"
          style={{ left: `calc(${pct}% - 10px)` }}
        />
      </div>

      <p className="text-center text-[11px] text-gray-400 mb-2">Release the slider to continue</p>
      <BackButton onClick={onBack}>Back</BackButton>
    </div>
  );
}

/* ── STEP 5: RESIDENCY ── */
function StepResidency({ selected, onSelect, onBack }: { selected: string; onSelect: (v: string) => void; onBack: () => void }) {
  return (
    <div className="px-4 sm:px-6 py-5 sm:py-6">
      <StepHeader title="What's your residency status?" sub="Helps us match you with the right lenders" />
      <div className="flex flex-col gap-2">
        {residencyOptions.map(r => {
          const active = selected === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect(r.id)}
              className={cn(
                'w-full text-left rounded-xl border px-4 py-3 transition-all duration-150 flex items-center gap-3',
                active
                  ? 'border-[#008D3B] bg-[#ecfdf5] shadow-sm ring-1 ring-[#008D3B]/30'
                  : 'border-gray-200 bg-white hover:border-[#008D3B] hover:bg-[#f0fdf4]',
              )}
            >
              {r.img
                ? <img src={r.img} alt={r.label} className="w-7 h-7 object-contain shrink-0 rounded-sm" />
                : <span className="text-2xl leading-none shrink-0">{r.emoji}</span>
              }
              <span className={cn('flex-1 text-sm font-semibold', active ? 'text-[#008D3B]' : 'text-slate-700')}>{r.label}</span>
              {active && <span className="w-5 h-5 rounded-full bg-[#008D3B] flex items-center justify-center shrink-0"><svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M1 4L4 7L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></span>}
            </button>
          );
        })}
      </div>
      <div className="mt-4">
        <BackButton onClick={onBack}>Back</BackButton>
      </div>
    </div>
  );
}

/* ── STEP 6: CREDIT HISTORY ── */
function StepCreditHistory({ selected, onSelect, onBack }: { selected: string; onSelect: (v: string) => void; onBack: () => void }) {
  return (
    <div className="px-4 sm:px-6 py-5 sm:py-6">
      <StepHeader title="How would you rate your credit history?" sub="Approximate is fine — this helps match the right lenders" />
      <div className="flex flex-col gap-2">
        {creditOptions.map(c => {
          const active = selected === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              className={cn(
                'w-full text-left rounded-xl border px-4 py-3 transition-all duration-150 flex items-center gap-3',
                active
                  ? 'border-[#008D3B] bg-[#ecfdf5] shadow-sm ring-1 ring-[#008D3B]/30'
                  : 'border-gray-200 bg-white hover:border-[#008D3B] hover:bg-[#f0fdf4]',
              )}
            >
              <span className="text-2xl leading-none shrink-0">{c.emoji}</span>
              <span className={cn('flex-1 text-sm font-semibold', active ? 'text-[#008D3B]' : 'text-slate-700')}>{c.label}</span>
              {active && <span className="w-5 h-5 rounded-full bg-[#008D3B] flex items-center justify-center shrink-0"><svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M1 4L4 7L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></span>}
            </button>
          );
        })}
      </div>
      <div className="mt-4">
        <BackButton onClick={onBack}>Back</BackButton>
      </div>
    </div>
  );
}

/* ── STEP 7: STATE ── */
function StepState({ selected, onSelect, onBack }: { selected: string; onSelect: (v: string) => void; onBack: () => void }) {
  return (
    <div className="px-4 sm:px-6 py-5 sm:py-6">
      <StepHeader title="Which state are you located in?" sub="Helps connect you with lenders in your area" />
      <div className="grid grid-cols-4 gap-2">
        {AU_STATES.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => onSelect(s)}
            className={cn(
              'rounded-xl border py-3 text-sm font-semibold text-center transition-all duration-150',
              selected === s
                ? 'border-[#008D3B] bg-[#ecfdf5] text-[#008D3B] shadow-sm ring-1 ring-[#008D3B]/30'
                : 'border-gray-200 text-slate-700 hover:border-[#008D3B] hover:bg-[#f0fdf4]',
            )}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="mt-4">
        <BackButton onClick={onBack}>Back</BackButton>
      </div>
    </div>
  );
}

/* ── STEP 8: CONTACT (name + mobile + email combined) ── */
interface ContactProps {
  form: FormState;
  set: (key: keyof FormState, val: string) => void;
  errors: Partial<Record<'fullName'|'mobile'|'email', string>>;
  onSubmit: () => void;
  onBack: () => void;
}

function StepContact({ form, set, errors, onSubmit, onBack }: ContactProps) {
  return (
    <div className="px-4 sm:px-6 py-5 sm:py-6">
      <StepHeader title="Almost there!" sub="Enter your details to see your personalised results" />

      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
          <Input
            type="text"
            placeholder="e.g. James Miller"
            value={form.fullName}
            onChange={e => set('fullName', e.target.value)}
            className={cn('h-11 text-sm text-slate-900', errors.fullName && 'border-destructive')}
          />
          {errors.fullName && <p className="text-[11px] text-red-500 mt-1">{errors.fullName}</p>}
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Mobile Number</label>
          <Input
            type="tel"
            placeholder="04XX XXX XXX"
            value={form.mobile}
            onChange={e => set('mobile', e.target.value)}
            className={cn('h-11 text-sm text-slate-900', errors.mobile && 'border-destructive')}
          />
          {errors.mobile && <p className="text-[11px] text-red-500 mt-1">{errors.mobile}</p>}
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
          <Input
            type="email"
            placeholder="james@gmail.com"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            className={cn('h-11 text-sm text-slate-900', errors.email && 'border-destructive')}
          />
          {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
        </div>
      </div>

      <div className="flex gap-2.5 mt-5">
        <BackButton onClick={onBack}>Back</BackButton>
        <FireButton onClick={onSubmit} flex>Submit</FireButton>
      </div>
      <p className="text-center text-[11px] text-gray-400 mt-2.5 leading-relaxed">
        By submitting you agree to our Privacy Policy. A specialist may reach out with options.
      </p>
    </div>
  );
}

/* ── CREDIT POPUP ── */
function CreditPopup({ onComplete }: { onComplete: (hasDefaults: string, inPaymentPlan: string) => void }) {
  const [hasDefaults, setHasDefaults]     = useState<'yes' | 'no' | null>(null);
  const [inPaymentPlan, setInPaymentPlan] = useState<'yes' | 'no' | null>(null);

  const showPaymentPlan = hasDefaults === 'yes';
  const canContinue     = hasDefaults === 'no' || (hasDefaults === 'yes' && inPaymentPlan !== null);

  function handleContinue() {
    if (!canContinue) return;
    // Has defaults but NOT managing them → disqualify immediately
    if (hasDefaults === 'yes' && inPaymentPlan === 'no') {
      goAppreciated();
      return;
    }
    // Has defaults + in payment plan → bad quality lead, continue
    // No defaults → normal, continue
    onComplete(hasDefaults ?? '', inPaymentPlan ?? '');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-slate-900 mb-1">A few more questions</h3>
        <p className="text-sm text-[#008D3B] mb-6">
          Please answer these quick questions about your credit history.
        </p>

        {/* Q1 */}
        <p className="text-sm font-semibold text-slate-800 mb-3">Do You Have Any Defaults?</p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {(['yes', 'no'] as const).map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => { setHasDefaults(opt); if (opt === 'no') setInPaymentPlan(null); }}
              className={cn(
                'rounded-xl border py-3 text-sm font-semibold transition-all duration-150',
                hasDefaults === opt
                  ? 'border-[#008D3B] bg-[#ecfdf5] text-[#008D3B] ring-1 ring-[#008D3B]/30'
                  : 'border-gray-200 text-slate-700 hover:border-[#008D3B] hover:bg-[#f0fdf4]',
              )}
            >
              {opt === 'yes' ? 'Yes' : 'No'}
            </button>
          ))}
        </div>

        {/* Q2 — revealed when defaults = Yes */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-300 ease-in-out',
            showPaymentPlan ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          <p className="text-sm font-semibold text-slate-800 mb-3">Are They In Payment Plans?</p>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {(['yes', 'no'] as const).map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setInPaymentPlan(opt)}
                className={cn(
                  'rounded-xl border py-3 text-sm font-semibold transition-all duration-150',
                  inPaymentPlan === opt
                    ? 'border-[#008D3B] bg-[#ecfdf5] text-[#008D3B] ring-1 ring-[#008D3B]/30'
                    : 'border-gray-200 text-slate-700 hover:border-[#008D3B] hover:bg-[#f0fdf4]',
                )}
              >
                {opt === 'yes' ? 'Yes' : 'No'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className={cn(
              'rounded-xl px-6 py-3 text-sm font-bold text-white transition-all duration-150',
              canContinue
                ? 'bg-[#008D3B] hover:bg-[#006b2c] hover:shadow-[0_8px_24px_-4px_rgba(0,141,59,0.45)] active:scale-[0.98]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed',
            )}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── GST POPUP ── */
function GSTPopup({ onComplete }: { onComplete: (gstRegistered: string, gstVerified: string) => void }) {
  const [abn, setAbn] = useState<'yes' | 'no' | null>(null);
  const [gst, setGst] = useState<'yes' | 'no' | null>(null);

  // Q2 only shown after ABN = Yes
  const showGst     = abn === 'yes';
  const canContinue = showGst && gst !== null;

  function handleAbn(val: 'yes' | 'no') {
    setAbn(val);
    setGst(null);
    if (val === 'no') goAppreciated();
  }

  function handleContinue() {
    if (!canContinue) return;
    onComplete(gst!, 'yes');
  }

  const btnCls = (selected: 'yes' | 'no' | null, opt: 'yes' | 'no') => cn(
    'rounded-xl border py-3 text-sm font-semibold transition-all duration-150',
    selected === opt
      ? 'border-[#008D3B] bg-[#ecfdf5] text-[#008D3B] ring-1 ring-[#008D3B]/30'
      : 'border-gray-200 text-slate-700 hover:border-[#008D3B] hover:bg-[#f0fdf4]',
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-slate-900 mb-1">A few more questions</h3>
        <p className="text-sm text-[#008D3B] mb-6">
          Since you selected self employed, please answer these quick questions.
        </p>

        {/* Q1: ABN age — always shown */}
        <p className="text-sm font-semibold text-slate-800 mb-3">Is your ABN more than 2 years old?</p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {(['yes', 'no'] as const).map(opt => (
            <button key={opt} type="button" onClick={() => handleAbn(opt)} className={btnCls(abn, opt)}>
              {opt === 'yes' ? 'Yes' : 'No'}
            </button>
          ))}
        </div>

        {/* Q2: GST — slides in only after ABN = Yes */}
        <div className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          showGst ? 'max-h-32 opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0',
        )}>
          <p className="text-sm font-semibold text-slate-800 mb-3">Are you GST registered?</p>
          <div className="grid grid-cols-2 gap-3">
            {(['yes', 'no'] as const).map(opt => (
              <button key={opt} type="button" onClick={() => setGst(opt)} className={btnCls(gst, opt)}>
                {opt === 'yes' ? 'Yes' : 'No'}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue}
          className={cn(
            'w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all duration-150',
            canContinue
              ? 'bg-[#008D3B] hover:bg-[#006b2c] hover:shadow-[0_8px_24px_-4px_rgba(0,141,59,0.45)] active:scale-[0.98]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed',
          )}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

/* ── LOADING ── */
function LoadingScreen() {
  const [msg, setMsg] = useState(LOADING_MSGS[0]);
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => { i = (i + 1) % LOADING_MSGS.length; setMsg(LOADING_MSGS[i]); }, 550);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-white to-[#f0fdf4]">
      <div className="flex flex-col items-center gap-5">
        <span className="w-12 h-12 rounded-full border-4 border-[#008D3B] border-t-transparent animate-spin inline-block" />
        <p className="text-sm text-gray-500 font-medium">{msg}</p>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <span key={i} className="w-2 h-2 rounded-full bg-[#008D3B] inline-block"
              style={{ animation: `bounce-dot 0.8s ease-in-out ${i * 0.15}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── SHARED UI ── */
function StepHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-4 sm:mb-5">
      <h2 className="font-sans text-lg sm:text-xl font-bold text-slate-900 mb-1">{title}</h2>
      <p className="font-sans text-xs sm:text-sm text-gray-400">{sub}</p>
    </div>
  );
}

function FireButton({ onClick, children, flex }: { onClick: () => void; children: React.ReactNode; flex?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center rounded-xl bg-[#008D3B] text-white',
        'font-heading font-bold text-[14px] sm:text-[15px] py-3.5 sm:py-4 mt-1.5',
        'transition-all hover:bg-[#006b2c] active:scale-[0.98]',
        'hover:shadow-[0_8px_24px_-4px_rgba(0,141,59,0.45)]',
        flex ? 'flex-1' : 'w-full',
      )}
    >
      {children}
    </button>
  );
}

function BackButton({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-gray-200 px-4 sm:px-5 py-3.5 sm:py-4 mt-1.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 active:scale-[0.98] transition-colors"
    >
      {children}
    </button>
  );
}
