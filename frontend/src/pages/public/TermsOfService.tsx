import { Link } from "react-router-dom";
import LegalPageLayout from "../../components/legal/LegalPageLayout";
import { config } from "../../lib/config";

export default function TermsOfService() {
  const company = config.appName;
  const supportEmail = config.supportEmail;

  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="June 9, 2026">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of {company} and related services. By
        creating an account or using our platform, you agree to these Terms.
      </p>

      <h2 style={{ color: "var(--text-primary)", fontSize: "1.15rem", margin: "1.75rem 0 0.75rem" }}>
        Use of the service
      </h2>
      <p>
        You must provide accurate information when registering. You are responsible for maintaining the
        confidentiality of your account and for all activity under your account.
      </p>

      <h2 style={{ color: "var(--text-primary)", fontSize: "1.15rem", margin: "1.75rem 0 0.75rem" }}>
        SMS messaging program
      </h2>
      <p>
        By opting in to receive SMS communications from {company}, you agree to receive text messages regarding
        your account, services, verification codes (OTP), notifications, and other relevant communications.
      </p>
      <p style={{ marginTop: "0.75rem" }}>
        Message frequency may vary. Message and data rates may apply.
      </p>
      <p style={{ marginTop: "0.75rem" }}>
        You may opt out at any time by replying <strong>STOP</strong> to any message. For help, reply{" "}
        <strong>HELP</strong> or contact us at{" "}
        <a href={`mailto:${supportEmail}`} className="text-link">
          {supportEmail}
        </a>
        .
      </p>
      <p style={{ marginTop: "0.75rem" }}>
        Consent to receive SMS messages is <strong>not a condition of purchase</strong>.
      </p>
      <p style={{ marginTop: "0.75rem" }}>
        We reserve the right to modify or terminate the messaging program at any time. We will provide notice
        of material changes where required by law.
      </p>

      <h2 style={{ color: "var(--text-primary)", fontSize: "1.15rem", margin: "1.75rem 0 0.75rem" }}>
        Offers and content
      </h2>
      <p>
        Offers displayed through {company} are provided by partner brands. We do not guarantee availability,
        pricing, or terms of third-party offers. Partner terms apply to any purchase or redemption.
      </p>

      <h2 style={{ color: "var(--text-primary)", fontSize: "1.15rem", margin: "1.75rem 0 0.75rem" }}>
        Limitation of liability
      </h2>
      <p>
        To the fullest extent permitted by law, {company} is not liable for indirect, incidental, or
        consequential damages arising from your use of the service.
      </p>

      <h2 style={{ color: "var(--text-primary)", fontSize: "1.15rem", margin: "1.75rem 0 0.75rem" }}>
        Changes to these Terms
      </h2>
      <p>
        We may update these Terms from time to time. Continued use of the service after changes constitutes
        acceptance of the updated Terms.
      </p>

      <h2 style={{ color: "var(--text-primary)", fontSize: "1.15rem", margin: "1.75rem 0 0.75rem" }}>
        Contact
      </h2>
      <p>
        Questions about these Terms? Contact us at{" "}
        <a href={`mailto:${supportEmail}`} className="text-link">
          {supportEmail}
        </a>
        .
      </p>
      <p style={{ marginTop: "1rem" }}>
        See also our{" "}
        <Link to="/privacy-policy" className="text-link">
          Privacy Policy
        </Link>
        .
      </p>
    </LegalPageLayout>
  );
}
