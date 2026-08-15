import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import { PageTransition } from "@/components/PageTransition";
import Index from "./pages/Index";
import Catalog from "./pages/Catalog";
import BookDetail from "./pages/BookDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Settings from "./pages/Settings";
import Favorites from "./pages/Favorites";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentError from "./pages/PaymentError";
import ReadBook from "./pages/ReadBook";
import ReadChapter from "./pages/ReadChapter";
import ChapterAdd from "./pages/ChapterAdd";
import CommunityChat from "./pages/CommunityChat";
import Social from "./pages/Social";
import Profile from "./pages/Profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="text-center p-8 rounded-2xl border bg-card glass-card">
            <h1 className="font-heading text-2xl font-bold text-foreground mb-4">Terjadi Kesalahan</h1>
            <p className="text-muted-foreground mb-6">Maaf, terjadi kesalahan tak terduga.</p>
            <button onClick={() => window.location.reload()} className="px-6 py-3 button-info">
              Refresh Halaman
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Komponen wrapper untuk routes dengan animasi
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<Layout />}>
          <Route 
            path="/" 
            element={
              <PageTransition mode="fade">
                <Index />
              </PageTransition>
            } 
          />
          <Route 
            path="/catalog" 
            element={
              <PageTransition mode="fade">
                <Catalog />
              </PageTransition>
            } 
          />
          <Route 
            path="/book/:id" 
            element={
              <PageTransition mode="slide">
                <BookDetail />
              </PageTransition>
            } 
          />
          <Route 
            path="/book/:bookId/chapter/new" 
            element={
              <PageTransition mode="slide">
                <ChapterAdd />
              </PageTransition>
            } 
          />
          <Route 
            path="/read/:id" 
            element={
              <PageTransition mode="lift">
                <ReadBook />
              </PageTransition>
            } 
          />
          <Route 
            path="/chapter/:id" 
            element={
              <PageTransition mode="lift">
                <ReadChapter />
              </PageTransition>
            } 
          />
          <Route 
            path="/favorites" 
            element={
              <PageTransition mode="fade">
                <Favorites />
              </PageTransition>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <PageTransition mode="fade">
                <Dashboard />
              </PageTransition>
            } 
          />
          <Route path="/admin/books" element={<Navigate to="/dashboard" replace />} />
          <Route path="/upload" element={<Navigate to="/dashboard" replace />} />
          <Route 
            path="/settings" 
            element={
              <PageTransition mode="slide">
                <Settings />
              </PageTransition>
            } 
          />
          <Route 
            path="/community/*" 
            element={
              <PageTransition mode="fade">
                <CommunityChat />
              </PageTransition>
            } 
          />
          <Route 
            path="/social" 
            element={
              <PageTransition mode="fade">
                <Social />
              </PageTransition>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <PageTransition mode="fade">
                <Profile />
              </PageTransition>
            } 
          />
          <Route 
            path="/profile/:id" 
            element={
              <PageTransition mode="fade">
                <Profile />
              </PageTransition>
            } 
          />
          <Route 
            path="/login" 
            element={
              <PageTransition mode="scale">
                <Login />
              </PageTransition>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PageTransition mode="scale">
                <Register />
              </PageTransition>
            } 
          />
          <Route 
            path="/forgot-password" 
            element={
              <PageTransition mode="scale">
                <ForgotPassword />
              </PageTransition>
            } 
          />
          <Route 
            path="/reset-password" 
            element={
              <PageTransition mode="scale">
                <ResetPassword />
              </PageTransition>
            } 
          />
        </Route>
        <Route 
          path="/payment/success" 
          element={
            <PageTransition mode="fade">
              <PaymentSuccess />
            </PageTransition>
          } 
        />
        <Route 
          path="/payment/error" 
          element={
            <PageTransition mode="fade">
              <PaymentError />
            </PageTransition>
          } 
        />
        <Route 
          path="*" 
          element={
            <PageTransition mode="scale">
              <NotFound />
            </PageTransition>
          } 
        />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AnimatedRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
