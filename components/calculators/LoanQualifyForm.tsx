'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ChevronDownIcon } from 'lucide-react';

/* ── CONSTANTS ── */
const DISQUALIFY  = '/appreciated';
const MIN_LOAN    = 10000;
const MAX_LOAN    = 100000;
const STEP_LABELS = ['Loan Details', 'About You', 'Credit Score', 'Your Details'];

/* ── DATA ── */
const vehicleTypes = [
  { id: 'new_car',   label: 'New Car',                   icon: '🚗'  },
  { id: 'used_car',  label: 'Used Car',                  icon: '🚙'  },
  { id: 'motorbike', label: 'Motorbike',                  icon: '🏍️' },
  { id: 'boat',      label: 'Boat / Marine Craft',        icon: '⛵'  },
  { id: 'caravan',   label: 'Caravan / Camper',           icon: '🏕️' },
  { id: 'truck',     label: 'Truck / Commercial Vehicle', icon: '🚛'  },
];

const employmentOptions = [
  { id: 'fulltime',      label: 'Full or Part Time Employee' },
  { id: 'self_employed', label: 'Self Employed' },
  { id: 'casual',        label: 'Casual Employee' },
  { id: 'unemployed',    label: 'Unemployed' },
  { id: 'centrelink',    label: 'Centrelink Recipient' },
];

const incomeOptions = [
  { id: 'under_3k', label: 'Under $3,000' },
  { id: '3k_5k',    label: '$3,000–$5,000' },
  { id: '5k_8k',    label: '$5,000–$8,000' },
  { id: '8k_12k',   label: '$8,000–$12,000' },
  { id: '12k_plus', label: '$12,000+' },
];

const citizenshipOptions = [
  { id: 'citizen', label: 'Australian Citizen' },
  { id: 'pr',      label: 'Permanent Resident (PR)' },
  { id: 'visa',    label: 'I am on a Visa' },
];

const creditOptions = [
  { id: 'excellent',     label: 'Excellent' },
  { id: 'very_good',     label: 'Very Good' },
  { id: 'average',       label: 'Average' },
  { id: 'not_sure',      label: 'Not Sure' },
  { id: 'below_average', label: 'Below Average' },
];

const AU_STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

/* ── TYPES ── */
interface FormData {
  loanPurpose: string;
  loanAmount: number;
  employmentStatus: string;
  monthlyIncome: string;
  citizenshipStatus: string;
  abnOver2Years: string;
  gstRegistered: string;
  creditScore: string;
  hasDefaults: string;
  defaultsInPaymentPlan: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
}

type Errors = Partial<Record<keyof FormData, string>>;

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function LoanQualifyForm() {
  const router = useRouter();

  const [step, setStep]               = useState(0);
  const [animDir, setAnimDir]         = useState<'forward' | 'back'>('forward');
  const [isAnimating, setIsAnimating] = useState(false);
  const [submitted, setSubmitted]     = useState(false);

  const [form, setForm] = useState<FormData>({
    loanPurpose: '', loanAmount: 22000,
    employmentStatus: '', monthlyIncome: '', citizenshipStatus: '',
    abnOver2Years: '', gstRegistered: '',
    creditScore: '', hasDefaults: '', defaultsInPaymentPlan: '',
    firstName: '', lastName: '', email: '', phone: '', state: '',
  });
  const [errors, setErrors] = useState<Errors>({});

  const [showSEPopup,       setShowSEPopup]       = useState(false);
  const [showDefaultsPopup, setShowDefaultsPopup] = useState(false);

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const knockout = () => router.push(DISQUALIFY);

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

  /* ── KNOCKOUT HANDLERS ── */
  function onEmployment(id: string) {
    set('employmentStatus', id);
    if (id === 'unemployed' || id === 'centrelink') { knockout(); return; }
    if (id === 'self_employed') setShowSEPopup(true);
  }

  function onIncome(id: string) {
    set('monthlyIncome', id);
    if (id === 'under_3k') knockout();
  }

  function onCitizenship(id: string) {
    set('citizenshipStatus', id);
    if (id === 'visa') knockout();
  }

  function onCreditScore(id: string) {
    set('creditScore', id);
    if (id === 'below_average') setShowDefaultsPopup(true);
  }

  function onDefaultsAnswer(val: string) {
    set('hasDefaults', val);
    if (val === 'no') { set('defaultsInPaymentPlan', ''); setShowDefaultsPopup(false); }
  }

  function onPaymentPlanAnswer(val: string) {
    set('defaultsInPaymentPlan', val);
    setShowDefaultsPopup(false);
    if (val === 'no') knockout();
  }

  /* ── VALIDATORS ── */
  function validate0() {
    const e: Errors = {};
    if (!form.loanPurpose) e.loanPurpose = 'Please select what you want to finance';
    setErrors(e); return !Object.keys(e).length;
  }
  function validate1() {
    const e: Errors = {};
    if (!form.employmentStatus) e.employmentStatus = 'Please select your employment status';
    if (!form.monthlyIncome)    e.monthlyIncome    = 'Please select your monthly income';
    if (!form.citizenshipStatus) e.citizenshipStatus = 'Please select your citizenship status';
    setErrors(e); return !Object.keys(e).length;
  }
  function validate2() {
    const e: Errors = {};
    if (!form.creditScore) e.creditScore = 'Please select your credit score';
    setErrors(e); return !Object.keys(e).length;
  }
  function validate3() {
    const e: Errors = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim())  e.lastName  = 'Required';
    if (!form.email || !form.email.includes('@')) e.email = 'Valid email required';
    if (!form.phone || form.phone.replace(/\D/g,'').length < 8) e.phone = 'Valid phone required';
    if (!form.state) e.state = 'Required';
    setErrors(e); return !Object.keys(e).length;
  }

  const loanPct     = ((form.loanAmount - MIN_LOAN) / (MAX_LOAN - MIN_LOAN)) * 100;
  const loanDisplay = form.loanAmount >= MAX_LOAN
    ? `$${MAX_LOAN.toLocaleString()}+`
    : `$${form.loanAmount.toLocaleString()}`;
  const progress = ((step + 1) / STEP_LABELS.length) * 100;

  if (submitted) return <ThankYouScreen name={form.firstName} />;

  return (
    <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-6 sm:py-10 bg-gradient-to-br from-white via-emerald-50/20 to-emerald-50">
      <div className="w-full max-w-[580px] bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_32px_80px_-8px_rgba(0,0,0,0.12)] ring-1 ring-black/5">

        {/* Accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-400" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-0">
          <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
            LendaLink Finance
          </span>
          <span className="text-[11px] text-gray-400 font-medium">Step {step + 1} of {STEP_LABELS.length}</span>
        </div>

        {/* Progress bar */}
        <div className="mx-5 mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-center text-[11px] font-semibold text-emerald-600 mt-1.5">{STEP_LABELS[step]}</p>

        {/* Animated content */}
        <div className="overflow-hidden">
          <div
            className="transition-[opacity,transform] duration-[250ms] ease-in-out"
            style={{
              opacity: isAnimating ? 0 : 1,
              transform: isAnimating ? (animDir === 'forward' ? 'translateX(-14px)' : 'translateX(14px)') : 'translateX(0)',
            }}
          >

            {/* ════ STEP 0 — Loan Details ════ */}
            {step === 0 && (
              <div className="px-5 py-5">
                <SH title="What would you like to finance?" sub="Select the type of vehicle or asset" />

                <div className="grid grid-cols-3 gap-2 mb-1">
                  {vehicleTypes.map(v => (
                    <button
                      key={v.id} type="button"
                      onClick={() => { set('loanPurpose', v.id); setErrors(e => ({ ...e, loanPurpose: undefined })); }}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-4 text-center transition-all duration-150',
                        form.loanPurpose === v.id
                          ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-400/40 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/40',
                      )}
                    >
                      <span className="text-2xl sm:text-3xl">{v.icon}</span>
                      <span className={cn('text-[11px] sm:text-[12px] font-semibold leading-tight', form.loanPurpose === v.id ? 'text-emerald-700' : 'text-slate-700')}>{v.label}</span>
                    </button>
                  ))}
                </div>
                {errors.loanPurpose && <p className="text-xs text-red-500 mt-1 mb-1">{errors.loanPurpose}</p>}

                {/* Slider */}
                <div className="bg-gray-50 rounded-xl p-4 mt-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-gray-500">How much to borrow?</span>
                    <span className="text-xl font-bold text-emerald-600">{loanDisplay}</span>
                  </div>
                  <div className="relative mb-1">
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div className="h-full bg-emerald-500 rounded-full transition-[width] duration-75" style={{ width: `${loanPct}%` }} />
                    </div>
                    <input
                      type="range" min={MIN_LOAN} max={MAX_LOAN} step={1000}
                      value={form.loanAmount}
                      onChange={e => set('loanAmount', Number(e.target.value))}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer h-2" style={{ margin: 0 }}
                    />
                    <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-emerald-500 rounded-full shadow-md pointer-events-none"
                      style={{ left: `calc(${loanPct}% - 10px)` }} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px] text-gray-400">${MIN_LOAN.toLocaleString()}</span>
                    <span className="text-[11px] text-gray-400">${(MAX_LOAN / 1000).toFixed(0)}k+</span>
                  </div>
                </div>

                <GB onClick={() => { if (validate0()) goNext(); }}>Continue</GB>
                <Note>No credit check. Free service. Takes 2 minutes.</Note>
              </div>
            )}

            {/* ════ STEP 1 — About You ════ */}
            {step === 1 && (
              <div className="px-5 py-5">
                <SH title="Tell us about yourself" sub="This helps us match you with the right lenders" />

                <FL label="Employment situation" required error={errors.employmentStatus} />
                <div className="flex flex-wrap gap-2 mb-4">
                  {employmentOptions.map(o => (
                    <Pill key={o.id} selected={form.employmentStatus === o.id} onClick={() => onEmployment(o.id)}>
                      {o.label}
                    </Pill>
                  ))}
                </div>

                <FL label="Monthly income (after tax)" required error={errors.monthlyIncome} />
                <div className="flex flex-wrap gap-2 mb-4">
                  {incomeOptions.map(o => (
                    <Pill key={o.id} selected={form.monthlyIncome === o.id} onClick={() => onIncome(o.id)}>
                      {o.label}
                    </Pill>
                  ))}
                </div>

                <FL label="Citizenship status" required error={errors.citizenshipStatus} />
                <GreenSelect
                  value={form.citizenshipStatus}
                  onChange={onCitizenship}
                  error={errors.citizenshipStatus}
                  placeholder="Select an option"
                  options={citizenshipOptions}
                  className="mb-4"
                />

                <div className="flex gap-2.5">
                  <BB onClick={goBack}>Back</BB>
                  <GB onClick={() => { if (validate1()) goNext(); }} flex>Continue</GB>
                </div>
                <Note>Soft enquiry only — no credit score impact</Note>
              </div>
            )}

            {/* ════ STEP 2 — Credit Score ════ */}
            {step === 2 && (
              <div className="px-5 py-5">
                <SH title="What's your credit score like?" sub="An estimate is fine — no credit check at this stage" />

                <FL label="Credit score" required error={errors.creditScore} />
                <GreenSelect
                  value={form.creditScore}
                  onChange={onCreditScore}
                  error={errors.creditScore}
                  placeholder="Select an option"
                  options={creditOptions}
                  className="mb-5"
                />

                <div className="flex gap-2.5">
                  <BB onClick={goBack}>Back</BB>
                  <GB onClick={() => { if (validate2()) goNext(); }} flex>Continue</GB>
                </div>
              </div>
            )}

            {/* ════ STEP 3 — Contact Details ════ */}
            {step === 3 && (
              <div className="px-5 py-5">
                <SH title="How do we contact you?" sub="Your results will be ready after a quick phone verification" />

                <div className="grid grid-cols-2 gap-2 mb-0">
                  <FF label="First Name" error={errors.firstName}>
                    <Input className={ic(errors.firstName)} placeholder="James" value={form.firstName} onChange={e => set('firstName', e.target.value)} />
                  </FF>
                  <FF label="Last Name" error={errors.lastName}>
                    <Input className={ic(errors.lastName)} placeholder="Miller" value={form.lastName} onChange={e => set('lastName', e.target.value)} />
                  </FF>
                </div>
                <FF label="Email Address" error={errors.email}>
                  <Input className={ic(errors.email)} type="email" placeholder="james@gmail.com" value={form.email} onChange={e => set('email', e.target.value)} />
                </FF>
                <FF label="Mobile Number" error={errors.phone}>
                  <Input className={ic(errors.phone)} type="tel" placeholder="04XX XXX XXX" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </FF>
                <FF label="State" error={errors.state}>
                  <GreenSelect
                    value={form.state}
                    onChange={v => set('state', v)}
                    error={errors.state}
                    placeholder="Select state..."
                    options={AU_STATES.map(s => ({ id: s, label: s }))}
                  />
                </FF>

                <div className="flex gap-2.5 mt-2">
                  <BB onClick={goBack}>Back</BB>
                  <GB onClick={() => { if (validate3()) setSubmitted(true); }} flex>Submit Application</GB>
                </div>
                <Note>By continuing, you agree to our Privacy Policy. A specialist may contact you.</Note>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Self-Employed Popup ── */}
      {showSEPopup && (
        <Modal>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Just a couple more things</h3>
          <p className="text-sm text-gray-400 mb-5">As a self-employed applicant, lenders need a bit more info.</p>

          <p className="text-sm font-semibold text-gray-700 mb-2">Is your ABN more than 2 years old?</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <YNB selected={form.abnOver2Years === 'yes'} onClick={() => set('abnOver2Years', 'yes')}>Yes</YNB>
            <YNB selected={form.abnOver2Years === 'no'}  onClick={() => set('abnOver2Years', 'no')}>No</YNB>
          </div>

          <p className="text-sm font-semibold text-gray-700 mb-2">Are you GST registered?</p>
          <div className="grid grid-cols-2 gap-2 mb-5">
            <YNB selected={form.gstRegistered === 'yes'} onClick={() => set('gstRegistered', 'yes')}>Yes</YNB>
            <YNB selected={form.gstRegistered === 'no'}  onClick={() => set('gstRegistered', 'no')}>No</YNB>
          </div>

          <GB onClick={() => setShowSEPopup(false)}>Got it, Continue</GB>
        </Modal>
      )}

      {/* ── Defaults Popup ── */}
      {showDefaultsPopup && (
        <Modal>
          <h3 className="text-lg font-bold text-gray-900 mb-1">A bit more detail</h3>
          <p className="text-sm text-gray-400 mb-5">Below average credit is more common than you'd think — just two quick questions.</p>

          <p className="text-sm font-semibold text-gray-700 mb-2">Do you have any credit defaults?</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <YNB selected={form.hasDefaults === 'yes'} onClick={() => onDefaultsAnswer('yes')}>Yes</YNB>
            <YNB selected={form.hasDefaults === 'no'}  onClick={() => onDefaultsAnswer('no')}>No</YNB>
          </div>

          {form.hasDefaults === 'yes' && (
            <>
              <p className="text-sm font-semibold text-gray-700 mb-2">Are your defaults currently in a payment plan?</p>
              <div className="grid grid-cols-2 gap-2">
                <YNB selected={form.defaultsInPaymentPlan === 'yes'} onClick={() => onPaymentPlanAnswer('yes')}>Yes</YNB>
                <YNB selected={form.defaultsInPaymentPlan === 'no'}  onClick={() => onPaymentPlanAnswer('no')}>No</YNB>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   THANK YOU SCREEN
══════════════════════════════════════════ */
function ThankYouScreen({ name }: { name: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-white via-emerald-50/20 to-emerald-50">
      <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-[0_32px_80px_-8px_rgba(0,0,0,0.12)] ring-1 ring-black/5 text-center px-8 py-10">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✅</span>
        </div>
        <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">You're all done{name ? `, ${name}` : ''}!</h2>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Thank you for your application. One of our finance specialists will review your details and be in touch shortly — usually within one business day.
        </p>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-emerald-700 font-medium">
          Keep an eye on your phone and email for next steps.
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   SHARED UI COMPONENTS
══════════════════════════════════════════ */

function SH({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-heading text-lg sm:text-xl font-bold text-slate-900 mb-1">{title}</h2>
      <p className="text-xs sm:text-sm text-gray-400">{sub}</p>
    </div>
  );
}

function FL({ label, required, error }: { label: string; required?: boolean; error?: string }) {
  return (
    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      {error && <span className="ml-2 normal-case font-normal text-red-500">{error}</span>}
    </label>
  );
}

function FF({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-[10px] sm:text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function GreenSelect({ value, onChange, error, placeholder, options, className }: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder: string;
  options: { id: string; label: string }[];
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={cn(
          'h-10 w-full appearance-none rounded-lg border bg-white pl-3 pr-8 text-sm text-gray-800',
          'outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 transition-colors cursor-pointer',
          error ? 'border-red-400' : 'border-gray-200',
        )}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
      <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function Pill({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-2 text-sm font-semibold transition-all duration-150 cursor-pointer',
        selected
          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-400/40'
          : 'border-gray-200 text-gray-600 hover:border-emerald-400 hover:bg-emerald-50/40',
      )}
    >{children}</button>
  );
}

function GB({ onClick, children, flex, disabled }: { onClick: () => void; children: React.ReactNode; flex?: boolean; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={cn(
        'flex items-center justify-center rounded-xl bg-emerald-500 text-white',
        'font-heading font-bold text-[14px] sm:text-[15px] py-3.5 sm:py-4 mt-1.5',
        'transition-all hover:bg-emerald-600 active:scale-[0.98]',
        'hover:shadow-[0_8px_24px_-4px_rgba(16,185,129,0.4)]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        flex ? 'flex-1' : 'w-full',
      )}
    >{children}</button>
  );
}

function BB({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className="rounded-xl border border-gray-200 px-4 sm:px-5 py-3.5 sm:py-4 mt-1.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 active:scale-[0.98] transition-colors">
      {children}
    </button>
  );
}

function YNB({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={cn(
        'rounded-xl border py-2.5 text-sm font-semibold transition-all duration-150',
        selected
          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
          : 'border-gray-200 text-gray-600 hover:border-emerald-400',
      )}
    >{children}</button>
  );
}

function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl ring-1 ring-black/5">
        {children}
      </div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-center text-[11px] text-gray-400 mt-2.5 leading-relaxed">{children}</p>;
}

function ic(err?: string) {
  return cn('h-9 text-sm text-slate-900', err && 'border-red-400');
}
