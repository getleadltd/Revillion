import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
// Blog imports - will be enabled after Supabase is fully configured
// import Blog from "./pages/Blog";
// import BlogPost from "./pages/BlogPost";
// import BlogAdmin from "./pages/admin/BlogAdmin";
// import Login from "./pages/auth/Login";
// import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import './lib/i18n';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/en" replace />} />
            <Route path="/:lang" element={<Index />} />
            {/* Blog routes - will be enabled after Supabase is fully configured */}
            {/* <Route path="/:lang/blog" element={<Blog />} /> */}
            {/* <Route path="/:lang/blog/:slug" element={<BlogPost />} /> */}
            {/* <Route path="/:lang/auth/login" element={<Login />} /> */}
            {/* <Route 
              path="/:lang/admin/blog" 
              element={
                <ProtectedRoute>
                  <BlogAdmin />
                </ProtectedRoute>
              } 
            /> */}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
