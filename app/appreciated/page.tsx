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

        
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-6">© LendaLink Finance. Australian Credit Licence holder.</p>
    </div>
  );
}
