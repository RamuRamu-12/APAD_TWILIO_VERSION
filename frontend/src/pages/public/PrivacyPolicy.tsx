import { Link } from "react-router-dom";
import LegalPageLayout from "../../components/legal/LegalPageLayout";
import { config } from "../../lib/config";

export default function PrivacyPolicy() {
  const company = config.appName;
  const supportEmail = config.supportEmail;

  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="June 9, 2026">
      <p>
        {company} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy and is committed to
        protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard
        information when you use our website and services.
      </p>

      <h2 style={{ color: "var(--text-primary)", fontSize: "1.15rem", margin: "1.75rem 0 0.75rem" }}>
        Information we collect
      </h2>
      <p>When you create an account or use our services, we may collect:</p>
      <ul style={{ paddingLeft: "1.25rem", margin: "0.75rem 0" }}>
        <li>Full name</li>
        <li>Mobile phone number</li>
        <li>Email address</li>
        <li>Age, gender, and location (city/area)</li>
        <li>Account activity related to offer viewing and verification</li>
      </ul>

      <h2 style={{ color: "var(--text-primary)", fontSize: "1.15rem", margin: "1.75rem 0 0.75rem" }}>
        SMS communications
      </h2>
      <p>
        By providing your phone number and opting in to receive SMS messages from {company}, you consent to
        receive text messages related to our services, including account verification (one-time passwords),
        account updates, and service-related notifications where applicable.
      </p>
      <p style={{ marginTop: "0.75rem" }}>
        Message frequency may vary. Message and data rates may apply. We do not sell or share your mobile
        information with third parties for their marketing purposes.
      </p>
      <p style={{ marginTop: "0.75rem" }}>
        You may opt out at any time by replying <strong>STOP</strong> to any message. For assistance, reply{" "}
        <strong>HELP</strong> or contact us at{" "}
        <a href={`mailto:${supportEmail}`} className="text-link">
          {supportEmail}
        </a>
        .
      </p>

      <h2 style={{ color: "var(--text-primary)", fontSize: "1.15rem", margin: "1.75rem 0 0.75rem" }}>
        How we use your information
      </h2>
      <ul style={{ paddingLeft: "1.25rem", margin: "0.75rem 0" }}>
        <li>To create and manage your account</li>
        <li>To send one-time passwords and verify your identity</li>
        <li>To deliver personalized offers and service communications</li>
        <li>To improve our platform and comply with legal obligations</li>
      </ul>

      <h2 style={{ color: "var(--text-primary)", fontSize: "1.15rem", margin: "1.75rem 0 0.75rem" }}>
        Data security
      </h2>
      <p>
        We use reasonable technical and organizational measures to protect your information. No method of
        transmission over the Internet is 100% secure, but we work to safeguard your data.
      </p>

      <h2 style={{ color: "var(--text-primary)", fontSize: "1.15rem", margin: "1.75rem 0 0.75rem" }}>
        Your choices
      </h2>
      <p>
        You may request access to or correction of your personal information by contacting us. You may withdraw
        SMS consent by replying STOP or by contacting us at the email below.
      </p>

      <h2 style={{ color: "var(--text-primary)", fontSize: "1.15rem", margin: "1.75rem 0 0.75rem" }}>
        Contact us
      </h2>
      <p>
        For privacy-related questions, contact us at{" "}
        <a href={`mailto:${supportEmail}`} className="text-link">
          {supportEmail}
        </a>
        .
      </p>
      <p style={{ marginTop: "1rem" }}>
        See also our{" "}
        <Link to="/terms-of-service" className="text-link">
          Terms of Service
        </Link>
        .
      </p>
    </LegalPageLayout>
  );
}
