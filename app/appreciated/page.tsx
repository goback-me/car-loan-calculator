import AppreciatedForm from './AppreciatedForm';

export const metadata = {
  title: 'We Appreciate Your Enquiry | LendaLink',
  description: 'Thank you for your enquiry with LendaLink Finance.',
};

export default function AppreciatedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-emerald-50 flex flex-col items-center justify-center px-4 py-12 font-sans">

      {/* Logo */}
      <div className="mb-8">
        <span className="text-2xl font-extrabold tracking-tight">
          <span className="text-emerald-500">Lenda</span><span className="text-gray-800">Link</span>
        </span>
      </div>

      {/* Main card */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-[0_24px_60px_-8px_rgba(0,0,0,0.10)] ring-1 ring-black/5 overflow-hidden">

        {/* Top accent */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-500" />

        <div className="px-6 sm:px-8 py-8">

          {/* Icon + Heading */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              🤍
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">We Appreciate Your Enquiry</h1>
            <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
              Thank you for considering us for your finance needs. Based on your current situation, we&apos;re unable to match you with a suitable lender right now — but that doesn&apos;t mean never.
            </p>
          </div>

          {/* Info box */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-5 py-4 mb-6">
            <p className="text-sm font-semibold text-emerald-800 mb-2">This may change in the future if:</p>
            <ul className="space-y-1.5">
              {[
                'Your employment situation changes',
                'Your monthly income grows above $3,000',
                'You become a permanent resident or citizen',
                'Your credit defaults are resolved or paid off',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-emerald-700">
                  <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Alternative options */}
          <p className="text-sm font-semibold text-gray-700 mb-3">In the meantime, you may want to explore:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            {[
              { icon: '🐷', title: 'Build Your Savings', desc: 'A savings plan can strengthen your future application' },
              { icon: '📈', title: 'Improve Your Credit', desc: 'Free credit report at creditsavvy.com.au' },
              { icon: '🙋', title: 'Speak to a Counsellor', desc: 'Free financial counselling at moneysmart.gov.au' },
            ].map(card => (
              <div key={card.title} className="bg-gray-50 rounded-xl p-4 text-center">
                <span className="text-2xl block mb-2">{card.icon}</span>
                <p className="text-xs font-bold text-gray-800 mb-1">{card.title}</p>
                <p className="text-[11px] text-gray-500 leading-snug">{card.desc}</p>
              </div>
            ))}
          </div>

          {/* Leave details form */}
          <AppreciatedForm />

          {/* Contact */}
          <div className="text-center mt-6 mb-2">
            <p className="text-sm text-gray-500 mb-3">Have questions? Our team is happy to help.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="tel:0251189201"
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                <span>📞</span> (02) 5118 9201
              </a>
              <a href="mailto:info@lendalink.com.au"
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                <span>✉️</span> info@lendalink.com.au
              </a>
            </div>
          </div>

          {/* Back button */}
          <a
            href="https://lendalink.com.au"
            className="flex items-center justify-center w-full rounded-xl border border-gray-200 text-gray-500 font-semibold text-sm py-3 mt-4 hover:bg-gray-50 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-6">© LendaLink Finance. Australian Credit Licence holder.</p>
    </div>
  );
}
