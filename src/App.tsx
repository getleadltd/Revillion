import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { AnimatePresence, motion } from "framer-motion";
import { pageVariants } from "./lib/motion";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminRedirect } from "./components/AdminRedirect";
import { useGA4PageViews } from "./hooks/useGA4PageViews";
import { CookieBanner } from "./components/CookieBanner";
import { TrackingProvider } from "./components/TrackingProvider";
import { RedirectHandler } from "./components/RedirectHandler";
import { ScrollToTop } from "./components/ScrollToTop";
import './lib/i18n';

// Lazy-loaded public pages
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Contact = lazy(() => import("./pages/Contact"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const ResponsibleGaming = lazy(() => import("./pages/ResponsibleGaming"));
const Calculator = lazy(() => import("./pages/Calculator"));
const AdsLanding = lazy(() => import("./pages/AdsLanding"));

// Lazy-loaded admin pages (heavy: recharts, editors, etc.)
const BlogAdmin = lazy(() => import("./pages/admin/BlogAdmin"));
const BlogEditor = lazy(() => import("./pages/admin/BlogEditor"));
const BlogAnalytics = lazy(() => import("./pages/admin/BlogAnalytics"));
const BlogQueue = lazy(() => import("./pages/admin/BlogQueue"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const SEOMonitoring = lazy(() => import("./pages/admin/SEOMonitoring"));
const ContactMessages = lazy(() => import("./pages/admin/ContactMessages"));
const IncomingArticles = lazy(() => import("./pages/admin/IncomingArticles"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AgentsDashboard = lazy(() => import("./pages/admin/AgentsDashboard"));
const Login = lazy(() => import("./pages/auth/Login"));

// Minimal loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// GA4 page view tracking on route changes
const GAListener = () => {
  useGA4PageViews();
  return null;
};

// Animated page wrapper
const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            <Route path="/" element={<Navigate to="/en" replace />} />
            <Route path="/admin" element={<AdminRedirect />} />
            <Route path="/admin/*" element={<AdminRedirect />} />
            <Route path="/:lang" element={<Index />} />
            <Route path="/:lang/contact" element={<Contact />} />
            <Route path="/:lang/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/:lang/terms-of-service" element={<TermsOfService />} />
            <Route path="/:lang/responsible-gaming" element={<ResponsibleGaming />} />
            <Route path="/:lang/calculator" element={<Calculator />} />
            <Route path="/:lang/earn" element={<AdsLanding />} />
            <Route path="/:lang/blog" element={<Blog />} />
            <Route path="/:lang/blog/:slug" element={<BlogPost />} />
            <Route path="/:lang/auth/login" element={<Login />} />
            <Route path="/:lang/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/:lang/admin/blog" element={<ProtectedRoute><BlogAdmin /></ProtectedRoute>} />
            <Route path="/:lang/admin/blog/new" element={<ProtectedRoute><BlogEditor /></ProtectedRoute>} />
            <Route path="/:lang/admin/blog/edit/:id" element={<ProtectedRoute><BlogEditor /></ProtectedRoute>} />
            <Route path="/:lang/admin/analytics" element={<ProtectedRoute><BlogAnalytics /></ProtectedRoute>} />
            <Route path="/:lang/admin/blog/queue" element={<ProtectedRoute><BlogQueue /></ProtectedRoute>} />
            <Route path="/:lang/admin/seo-monitoring" element={<ProtectedRoute><SEOMonitoring /></ProtectedRoute>} />
            <Route path="/:lang/admin/contact-messages" element={<ProtectedRoute><ContactMessages /></ProtectedRoute>} />
            <Route path="/:lang/admin/incoming" element={<ProtectedRoute><IncomingArticles /></ProtectedRoute>} />
            <Route path="/:lang/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
            <Route path="/:lang/admin/agents" element={<ProtectedRoute><AgentsDashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <TrackingProvider>
            <ScrollToTop />
            <GAListener />
            <CookieBanner />
            <RedirectHandler />
            <AnimatedRoutes />
          </TrackingProvider>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
