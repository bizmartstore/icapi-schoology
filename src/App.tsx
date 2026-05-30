import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import InstallPWA from "@/components/lms/InstallPWA";
import Index from "./pages/Index.tsx";
import SubjectDetail from "./pages/SubjectDetail.tsx";
import CalendarPage from "./pages/CalendarPage.tsx";
import MessagesPage from "./pages/MessagesPage.tsx";
import GradesPage from "./pages/GradesPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import SignupPage from "./pages/SignupPage.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import TeacherApprovalPage from "./pages/TeacherApprovalPage.tsx";
import TeacherSectionsPage from "./pages/TeacherSectionsPage.tsx";
import SectionDetail from "./pages/SectionDetail.tsx";
import TeachSubjectDashboard from "./pages/TeachSubjectDashboard.tsx";
import StudentSubjectView from "./pages/StudentSubjectView.tsx";
import CompleteProfilePage from "./pages/CompleteProfilePage.tsx";

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, profile } = useAuth();
  if (loading) return <LoadingScreen />;
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

const TeacherRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, profile, roles } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (profile && profile.approval_status !== "approved") return <Navigate to="/login" replace />;
  if (!roles.includes("teacher") && !roles.includes("admin")) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, profile } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user && !profile) return <Navigate to="/complete-profile" replace />;
  if (user && profile?.approval_status === "approved") return <Navigate to="/" replace />;
  return <>{children}</>;
};

const ProfileGate = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (user && !profile && location.pathname !== "/complete-profile") {
    return <Navigate to="/complete-profile" replace />;
  }
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ProfileGate>
          <InstallPWA />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/subjects" element={<Index />} />

            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
            <Route path="/complete-profile" element={<CompleteProfilePage />} />
            <Route path="/signup/student" element={<Navigate to="/signup?type=student" replace />} />
            <Route path="/signup/teacher" element={<Navigate to="/signup?type=teacher" replace />} />

            <Route path="/subject/:id" element={<SubjectDetail />} />
            <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            <Route path="/grades" element={<ProtectedRoute><GradesPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/approvals" element={<ProtectedRoute><TeacherRoute><TeacherApprovalPage /></TeacherRoute></ProtectedRoute>} />
            <Route path="/sections" element={<ProtectedRoute><TeacherRoute><TeacherSectionsPage /></TeacherRoute></ProtectedRoute>} />
            <Route path="/section/:id" element={<SectionDetail />} />
            <Route path="/teach/:ssId" element={<ProtectedRoute><TeachSubjectDashboard /></ProtectedRoute>} />
            <Route path="/learn/:ssId" element={<ProtectedRoute><StudentSubjectView /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </ProfileGate>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
