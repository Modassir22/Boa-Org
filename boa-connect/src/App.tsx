import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import RegisterSimple from "./pages/RegisterSimple";
import Dashboard from "./pages/Dashboard";
import Certificates from "./pages/Certificates";
import Notifications from "./pages/Notifications";
import Seminars from "./pages/Seminars";
import SeminarDetail from "./pages/SeminarDetail";
import SeminarRegistration from "./pages/SeminarRegistration";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Gallery from "./pages/Gallery";
import Membership from "./pages/Membership";
import MembershipDetails from "./pages/MembershipDetails";
import Resources from "./pages/Resources";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPanel from "./pages/admin/AdminPanel";
import AdminProfile from "./pages/admin/AdminProfile";
import OfflineFormSettings from "./pages/admin/OfflineFormSettings";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import TestConfig from "./pages/TestConfig";
import MembershipForm from "./pages/MembershipForm";

const queryClient = new QueryClient();

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
}

// Conditional Navbar - hide on admin routes
function ConditionalNavbar() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // Don't render anything on admin routes
  if (isAdminRoute) {
    return null;
  }
  
  return <Navbar />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <SonnerToaster />
      <BrowserRouter>
        <ConditionalNavbar />
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/register" element={<RegisterSimple />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/certificates" element={
            <ProtectedRoute>
              <Certificates />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />
          <Route path="/seminars" element={<Seminars />} />
          <Route path="/seminar/:id" element={<SeminarDetail />} />
          <Route path="/seminar/:id/register" element={<SeminarRegistration />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/membership-details" element={
            <ProtectedRoute>
              <MembershipDetails />
            </ProtectedRoute>
          } />
          <Route path="/membership-form" element={<MembershipForm />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/offline-form" element={<OfflineFormSettings />} />
          <Route path="/admin/*" element={<AdminPanel />} />
          <Route path="/test-config" element={<TestConfig />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
