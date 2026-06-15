'use client';
import { useState } from 'react';

type State = 'idle' | 'loading' | 'success' | 'duplicate' | 'error';

export default function AppreciatedForm() {
  const [fullName, setFullName] = useState('');
  const [mobile,   setMobile]   = useState('');
  const [email,    setEmail]    = useState('');
  const [errors,   setErrors]   = useState<Partial<Record<'fullName'|'mobile'|'email', string>>>({});
  const [state,    setState]    = useState<State>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errs: Partial<Record<'fullName'|'mobile'|'email', string>> = {};
    if (!fullName.trim())                              errs.fullName = 'Please enter your name';
    if (mobile.replace(/\D/g, '').length < 8)         errs.mobile   = 'Please enter a valid mobile number';
    if (!email || !email.includes('@'))                errs.email    = 'Please enter a valid email';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setState('loading');

    const res = await fetch('/api/submit-appreciated', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ fullName, mobile, email }),
    }).catch(() => null);

    if (!res?.ok) { setState('error'); return; }

    const data = await res.json();
    // Clear the disqualification flag so they can re-apply in future
    try { localStorage.removeItem('car_loan_disqualified'); } catch {}
    setState(data.duplicate ? 'duplicate' : 'success');
  }

  if (state === 'success') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-6 text-center">
        <div className="text-3xl mb-3">✅</div>
        <p className="font-bold text-emerald-800 mb-1">Details received!</p>
        <p className="text-sm text-emerald-700">
          We&apos;ll be in touch if your situation changes and we can help with finance.
        </p>
      </div>
    );
  }

  if (state === 'duplicate') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-6 text-center">
        <div className="text-3xl mb-3">📋</div>
        <p className="font-bold text-amber-800 mb-1">Already on our list!</p>
        <p className="text-sm text-amber-700">
          We already have your details. We&apos;ll reach out when we can assist you.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-100 pt-6">
      <p className="text-sm font-semibold text-gray-700 mb-1">Want us to reach out when things change?</p>
      <p className="text-xs text-gray-400 mb-4">Leave your details and we&apos;ll contact you when we can help.</p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <div>
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 ${errors.fullName ? 'border-red-400' : 'border-gray-200'}`}
          />
          {errors.fullName && <p className="text-[11px] text-red-500 mt-1">{errors.fullName}</p>}
        </div>

        <div>
          <input
            type="tel"
            placeholder="Mobile Number"
            value={mobile}
            onChange={e => setMobile(e.target.value)}
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 ${errors.mobile ? 'border-red-400' : 'border-gray-200'}`}
          />
          {errors.mobile && <p className="text-[11px] text-red-500 mt-1">{errors.mobile}</p>}
        </div>

        <div>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 ${errors.email ? 'border-red-400' : 'border-gray-200'}`}
          />
          {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
        </div>

        {state === 'error' && (
          <p className="text-[12px] text-red-500 text-center">Something went wrong. Please try again.</p>
        )}

        <button
          type="submit"
          disabled={state === 'loading'}
          className="w-full rounded-xl bg-emerald-500 text-white font-bold text-sm py-3.5 hover:bg-emerald-600 active:scale-[0.98] transition-all hover:shadow-[0_8px_24px_-4px_rgba(16,185,129,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {state === 'loading' ? 'Sending…' : 'Keep Me Updated'}
        </button>
      </form>
    </div>
  );
}
