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
const Overview       = lazy(() => import('../pages/dashboard/Overview').then(m => ({ default: m.Overview })));
const ReportAnalyzer = lazy(() => import('../pages/dashboard/ReportAnalyzer').then(m => ({ default: m.ReportAnalyzer })));
const SymptomChecker = lazy(() => import('../pages/dashboard/SymptomChecker').then(m => ({ default: m.SymptomChecker })));
const EmergencySos       = lazy(() => import('../pages/dashboard/EmergencySos').then(m => ({ default: m.EmergencySos })));
const HospitalFinder     = lazy(() => import('../pages/dashboard/HospitalFinder').then(m => ({ default: m.HospitalFinder })));
const DietPlanner        = lazy(() => import('../pages/dashboard/DietPlanner').then(m => ({ default: m.DietPlanner })));
const MedicalChat        = lazy(() => import('../pages/dashboard/MedicalChat').then(m => ({ default: m.MedicalChat })));
const DocumentManager    = lazy(() => import('../pages/dashboard/DocumentManager').then(m => ({ default: m.DocumentManager })));
const ReportViewer       = lazy(() => import('../pages/dashboard/ReportViewer').then(m => ({ default: m.ReportViewer })));
const Doctors        = lazy(() => import('../pages/dashboard/Doctors').then(m => ({ default: m.Doctors })));
const Appointments   = lazy(() => import('../pages/dashboard/Appointments').then(m => ({ default: m.Appointments })));
const AppointmentManagement = lazy(() => import('../pages/dashboard/AppointmentManagement').then(m => ({ default: m.AppointmentManagement })));
const ConsultationNotes = lazy(() => import('../pages/dashboard/ConsultationNotes').then(m => ({ default: m.ConsultationNotes })));
const DoctorChat     = lazy(() => import('../pages/dashboard/DoctorChat').then(m => ({ default: m.DoctorChat })));
const Prescriptions  = lazy(() => import('../pages/dashboard/Prescriptions').then(m => ({ default: m.Prescriptions })));
const Settings       = lazy(() => import('../pages/dashboard/Settings').then(m => ({ default: m.Settings })));
const AdminConsole   = lazy(() => import('../pages/dashboard/AdminConsole').then(m => ({ default: m.AdminConsole })));

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
            <Route path="patients" element={<Navigate to="report-analyzer" replace />} />
            <Route path="report-analyzer" element={<Suspense fallback={<DashShell />}><ReportAnalyzer /></Suspense>} />
            <Route path="symptom-checker" element={<Suspense fallback={<DashShell />}><SymptomChecker /></Suspense>} />
            <Route path="emergency-sos" element={<Suspense fallback={<DashShell />}><EmergencySos /></Suspense>} />
            <Route path="hospital-finder" element={<Suspense fallback={<DashShell />}><HospitalFinder /></Suspense>} />
            <Route path="diet-planner" element={<Suspense fallback={<DashShell />}><DietPlanner /></Suspense>} />
            <Route path="medical-chat" element={<Suspense fallback={<DashShell />}><MedicalChat /></Suspense>} />
            <Route path="documents" element={<Suspense fallback={<DashShell />}><DocumentManager /></Suspense>} />
            <Route path="doctors" element={<Suspense fallback={<DashShell />}><Doctors /></Suspense>} />
            <Route path="appointments" element={<Suspense fallback={<DashShell />}><Appointments /></Suspense>} />
            <Route path="manage-appointments" element={<Suspense fallback={<DashShell />}><AppointmentManagement /></Suspense>} />
            <Route path="report-viewer" element={<Suspense fallback={<DashShell />}><ReportViewer /></Suspense>} />
            <Route path="prescriptions" element={<Suspense fallback={<DashShell />}><Prescriptions /></Suspense>} />
            <Route path="consultations" element={<Suspense fallback={<DashShell />}><ConsultationNotes /></Suspense>} />
            <Route path="doctor-chat" element={<Suspense fallback={<DashShell />}><DoctorChat /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<DashShell />}><Settings /></Suspense>} />
            <Route path="admin" element={<Suspense fallback={<DashShell />}><AdminConsole /></Suspense>} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};
