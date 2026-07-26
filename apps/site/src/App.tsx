
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Solutions from "./pages/Solutions";
import SolutionDetail from "./pages/SolutionDetail";
import Industries from "./pages/Industries";
import IndustryDetail from "./pages/IndustryDetail";
import Careers from "./pages/Careers";
import Sustainability from "./pages/Sustainability";
import Contact from "./pages/Contact";
import StaffLogin from "./pages/StaffLogin";

const queryClient = new QueryClient();

const AppContent = () => {
  useScrollToTop();
  
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/about" element={<About />} />
      <Route path="/solutions" element={<Solutions />} />
      <Route path="/solutions/:id" element={<SolutionDetail />} />
      <Route path="/solutions/:id/:subId" element={<SolutionDetail />} />
      <Route path="/industries" element={<Industries />} />
      <Route path="/industries/:id" element={<IndustryDetail />} />
      <Route path="/careers" element={<Careers />} />
      <Route path="/sustainability" element={<Sustainability />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/staff-login" element={<StaffLogin />} />
      {/* The old Client Portal showed a login form that was never wired to
          anything. It's now the staff door; the old path still resolves so
          existing links and bookmarks don't 404. */}
      <Route path="/client-portal" element={<Navigate to="/staff-login" replace />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

export default App;
