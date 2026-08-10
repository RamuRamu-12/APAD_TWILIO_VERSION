export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  /** Internal only — never surface OTP on screen in the UI when false */
  pocMode: import.meta.env.VITE_POC_MODE === "true",
  appName: (() => {
    const raw = import.meta.env.VITE_APP_NAME || "Mastercard Portal";
    return /apad/i.test(raw) ? "Mastercard Portal" : raw;
  })(),
  tagline: "Secure sign-in · Bank dashboard",
};
