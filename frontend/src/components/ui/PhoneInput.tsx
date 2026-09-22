import type { Country } from "react-phone-number-input";
import PhoneInputWithCountry from "react-phone-number-input";
import "react-phone-number-input/style.css";

import { config } from "../../lib/config";

const DEFAULT_PHONE_COUNTRY = config.defaultPhoneCountry as Country;

type Props = {
  value: string;
  onChange: (value: string) => void;
  defaultCountry?: Country;
  required?: boolean;
  placeholder?: string;
};

export default function PhoneInput({
  value,
  onChange,
  defaultCountry = DEFAULT_PHONE_COUNTRY,
  required,
  placeholder = "Mobile number",
}: Props) {
  return (
    <PhoneInputWithCountry
      international
      defaultCountry={defaultCountry}
      value={value || undefined}
      onChange={(v) => onChange(v ?? "")}
      placeholder={placeholder}
      className="phone-input-wrap"
      numberInputProps={{ className: "input-field phone-input-field", required }}
    />
  );
}
