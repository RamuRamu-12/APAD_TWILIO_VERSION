import { Navigate } from "react-router-dom";

/** Legacy two-ad interstitial — Mastercard flow skips this step. */
export default function GenerateOtp() {
  return <Navigate to="/login" replace />;
}
