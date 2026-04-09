import { LayoutDashboard, BookOpen, Calendar, MessageCircle, BarChart3, Bell, Sparkles, UserCheck } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", requiresAuth: false, color: "from-primary to-primary/70" },
  { icon: BookOpen, label: "Subjects", path: "/subjects", requiresAuth: false, color: "from-subject-english to-subject-english/70" },
  { icon: Calendar, label: "Calendar", path: "/calendar", requiresAuth: true, color: "from-success to-success/70" },
  { icon: MessageCircle, label: "Messages", path: "/messages", requiresAuth: true, color: "from-info to-info/70" },
  { icon: BarChart3, label: "Grades", path: "/grades", requiresAuth: true, color: "from-accent to-accent/70" },
  { icon: Bell, label: "Alerts", path: "/notifications", requiresAuth: true, color: "from-subject-ap to-subject-ap/70" },
];

const QuickAccessMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, roles } = useAuth();
  const isLoggedIn = !!user && profile?.approval_status === "approved";
  const isTeacher = roles.includes("teacher");

  const handleClick = (item: typeof menuItems[0]) => {
    if (item.requiresAuth && !isLoggedIn) {
      toast.info("Please login to access this feature");
      navigate("/login");
      return;
    }
    navigate(item.path);
  };

  return (
    <div className="px-4 py-2">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => handleClick(item)}
              className={`flex flex-col items-center gap-1.5 min-w-[60px] transition-all duration-200 ${
                isActive ? "scale-105" : "hover:scale-105"
              }`}
            >
              <div
                className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? `bg-gradient-to-br ${item.color} text-primary-foreground shadow-lg`
                    : "bg-card text-muted-foreground card-shadow hover:card-shadow-hover"
                }`}
              >
                <item.icon className="h-5 w-5" />
              </div>
              <span className={`text-[10px] font-semibold ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Teacher-only approval button */}
        {isTeacher && (
          <button
            onClick={() => navigate("/approvals")}
            className="flex flex-col items-center gap-1.5 min-w-[60px] transition-all duration-200 hover:scale-105"
          >
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-card text-muted-foreground card-shadow hover:card-shadow-hover">
              <UserCheck className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground">Approvals</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default QuickAccessMenu;
