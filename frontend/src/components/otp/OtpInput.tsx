import { useRef, KeyboardEvent, ClipboardEvent, ChangeEvent } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  length?: number;
}

export default function OtpInput({ value, onChange, length = 6 }: Props) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(length, " ").slice(0, length).split("");

  const updateDigits = (newDigits: string[]) => {
    onChange(newDigits.join("").replace(/\s/g, "").slice(0, length));
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    if (val !== "" && !/^[0-9]$/.test(val)) return;

    const newDigits = [...digits];
    newDigits[index] = val;
    updateDigits(newDigits);

    if (val !== "" && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (digits[index]?.trim() === "" && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        updateDigits(newDigits);
        inputsRef.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = "";
        updateDigits(newDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    if (new RegExp(`^\\d{${length}}$`).test(pasted)) {
      onChange(pasted);
      inputsRef.current[length - 1]?.focus();
    }
  };

  return (
    <div>
      <label className="form-label" style={{ textAlign: "center", display: "block", marginBottom: "0.75rem" }}>
        One-time password
      </label>
      <div className="otp-input-container">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digits[index]?.trim() || ""}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            className="otp-box"
          />
        ))}
      </div>
    </div>
  );
}
