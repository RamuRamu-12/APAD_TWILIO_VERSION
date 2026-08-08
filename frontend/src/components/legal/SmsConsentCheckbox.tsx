import { Link } from "react-router-dom";
import { config } from "../../lib/config";

interface SmsConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}

export default function SmsConsentCheckbox({ checked, onChange, id = "sms-consent" }: SmsConsentCheckboxProps) {
  return (
    <label
      htmlFor={id}
      style={{
        display: "flex",
        gap: "0.75rem",
        alignItems: "flex-start",
        cursor: "pointer",
        fontSize: "0.825rem",
        lineHeight: 1.5,
        color: "var(--text-secondary)",
      }}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required
        style={{ marginTop: "0.2rem", flexShrink: 0, width: "1rem", height: "1rem" }}
      />
      <span>
        By providing your mobile number and checking this box, you agree to receive SMS messages from{" "}
        {config.appName} for account verification and service-related communications. Message frequency may
        vary. Message and data rates may apply. Reply <strong>STOP</strong> to opt out and <strong>HELP</strong>{" "}
        for assistance. See our{" "}
        <Link to="/privacy-policy" className="text-link" target="_blank" rel="noopener noreferrer">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link to="/terms-of-service" className="text-link" target="_blank" rel="noopener noreferrer">
          Terms of Service
        </Link>
        .
      </span>
    </label>
  );
}
