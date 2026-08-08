export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  /** Internal only — never surface OTP on screen in the UI when false */
  pocMode: import.meta.env.VITE_POC_MODE === "true",
  appName: import.meta.env.VITE_APP_NAME || "APAD Portal",
  tagline: "Personalized offers · Secure sign-in",
  publicSiteUrl: import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:5173",
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || "support@yourcompany.com",
};
