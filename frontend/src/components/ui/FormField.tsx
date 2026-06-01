import type { CSSProperties, ReactNode } from "react";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export default function FormField({
  label,
  htmlFor,
  required,
  className = "",
  style,
  children,
}: FormFieldProps) {
  return (
    <div className={`form-group ${className}`} style={style}>
      <label htmlFor={htmlFor} className="form-label">
        {label}
        {required && <span style={{ color: "var(--accent-rose)" }}> *</span>}
      </label>
      {children}
    </div>
  );
}
