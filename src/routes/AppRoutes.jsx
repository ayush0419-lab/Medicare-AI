import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layouts & Auth (static — needed immediately)
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

// Lazy-loaded public pages
const Landing                   = lazy(() => import('../pages/Landing').then(m => ({ default: m.Landing })));
const Login                     = lazy(() => import('../pages/Login').then(m => ({ default: m.Login })));
const Signup                    = lazy(() => import('../pages/Signup').then(m => ({ default: m.Signup })));
const ForgotPassword            = lazy(() => import('../pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword             = lazy(() => import('../pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const PrivacyPolicy             = lazy(() => import('../pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService            = lazy(() => import('../pages/TermsOfService').then(m => ({ default: m.TermsOfService })));
const SystemStatus              = lazy(() => import('../pages/SystemStatus').then(m => ({ default: m.SystemStatus })));
const VisionPage                = lazy(() => import('../pages/Vision').then(m => ({ default: m.VisionPage })));
const GlobalNetworkPage         = lazy(() => import('../pages/GlobalNetwork').then(m => ({ default: m.GlobalNetworkPage })));
const PredictiveIntelligencePage = lazy(() => import('../pages/PredictiveIntelligence').then(m => ({ default: m.PredictiveIntelligencePage })));
const ZeroTrustSecurityPage     = lazy(() => import('../pages/ZeroTrustSecurity').then(m => ({ default: m.ZeroTrustSecurityPage })));

// Lazy-loaded dashboard pages
const Overview      = lazy(() => import('../pages/dashboard/Overview').then(m => ({ default: m.Overview })));
const Patients      = lazy(() => import('../pages/dashboard/Patients').then(m => ({ default: m.Patients })));
const Doctors       = lazy(() => import('../pages/dashboard/Doctors').then(m => ({ default: m.Doctors })));
const Appointments  = lazy(() => import('../pages/dashboard/Appointments').then(m => ({ default: m.Appointments })));
const Settings      = lazy(() => import('../pages/dashboard/Settings').then(m => ({ default: m.Settings })));

// Minimal page-level fallback (no spinner, just blank white — instant feel)
const PageShell = () => <div className="min-h-screen bg-slate-50" />;
const DashShell = () => <div className="flex h-[60vh] items-center justify-center"><div className="w-5 h-5 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" /></div>;

export const AppRoutes = () => {
  return (
    <Router>
      <Suspense fallback={<PageShell />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/status" element={<SystemStatus />} />
          <Route path="/vision" element={<VisionPage />} />
          <Route path="/network" element={<GlobalNetworkPage />} />
          <Route path="/intelligence" element={<PredictiveIntelligencePage />} />
          <Route path="/security" element={<ZeroTrustSecurityPage />} />

          {/* Protected Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Suspense fallback={<DashShell />}><Overview /></Suspense>} />
            <Route path="patients" element={<Suspense fallback={<DashShell />}><Patients /></Suspense>} />
            <Route path="doctors" element={<Suspense fallback={<DashShell />}><Doctors /></Suspense>} />
            <Route path="appointments" element={<Suspense fallback={<DashShell />}><Appointments /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<DashShell />}><Settings /></Suspense>} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};
