import Script from 'next/script';
import CarLoanApply from '../../components/calculators/CarLoanApply';

// 1300 Car Money placement: brand colours + redirects to the 1300carmoney.hivesocial.live funnel
export default function Apply1300Page() {
  return (
    <>
      {/* auto-track + submit-match = form_submit fires when /api/submit-apply is called (steps are reported via fpEmbedTrack) */}
      <Script
        src="https://getswarm.click/embed-pixel.js"
        strategy="afterInteractive"
        data-form-id="survey-funnel-1"
        data-parent-domain="1300carmoney.hivesocial.live"
        data-auto-track="true"
        data-submit-match="/api/submit-apply"
      />
      <CarLoanApply brand="1300carmoney" />
    </>
  );
}
