export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  /** Internal only — never surface OTP on screen in the UI when false */
  pocMode: import.meta.env.VITE_POC_MODE === "true",
  appName: import.meta.env.VITE_APP_NAME || "APAD Portal",
  tagline: "Personalized offers · Secure sign-in",
  /** ISO 3166-1 alpha-2 — default flag on phone inputs (e.g. US, IN) */
  defaultPhoneCountry: (import.meta.env.VITE_DEFAULT_PHONE_COUNTRY || "US").toUpperCase(),
};
