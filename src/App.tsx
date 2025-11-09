import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BlogAdmin from "./pages/admin/BlogAdmin";
import BlogEditor from "./pages/admin/BlogEditor";
import BlogAnalytics from "./pages/admin/BlogAnalytics";
import BlogQueue from "./pages/admin/BlogQueue";
import Dashboard from "./pages/admin/Dashboard";
import Login from "./pages/auth/Login";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminRedirect } from "./components/AdminRedirect";
import { useGA4PageViews } from "./hooks/useGA4PageViews";
import './lib/i18n';

// Component to listen to route changes and send GA4 page views
const GAListener = () => {
  useGA4PageViews();
  return null;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <GAListener />
          <Routes>
            <Route path="/" element={<Navigate to="/en" replace />} />
            <Route path="/admin" element={<AdminRedirect />} />
            <Route path="/:lang" element={<Index />} />
            <Route path="/:lang/blog" element={<Blog />} />
            <Route path="/:lang/blog/:slug" element={<BlogPost />} />
            <Route path="/:lang/auth/login" element={<Login />} />
            <Route 
              path="/:lang/admin" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/:lang/admin/blog" 
              element={
                <ProtectedRoute>
                  <BlogAdmin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/:lang/admin/blog/new" 
              element={
                <ProtectedRoute>
                  <BlogEditor />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/:lang/admin/blog/edit/:id" 
              element={
                <ProtectedRoute>
                  <BlogEditor />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/:lang/admin/analytics" 
              element={
                <ProtectedRoute>
                  <BlogAnalytics />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/:lang/admin/blog/queue" 
              element={
                <ProtectedRoute>
                  <BlogQueue />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
