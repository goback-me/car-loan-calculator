'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDownIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/* ── DATA ── */
const STEPS = ['Vehicle', 'Amount', 'Employment', 'Income', 'Citizenship', 'Credit', 'Contact'] as const;

const vehicleTypes = [
  { id: 'new-car',   icon: '🚗',  label: 'New Car' },
  { id: 'used-car',  icon: '🚙',  label: 'Used Car' },
  { id: 'motorbike', icon: '🏍️', label: 'Motorbike' },
  { id: 'boat',      icon: '⛵',  label: 'Boat / Marine Craft' },
  { id: 'caravan',   icon: '🏕️', label: 'Caravan or Camper' },
  { id: 'truck',     icon: '🚛',  label: 'Truck / Commercial Vehicle' },
];

const employmentTypes = [
  { id: 'fulltime',    label: 'Full or Part Time Employee' },
  { id: 'selfemployed', label: 'Self Employed' },
  { id: 'casual',      label: 'Casual Employee' },
  { id: 'unemployed',  label: 'Unemployed' },
  { id: 'centrelink',  label: 'Centrelink Recipient' },
];

const incomeRanges = [
  { id: 'under3k', label: 'Under $3,000' },
  { id: '3k-5k',   label: '$3,000–$5,000' },
  { id: '5k-8k',   label: '$5,000–$8,000' },
  { id: '8k-12k',  label: '$8,000–$12,000' },
  { id: '12k+',    label: '$12,000+' },
];

const citizenshipOptions = [
  { id: 'citizen', label: 'Australian Citizen' },
  { id: 'pr',      label: 'Permanent Resident (PR)' },
  { id: 'visa',    label: 'I am on a Visa' },
];

const creditScores = [
  { id: 'excellent',  label: 'Excellent',      sub: '700+' },
  { id: 'very-good',  label: 'Very Good',       sub: '625–699' },
  { id: 'average',    label: 'Average',         sub: '550–624' },
  { id: 'below-avg',  label: 'Below Average',   sub: '300–549' },
  { id: 'not-sure',   label: 'Not Sure',        sub: "I don't know" },
];

const AU_STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

const LOADING_MSGS = [
  'Matching you with lenders...',
  'Checking your eligibility...',
  'Comparing 20+ lenders...',
  'Preparing your personalised results...',
];

const MIN_BORROW = 5000;
const MAX_BORROW = 150000;

/* ── TYPES ── */
interface FormState {
  vehicle: string;
  borrowAmount: number;
  employment: string;
  income: string;
  citizenship: string;
  creditScore: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
}

type ContactErrors = Partial<Record<'firstName' | 'lastName' | 'email' | 'phone' | 'state', string>>;

const EMPTY_FORM: FormState = {
  vehicle: '', borrowAmount: 22000, employment: '', income: '',
  citizenship: '', creditScore: '',
  firstName: '', lastName: '', email: '', phone: '', state: '',
};

/* ── MAIN ── */
export default function CarLoanApply() {
  const router                        = useRouter();
  const [step, setStep]               = useState(0);
  const [animDir, setAnimDir]         = useState<'forward' | 'back'>('forward');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [form, setForm]               = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors]           = useState<ContactErrors>({});

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm(f => ({ ...f, [key]: val }));

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

  function pick<K extends keyof FormState>(key: K, val: FormState[K]) {
    if (key === 'employment' && (val === 'unemployed' || val === 'centrelink')) {
      router.push('/appreciated');
      return;
    }
    if (key === 'income' && val === 'under3k') {
      router.push('/appreciated');
      return;
    }
    if (key === 'citizenship' && val === 'visa') {
      router.push('/appreciated');
      return;
    }
    set(key, val);
    setTimeout(goNext, 160);
  }

  function handleSubmit() {
    const e: ContactErrors = {};
    if (!form.firstName.trim())                          e.firstName = 'Required';
    if (!form.lastName.trim())                           e.lastName  = 'Required';
    if (!form.email || !form.email.includes('@'))        e.email     = 'Valid email required';
    if (!form.phone || form.phone.replace(/\D/g,'').length < 8) e.phone = 'Valid phone required';
    if (!form.state)                                     e.state     = 'Required';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setIsLoading(true);
    setTimeout(() => {
      const params = new URLSearchParams({
        vehicle:     form.vehicle,
        borrowAmt:   String(form.borrowAmount),
        employment:  form.employment,
        income:      form.income,
        citizenship: form.citizenship,
        creditScore: form.creditScore,
        firstName:   form.firstName,
        lastName:    form.lastName,
        email:       form.email,
        phone:       form.phone,
        state:       form.state,
      });
      (window.top || window).location.href = `https://aizall53.sg-host.com/result/?${params.toString()}`;
    }, 2200);
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-6 sm:py-10 bg-gradient-to-br from-slate-50 via-white to-[#fff5f0]">
      <div className="w-full max-w-[560px] bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_32px_80px_-8px_rgba(0,0,0,0.10),0_8px_32px_-8px_rgba(255,76,12,0.07)] ring-1 ring-black/5">

        <div className="h-1 bg-gradient-to-r from-[#FF4C0C] to-[#ff6b35]" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5">
          <span className="inline-flex items-center bg-[#FF4C0C] text-white rounded-full px-3 py-1 text-[10px] sm:text-[11px] font-bold tracking-widest uppercase">
Find My Best Rate
          </span>
          <span className="text-[11px] text-gray-400 font-medium">Step {step + 1} of {STEPS.length}</span>
        </div>

        {/* Progress bar */}
        <div className="mx-4 sm:mx-6 mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#FF4C0C] to-[#ff6b35] rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
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
              <StepVehicle selected={form.vehicle} onSelect={v => pick('vehicle', v)} />
            )}
            {step === 1 && (
              <StepAmount value={form.borrowAmount} onChange={v => set('borrowAmount', v)} onNext={goNext} onBack={goBack} />
            )}
            {step === 2 && (
              <StepEmployment selected={form.employment} onSelect={v => pick('employment', v)} onBack={goBack} />
            )}
            {step === 3 && (
              <StepIncome selected={form.income} onSelect={v => pick('income', v)} onBack={goBack} />
            )}
            {step === 4 && (
              <StepCitizenship selected={form.citizenship} onSelect={v => pick('citizenship', v)} onBack={goBack} />
            )}
            {step === 5 && (
              <StepCreditScore selected={form.creditScore} onSelect={v => pick('creditScore', v)} onBack={goBack} />
            )}
            {step === 6 && (
              <StepContact form={form} set={(k, v) => set(k as keyof FormState, v as string)} errors={errors} onSubmit={handleSubmit} onBack={goBack} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── STEP: VEHICLE ── */
function StepVehicle({ selected, onSelect }: { selected: string; onSelect: (v: string) => void }) {
  return (
    <div className="px-4 sm:px-6 py-5 sm:py-6">
      <StepHeader title="What do you want to buy?" sub="Select the type of vehicle you're looking to finance" />
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {vehicleTypes.map(v => (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v.id)}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-4 text-center cursor-pointer transition-all duration-150',
              selected === v.id
                ? 'border-[#FF4C0C] bg-[#FFF1EC] shadow-sm ring-1 ring-[#FF4C0C]/30'
                : 'border-gray-200 bg-white hover:border-[#FF4C0C] hover:bg-[#FFF8F5]',
            )}
          >
            <span className="text-3xl">{v.icon}</span>
            <span className="text-[11px] sm:text-[12px] font-semibold text-slate-800 leading-tight">{v.label}</span>
          </button>
        ))}
      </div>
      <p className="text-center text-[11px] text-gray-400 mt-4">No credit check. Free service.</p>
    </div>
  );
}

/* ── STEP: AMOUNT ── */
function StepAmount({ value, onChange, onNext, onBack }: { value: number; onChange: (v: number) => void; onNext: () => void; onBack: () => void }) {
  const pct = ((value - MIN_BORROW) / (MAX_BORROW - MIN_BORROW)) * 100;

  return (
    <div className="px-4 sm:px-6 py-5 sm:py-6">
      <StepHeader title="How much do you need to borrow?" sub="Drag the slider to select your loan amount" />

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500 font-medium">${MIN_BORROW.toLocaleString()}</span>
        <span className="text-2xl sm:text-3xl font-bold text-[#FF4C0C] font-heading">${value.toLocaleString()}</span>
        <span className="text-sm text-gray-500 font-medium">${(MAX_BORROW / 1000).toFixed(0)}k</span>
      </div>

      {/* Slider */}
      <div className="relative mb-6">
        <div className="relative h-2 bg-gray-100 rounded-full">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#FF4C0C] to-[#ff6b35] rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          min={MIN_BORROW}
          max={MAX_BORROW}
          step={1000}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          onMouseUp={onNext}
          onTouchEnd={onNext}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
          style={{ margin: 0 }}
        />
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-[#FF4C0C] rounded-full shadow-md pointer-events-none"
          style={{ left: `calc(${pct}% - 10px)` }}
        />
      </div>

      <p className="text-center text-[11px] text-gray-400 mt-1 mb-2">Release the slider to continue</p>
      <BackButton onClick={onBack}>Back</BackButton>
    </div>
  );
}

/* ── STEP: EMPLOYMENT ── */
function StepEmployment({ selected, onSelect, onBack }: { selected: string; onSelect: (v: string) => void; onBack: () => void }) {
  return (
    <div className="px-4 sm:px-6 py-5 sm:py-6">
      <StepHeader title="What do you do?" sub="Lenders assess eligibility based on employment type" />
      <div className="flex flex-col gap-2">
        {employmentTypes.map(e => (
          <button
            key={e.id}
            type="button"
            onClick={() => onSelect(e.id)}
            className={cn(
              'w-full text-left rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-150',
              selected === e.id
                ? 'border-[#FF4C0C] bg-[#FFF1EC] text-[#FF4C0C] shadow-sm ring-1 ring-[#FF4C0C]/30'
                : 'border-gray-200 text-slate-700 hover:border-[#FF4C0C] hover:bg-[#FFF8F5]',
            )}
          >
            {e.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2.5 mt-4">
        <BackButton onClick={onBack}>Back</BackButton>
      </div>
    </div>
  );
}

/* ── STEP: INCOME ── */
function StepIncome({ selected, onSelect, onBack }: { selected: string; onSelect: (v: string) => void; onBack: () => void }) {
  return (
    <div className="px-4 sm:px-6 py-5 sm:py-6">
      <StepHeader title="How much do you make a month?" sub="Used only for lender matching — not shared until you choose to proceed" />
      <div className="flex flex-col gap-2">
        {incomeRanges.map(r => (
          <button
            key={r.id}
            type="button"
            onClick={() => onSelect(r.id)}
            className={cn(
              'w-full text-left rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-150',
              selected === r.id
                ? 'border-[#FF4C0C] bg-[#FFF1EC] text-[#FF4C0C] shadow-sm ring-1 ring-[#FF4C0C]/30'
                : 'border-gray-200 text-slate-700 hover:border-[#FF4C0C] hover:bg-[#FFF8F5]',
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2.5 mt-4">
        <BackButton onClick={onBack}>Back</BackButton>
      </div>
    </div>
  );
}

/* ── STEP: CITIZENSHIP ── */
function StepCitizenship({ selected, onSelect, onBack }: { selected: string; onSelect: (v: string) => void; onBack: () => void }) {
  return (
    <div className="px-4 sm:px-6 py-5 sm:py-6">
      <StepHeader title="What's your citizenship status?" sub="This helps us match you with the right lenders" />
      <div className="flex flex-col gap-2">
        {citizenshipOptions.map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className={cn(
              'w-full text-left rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-150',
              selected === c.id
                ? 'border-[#FF4C0C] bg-[#FFF1EC] text-[#FF4C0C] shadow-sm ring-1 ring-[#FF4C0C]/30'
                : 'border-gray-200 text-slate-700 hover:border-[#FF4C0C] hover:bg-[#FFF8F5]',
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2.5 mt-4">
        <BackButton onClick={onBack}>Back</BackButton>
      </div>
    </div>
  );
}

/* ── STEP: CREDIT SCORE ── */
function StepCreditScore({ selected, onSelect, onBack }: { selected: string; onSelect: (v: string) => void; onBack: () => void }) {
  return (
    <div className="px-4 sm:px-6 py-5 sm:py-6">
      <StepHeader title="What's your credit score like?" sub="Approximate is fine — this helps match the right lenders" />
      <div className="grid grid-cols-1 gap-2">
        {creditScores.map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className={cn(
              'w-full flex items-center justify-between rounded-xl border px-4 py-3 transition-all duration-150',
              selected === c.id
                ? 'border-[#FF4C0C] bg-[#FFF1EC] shadow-sm ring-1 ring-[#FF4C0C]/30'
                : 'border-gray-200 bg-white hover:border-[#FF4C0C] hover:bg-[#FFF8F5]',
            )}
          >
            <span className={cn('text-sm font-semibold', selected === c.id ? 'text-[#FF4C0C]' : 'text-slate-700')}>{c.label}</span>
            <span className="text-xs text-gray-400">{c.sub}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-2.5 mt-4">
        <BackButton onClick={onBack}>Back</BackButton>
      </div>
    </div>
  );
}

/* ── STEP: CONTACT ── */
interface ContactProps {
  form: FormState;
  set: (key: string, val: string) => void;
  errors: ContactErrors;
  onSubmit: () => void;
  onBack: () => void;
}

function StepContact({ form, set, errors, onSubmit, onBack }: ContactProps) {
  return (
    <div className="px-4 sm:px-6 py-5 sm:py-6">
      <StepHeader title="How do we contact you?" sub="Your results will be ready instantly" />

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <Field label="First Name" error={errors.firstName}>
          <Input
            className={inputCls(errors.firstName)}
            type="text"
            placeholder="James"
            value={form.firstName}
            onChange={e => set('firstName', e.target.value)}
          />
        </Field>
        <Field label="Last Name" error={errors.lastName}>
          <Input
            className={inputCls(errors.lastName)}
            type="text"
            placeholder="Miller"
            value={form.lastName}
            onChange={e => set('lastName', e.target.value)}
          />
        </Field>
      </div>

      <Field label="Email Address" error={errors.email}>
        <Input
          className={inputCls(errors.email)}
          type="email"
          placeholder="james@gmail.com"
          value={form.email}
          onChange={e => set('email', e.target.value)}
        />
      </Field>

      <Field label="Phone Number" error={errors.phone}>
        <Input
          className={inputCls(errors.phone)}
          type="tel"
          placeholder="04XX XXX XXX"
          value={form.phone}
          onChange={e => set('phone', e.target.value)}
        />
      </Field>

      <Field label="State" error={errors.state}>
        <div className="relative">
          <select
            value={form.state}
            onChange={e => set('state', e.target.value)}
            className={cn(
              'h-9 w-full appearance-none rounded-lg border bg-transparent pl-3 pr-8 text-sm text-foreground',
              'transition-colors outline-none cursor-pointer focus:border-ring focus:ring-2 focus:ring-ring/30',
              errors.state ? 'border-destructive' : 'border-input',
            )}
          >
            <option value="">Select state...</option>
            {AU_STATES.map(s => <option key={s}>{s}</option>)}
          </select>
          <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        </div>
      </Field>

      <div className="flex gap-2.5 mt-2">
        <BackButton onClick={onBack}>Back</BackButton>
        <FireButton onClick={onSubmit} flex>Get My Results</FireButton>
      </div>
      <p className="text-center text-[11px] text-gray-400 mt-2.5 leading-relaxed">
        By submitting you agree to our Privacy Policy. A specialist may reach out with options.
      </p>
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
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-white to-[#fff5f0]">
      <div className="flex flex-col items-center gap-5">
        <span className="w-12 h-12 rounded-full border-4 border-[#FF4C0C] border-t-transparent animate-spin inline-block" />
        <p className="text-sm text-gray-500 font-medium">{msg}</p>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <span key={i} className="w-2 h-2 rounded-full bg-[#FF4C0C] inline-block"
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
      <h2 className="font-heading text-lg sm:text-xl font-bold text-slate-900 mb-1">{title}</h2>
      <p className="text-xs sm:text-sm text-gray-400">{sub}</p>
    </div>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="mb-3">
      <label className="block text-[10px] sm:text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
      {error && <p className="text-[11px] text-[#FF4C0C] mt-1">{error}</p>}
    </div>
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

function inputCls(error?: string) {
  return cn('h-9 text-sm text-slate-900', error && 'border-destructive');
}
