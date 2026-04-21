import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/ProtectedRoute";

const DashboardLayout = lazy(() => import("@/components/dashboard/DashboardLayout"));
const DashboardHome = lazy(() => import("@/pages/DashboardHome"));
const ProductsPage = lazy(() => import("@/pages/ProductsPage"));
const CategoriesPage = lazy(() => import("@/pages/CategoriesPage"));
const OrdersPage = lazy(() => import("@/pages/OrdersPage"));
const CustomersPage = lazy(() => import("@/pages/CustomersPage"));
const PaymentsPage = lazy(() => import("@/pages/PaymentsPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const HeroBannerPage = lazy(() => import("@/pages/HeroBannerPage"));
const AccessControlPage = lazy(() => import("@/pages/AccessControlPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AdminRootRedirect() {
  const token = localStorage.getItem("admin_access_token");
  return <Navigate to={token ? "/dashboard" : "/login"} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <Routes>
            <Route path="/" element={<AdminRootRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route index element={<DashboardHome />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="hero-banner" element={<HeroBannerPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="access-control" element={<AccessControlPage />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
