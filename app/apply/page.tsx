import Script from 'next/script';
import CarLoanApply from '../../components/calculators/CarLoanApply';

export default function ApplyPage() {
  return (
    <>
      <Script
        src="https://data.tryrevvy.com.au/embed-track.js"
        strategy="afterInteractive"
        data-form-id="revvy-quiz"
        data-parent-domain="tryrevvy.com.au"
        data-auto-track="true"
        data-step-selector=".step"
        data-active-class="active"
        data-submit-match="/api/submit-apply"
      />
      <CarLoanApply />
    </>
  );
}
