import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import SubjectDetail from "./pages/SubjectDetail.tsx";
import CalendarPage from "./pages/CalendarPage.tsx";
import MessagesPage from "./pages/MessagesPage.tsx";
import GradesPage from "./pages/GradesPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import StudentSignupPage from "./pages/StudentSignupPage.tsx";
import TeacherSignupPage from "./pages/TeacherSignupPage.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import TeacherApprovalPage from "./pages/TeacherApprovalPage.tsx";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, profile } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (profile && profile.approval_status !== "approved") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center bg-card rounded-2xl p-8 card-shadow max-w-md">
          <h2 className="text-lg font-bold text-foreground mb-2">Account Pending Approval</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {profile.user_type === "teacher"
              ? "Your account is pending admin approval. You'll be able to log in once approved."
              : "Your account is pending teacher approval. You'll be able to log in once approved."}
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, profile } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (user && profile?.approval_status === "approved") return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/signup/student" element={<PublicRoute><StudentSignupPage /></PublicRoute>} />
            <Route path="/signup/teacher" element={<PublicRoute><TeacherSignupPage /></PublicRoute>} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/subjects" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/subject/:id" element={<ProtectedRoute><SubjectDetail /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            <Route path="/grades" element={<ProtectedRoute><GradesPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/approvals" element={<ProtectedRoute><TeacherApprovalPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
