'use client';
import React, { useState, useEffect } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MARKET_RATE, getRoastGrade, calcSavings } from '@/lib/calculations';

/* ── DATA ── */
const STEPS = ['Loan', 'Source', 'Employment', 'Profile', 'Contact'] as const;

const loanSources = [
  { id: 'bank',    icon: '🏦', label: 'Bank / Credit Union', sub: 'ANZ, CBA, NAB' },
  { id: 'dealer',  icon: '🚘', label: 'Car Dealership',       sub: 'In-house finance' },
  { id: 'broker',  icon: '🤝', label: 'Broker / Lender',      sub: 'Pepper, Latitude' },
  { id: 'notsure', icon: '🤷', label: 'Not Sure',             sub: "Can't remember" },
];

const employmentTypes = [
  { id: 'fulltime',     icon: '💼', label: 'Full-Time' },
  { id: 'parttime',     icon: '⏰', label: 'Part-Time' },
  { id: 'selfemployed', icon: '🏢', label: 'Self-Employed' },
  { id: 'casual',       icon: '📋', label: 'Casual' },
];

const LOADING_MSGS = [
  'Checking current market rates...',
  'Analysing your loan profile...',
  'Comparing 20+ lenders...',
  'Building your personalised report...',
];

/* ── TYPES ── */
interface FormState {
  loanAmt: string; currentRate: string; remBal: string; remTerm: string;
  loanSource: string; employment: string; income: string; state: string;
  firstName: string; lastName: string; phone: string; email: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = {
  loanAmt: '', currentRate: '', remBal: '', remTerm: '',
  loanSource: '', employment: '', income: '', state: '',
  firstName: '', lastName: '', phone: '', email: '',
};

/* ── SHARED COMPONENT TYPES ── */
interface StepProps {
  form: FormState;
  set: (key: keyof FormState, val: string) => void;
  errors: Errors;
  onNext: () => void;
  onBack?: () => void;
}

/* ── MAIN CALCULATOR ── */
export default function CarLoanCalculator() {
  const [step, setStep]               = useState(0);
  const [animDir, setAnimDir]         = useState<'forward' | 'back'>('forward');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [form, setForm]               = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors]           = useState<Errors>({});

  const set = (key: keyof FormState, val: string) => setForm(f => ({ ...f, [key]: val }));


  function goNext() {
    setAnimDir('forward');
    setIsAnimating(true);
    setTimeout(() => { setStep(s => s + 1); setIsAnimating(false); }, 280);
  }

  function goBack() {
    setAnimDir('back');
    setIsAnimating(true);
    setTimeout(() => { setStep(s => s - 1); setIsAnimating(false); }, 280);
  }

  function validateStep0(): boolean {
    const e: Errors = {};
    if (!form.loanAmt    || isNaN(Number(form.loanAmt)))    e.loanAmt    = 'Required';
    if (!form.currentRate || isNaN(Number(form.currentRate))) e.currentRate = 'Required';
    if (!form.remBal     || isNaN(Number(form.remBal)))     e.remBal     = 'Required';
    if (!form.remTerm)                                       e.remTerm    = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep1(): boolean {
    const e: Errors = {};
    if (!form.loanSource) e.loanSource = 'Please select where you got your loan';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2(): boolean {
    const e: Errors = {};
    if (!form.employment) e.employment = 'Please select your employment type';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep3(): boolean {
    const e: Errors = {};
    if (!form.income || isNaN(Number(form.income))) e.income = 'Required';
    if (!form.state)  e.state = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleStep0() { if (validateStep0()) goNext(); }
  function handleStep1() { if (validateStep1()) goNext(); }
  function handleStep2() { if (validateStep2()) goNext(); }
  function handleStep3() { if (validateStep3()) goNext(); }

  function handleSubmit() {
    const e: Errors = {};
    if (!form.firstName) e.firstName = 'Required';
    if (!form.lastName)  e.lastName  = 'Required';
    if (!form.phone)     e.phone     = 'Required';
    if (!form.email || !form.email.includes('@')) e.email = 'Valid email required';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const currentRate  = parseFloat(form.currentRate);
    const termYears    = parseFloat(form.remTerm);
    const savings      = calcSavings(parseFloat(form.remBal), currentRate, MARKET_RATE, termYears);
    const roastGrade   = getRoastGrade(currentRate);
    const monthlyDiff  = savings > 0 ? Math.round(savings / (termYears * 12)) : 0;
    const rateGap      = (currentRate - MARKET_RATE).toFixed(2);

    // Fire-and-forget: save to DB + webhook
    fetch('/api/submit-calculator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        savings,
        monthlyDiff,
        grade:      roastGrade.grade,
        gradeLabel: roastGrade.label,
        marketRate: MARKET_RATE,
        rateGap,
      }),
    }).catch(() => {});

    setIsLoading(true);
    setTimeout(() => {
      const params = new URLSearchParams({
        firstName:   form.firstName,
        lastName:    form.lastName,
        email:       form.email,
        phone:       form.phone,
        loanAmt:     form.loanAmt,
        currentRate: form.currentRate,
        remBal:      form.remBal,
        remTerm:     form.remTerm,
        loanSource:  form.loanSource,
        employment:  form.employment,
        income:      form.income,
        state:       form.state,
        savings:     String(savings),
        monthlyDiff: String(monthlyDiff),
        grade:       roastGrade.grade,
        gradeLabel:  roastGrade.label,
        marketRate:  String(MARKET_RATE),
        rateGap,
      });

      const url = `https://ratemycarloan.com.au/results/?${params.toString()}`;
      // Navigate the top-level window so the redirect escapes the iframe
      (window.top || window).location.href = url;
    }, 2200);
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-6 sm:py-10 bg-gradient-to-br from-slate-50 via-white to-[#fff5f0]">
      <div className="w-full max-w-[490px] bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_32px_80px_-8px_rgba(0,0,0,0.10),0_8px_32px_-8px_rgba(255,76,12,0.07)] ring-1 ring-black/5">

        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-[#FF4C0C] to-[#ff6b35]" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5">
          <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-[#FF4C0C] text-white rounded-full px-2.5 sm:px-3.5 py-1 text-[10px] sm:text-[11px] font-bold tracking-widest uppercase">
            Free Rate Roast
          </span>

          {/* Step indicator — dots on xs, numbered circles on sm+ */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1 sm:gap-1.5">
                {/* Mobile: small dot */}
                <div className={cn(
                  'sm:hidden w-2 h-2 rounded-full transition-all duration-300',
                  i < step   && 'bg-[#FF4C0C]',
                  i === step && 'bg-[#FF4C0C] scale-125',
                  i > step   && 'bg-gray-200',
                )} />
                {/* sm+: numbered circle */}
                <div className={cn(
                  'hidden sm:flex w-6 h-6 rounded-full items-center justify-center text-[10px] font-bold transition-all duration-300',
                  i < step   && 'bg-[#FF4C0C] text-white',
                  i === step && 'bg-[#FF4C0C] text-white scale-110 shadow-md shadow-black/20',
                  i > step   && 'bg-gray-100 text-gray-400',
                )}>
                  {i < step ? '✓' : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <>
                    <div className={cn('sm:hidden w-2 h-0.5 rounded-full transition-colors duration-300', i < step ? 'bg-[#FF4C0C]' : 'bg-gray-200')} />
                    <div className={cn('hidden sm:block w-4 h-0.5 rounded-full transition-colors duration-300', i < step ? 'bg-[#FF4C0C]' : 'bg-gray-200')} />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#FF4C0C] to-[#ff6b35] rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>


        {/* Step content */}
        <div className="overflow-hidden">
          <div
            className="transition-[opacity,transform] duration-[250ms] ease-in-out"
            style={{
              opacity: isAnimating ? 0 : 1,
              transform: isAnimating
                ? animDir === 'forward' ? 'translateX(-14px)' : 'translateX(14px)'
                : 'translateX(0)',
            }}
          >
            {step === 0 && <Step0 form={form} set={set} errors={errors} onNext={handleStep0} />}
            {step === 1 && <Step1 form={form} set={set} errors={errors} onNext={handleStep1} onBack={goBack} />}
            {step === 2 && <Step2 form={form} set={set} errors={errors} onNext={handleStep2} onBack={goBack} />}
            {step === 3 && <Step3 form={form} set={set} errors={errors} onNext={handleStep3} onBack={goBack} />}
            {step === 4 && (isLoading
              ? <LoadingScreen />
              : <Step4 form={form} set={set} errors={errors} onSubmit={handleSubmit} onBack={goBack} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── STEP 0 — Loan details ── */
function Step0({ form, set, errors, onNext }: StepProps) {

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-5">
      <StepHeader title="Tell us about your car loan" sub="We need these details to roast your rate accurately" />

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Field label="Loan Amount" error={errors.loanAmt}>
          <PrefixInput prefix="$" error={errors.loanAmt}>
            <Input className={inputCls(errors.loanAmt)} type="number" placeholder="35,000"
              value={form.loanAmt} onChange={e => set('loanAmt', e.target.value)} />
          </PrefixInput>
        </Field>
        <Field label="Current Rate" error={errors.currentRate}>
          <SuffixInput suffix="%" error={errors.currentRate}>
            <Input className={inputCls(errors.currentRate)} type="number" step="0.1" placeholder="9.4"
              value={form.currentRate} onChange={e => set('currentRate', e.target.value)} />
          </SuffixInput>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Field label="Remaining Balance" error={errors.remBal}>
          <PrefixInput prefix="$" error={errors.remBal}>
            <Input className={inputCls(errors.remBal)} type="number" placeholder="22,000"
              value={form.remBal} onChange={e => set('remBal', e.target.value)} />
          </PrefixInput>
        </Field>
        <Field label="Remaining Term" error={errors.remTerm}>
          <SelectInput error={errors.remTerm} value={form.remTerm} onChange={e => set('remTerm', e.target.value)}>
            <option value="">Select...</option>
            <option value="0.5">Less than 1 yr</option>
            <option value="1.5">1–2 years</option>
            <option value="2.5">2–3 years</option>
            <option value="3.5">3–4 years</option>
            <option value="4.5">4–5 years</option>
            <option value="6">5+ years</option>
          </SelectInput>
        </Field>
      </div>


      <FireButton onClick={onNext}>Continue →</FireButton>
      <Note>No credit check. No spam. Takes 60 seconds.</Note>
    </div>
  );
}

/* ── STEP 1 — Where did you get your loan? ── */
function Step1({ form, set, errors, onNext, onBack }: StepProps) {
  return (
    <div className="px-4 sm:px-6 py-4 sm:py-5">
      <StepHeader title="Where did you get your loan?" sub="This makes your report much more accurate" />

      <Field label="" error={errors.loanSource}>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {loanSources.map(s => (
            <PillButton key={s.id} selected={form.loanSource === s.id} onClick={() => set('loanSource', s.id)}>
              <span className="text-2xl sm:text-3xl mb-0.5">{s.icon}</span>
              <span className="text-[12px] sm:text-[13px] font-semibold text-slate-800 leading-tight">{s.label}</span>
              <span className="text-[11px] text-gray-400">{s.sub}</span>
            </PillButton>
          ))}
        </div>
      </Field>

      <div className="flex gap-2 sm:gap-2.5 mt-2">
        <BackButton onClick={onBack}>← Back</BackButton>
        <FireButton onClick={onNext} flex>Continue →</FireButton>
      </div>
      <Note>Soft enquiry only — no credit score impact</Note>
    </div>
  );
}

/* ── STEP 2 — Employment type ── */
function Step2({ form, set, errors, onNext, onBack }: StepProps) {
  return (
    <div className="px-4 sm:px-6 py-4 sm:py-5">
      <StepHeader title="What's your employment type?" sub="Lenders assess risk differently based on how you work" />

      <Field label="" error={errors.employment}>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {employmentTypes.map(e => (
            <PillButton key={e.id} selected={form.employment === e.id} onClick={() => set('employment', e.id)}>
              <span className="text-2xl sm:text-3xl mb-0.5">{e.icon}</span>
              <span className="text-[12px] sm:text-[13px] font-semibold text-slate-800">{e.label}</span>
            </PillButton>
          ))}
        </div>
      </Field>

      <div className="flex gap-2 sm:gap-2.5 mt-2">
        <BackButton onClick={onBack}>← Back</BackButton>
        <FireButton onClick={onNext} flex>Continue →</FireButton>
      </div>
      <Note>Soft enquiry only — no credit score impact</Note>
    </div>
  );
}

/* ── STEP 3 — Income & State ── */
function Step3({ form, set, errors, onNext, onBack }: StepProps) {
  return (
    <div className="px-4 sm:px-6 py-4 sm:py-5">
      <StepHeader title="Almost there!" sub="Just a couple more details for your personalised report" />

      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2 sm:gap-3">
        <Field label="Annual Income (pre-tax)" error={errors.income}>
          <PrefixInput prefix="$" error={errors.income}>
            <Input className={inputCls(errors.income)} type="number" placeholder="80,000"
              value={form.income} onChange={e => set('income', e.target.value)} />
          </PrefixInput>
        </Field>
        <Field label="State" error={errors.state}>
          <SelectInput error={errors.state} value={form.state} onChange={e => set('state', e.target.value)}>
            <option value="">Select...</option>
            {['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'].map(s => (
              <option key={s}>{s}</option>
            ))}
          </SelectInput>
        </Field>
      </div>

      <div className="flex gap-2 sm:gap-2.5 mt-1">
        <BackButton onClick={onBack}>← Back</BackButton>
        <FireButton onClick={onNext} flex>Continue →</FireButton>
      </div>
      <Note>Your information is kept private and secure</Note>
    </div>
  );
}

/* ── STEP 4 — Contact details ── */
interface Step4Props extends Omit<StepProps, 'onNext'> {
  onSubmit: () => void;
}

function Step4({ form, set, errors, onSubmit, onBack }: Step4Props) {
  return (
    <div className="px-4 sm:px-6 py-4 sm:py-5">
      <StepHeader title="Last step — your details" sub="Your report will be ready instantly" />

      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2 sm:gap-3">
        <Field label="First Name" error={errors.firstName}>
          <Input className={inputCls(errors.firstName)} type="text" placeholder="James"
            aria-invalid={!!errors.firstName}
            value={form.firstName} onChange={e => set('firstName', e.target.value)} />
        </Field>
        <Field label="Last Name" error={errors.lastName}>
          <Input className={inputCls(errors.lastName)} type="text" placeholder="Miller"
            aria-invalid={!!errors.lastName}
            value={form.lastName} onChange={e => set('lastName', e.target.value)} />
        </Field>
      </div>

      <Field label="Mobile Number" error={errors.phone}>
        <Input className={inputCls(errors.phone)} type="tel" placeholder="04XX XXX XXX"
          aria-invalid={!!errors.phone}
          value={form.phone} onChange={e => set('phone', e.target.value)} />
      </Field>

      <Field label="Email Address" error={errors.email}>
        <Input className={inputCls(errors.email)} type="email" placeholder="james@gmail.com"
          aria-invalid={!!errors.email}
          value={form.email} onChange={e => set('email', e.target.value)} />
      </Field>

      <div className="flex gap-2 sm:gap-2.5 mt-1">
        <BackButton onClick={onBack}>← Back</BackButton>
        <FireButton onClick={onSubmit} flex>Get My Rate Roast</FireButton>
      </div>
      <Note>By submitting you agree to our Privacy Policy. A specialist may reach out with options.</Note>
    </div>
  );
}

/* ── LOADING ── */
function LoadingScreen() {
  const [msg, setMsg] = useState(LOADING_MSGS[0]);

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i = (i + 1) % LOADING_MSGS.length;
      setMsg(LOADING_MSGS[i]);
    }, 550);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-14 px-4 sm:px-6 text-center">
      <span className="w-10 h-10 rounded-full border-4 border-[#FF4C0C] border-t-transparent animate-spin inline-block" />
      <p className="mt-5 text-sm text-gray-500 font-medium min-h-[20px]">{msg}</p>
      <div className="flex items-center gap-1.5 mt-4">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-[#FF4C0C] inline-block"
            style={{ animation: `bounce-dot 0.8s ease-in-out ${i * 0.15}s infinite` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── SUB-COMPONENTS ── */
function StepHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-4 sm:mb-5">
      <h2 className="font-heading text-lg sm:text-xl font-bold text-slate-900 mb-1">{title}</h2>
      <p className="text-xs sm:text-sm text-gray-400">{sub}</p>
    </div>
  );
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
}

function Field({ label, children, error }: FieldProps) {
  return (
    <div className="mb-3">
      {label && <label className="block text-[10px] sm:text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">{label}</label>}
      {children}
      {error && <p className="text-[11px] text-[#FF4C0C] mt-1">{error}</p>}
    </div>
  );
}

function PrefixInput({ prefix, children, error }: { prefix: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="relative">
      <span className={cn('absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold pointer-events-none select-none', error ? 'text-[#FF4C0C]' : 'text-gray-400')}>
        {prefix}
      </span>
      <div className="[&_input]:pl-7">{children}</div>
    </div>
  );
}

function SuffixInput({ suffix, children, error }: { suffix: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="relative">
      <span className={cn('absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold pointer-events-none select-none', error ? 'text-[#FF4C0C]' : 'text-gray-400')}>
        {suffix}
      </span>
      <div className="[&_input]:pr-7">{children}</div>
    </div>
  );
}

interface SelectInputProps {
  error?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}

function SelectInput({ error, value, onChange, children }: SelectInputProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className={cn(
          'h-9 w-full appearance-none rounded-lg border bg-transparent pl-3 pr-8 text-sm text-foreground',
          'transition-colors outline-none cursor-pointer',
          'focus:border-ring focus:ring-2 focus:ring-ring/30',
          error ? 'border-destructive' : 'border-input',
        )}
      >
        {children}
      </select>
      <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
    </div>
  );
}

function PillButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 rounded-xl border px-2 py-3 sm:py-4 text-center cursor-pointer transition-all duration-150',
        selected
          ? 'border-[#FF4C0C] bg-[#FFF1EC] shadow-sm'
          : 'border-gray-200 bg-white hover:border-[#FF4C0C] hover:bg-[#FFF8F5]',
      )}
    >
      {children}
    </button>
  );
}

function FireButton({ onClick, children, flex }: { onClick: () => void; children: React.ReactNode; flex?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center rounded-xl bg-[#FF4C0C] text-white',
        'font-heading font-bold text-[14px] sm:text-[15px] py-3.5 sm:py-4 mt-1.5',
        'transition-all hover:bg-[#d63d08] active:scale-[0.98]',
        'hover:shadow-[0_8px_24px_-4px_rgba(255,76,12,0.45)]',
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

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-center text-[11px] text-gray-400 mt-2.5 leading-relaxed">{children}</p>;
}

/* ── STYLE UTILS ── */
function inputCls(error?: string) {
  return cn('h-9 text-sm text-slate-900', error && 'border-destructive');
}
