import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import AdminLayout from "../components/layout/AdminLayout";
import ProtectedRoute from "./ProtectedRoute";

import Home from "../pages/public/Home";
import Register from "../pages/public/Register";
import Login from "../pages/public/Login";
import GetOtp from "../pages/public/GetOtp";
import AdWatch from "../pages/ads/AdWatch";
import AdPreview from "../pages/ads/AdPreview";
import OtpVerification from "../pages/otp/OtpVerification";
import GenerateOtp from "../pages/otp/GenerateOtp";
import Dashboard from "../pages/portal/Dashboard";
import Offers from "../pages/portal/Offers";
import Recommendations from "../pages/portal/Recommendations";
import Profile from "../pages/portal/Profile";
import AdminLogin from "../pages/admin/AdminLogin";
import AdminControlCenter from "../pages/admin/AdminControlCenter";
import AdminUsers from "../pages/admin/AdminUsers";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/get-otp" element={<GetOtp />} />
        <Route path="/ad-watch" element={<AdWatch />} />
        <Route path="/ad-preview/:token" element={<AdPreview />} />
        <Route path="/generate-otp" element={<GenerateOtp />} />
        <Route path="/otp-confirmation" element={<GenerateOtp />} />
        <Route path="/otp-verification" element={<OtpVerification />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/offers"
          element={
            <ProtectedRoute>
              <Offers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recommendations"
          element={
            <ProtectedRoute>
              <Recommendations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminControlCenter />} />
        <Route path="/admin/campaigns" element={<AdminControlCenter />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/analytics" element={<Navigate to="/admin#analytics" replace />} />
      </Route>
    </Routes>
  );
}
