import { LayoutDashboard, BookOpen, Calendar, MessageCircle, BarChart3, Bell, UserCheck } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", requiresAuth: false, color: "from-primary to-primary/70", bgLight: "bg-primary/10", textColor: "text-primary" },
  { icon: BookOpen, label: "Subjects", path: "/subjects", requiresAuth: false, color: "from-subject-english to-subject-english/70", bgLight: "bg-subject-english/10", textColor: "text-subject-english" },
  { icon: Calendar, label: "Calendar", path: "/calendar", requiresAuth: true, color: "from-success to-success/70", bgLight: "bg-success/10", textColor: "text-success" },
  { icon: MessageCircle, label: "Messages", path: "/messages", requiresAuth: true, color: "from-info to-info/70", bgLight: "bg-info/10", textColor: "text-info" },
  { icon: BarChart3, label: "Grades", path: "/grades", requiresAuth: true, color: "from-accent to-accent/70", bgLight: "bg-accent/10", textColor: "text-accent" },
  { icon: Bell, label: "Alerts", path: "/notifications", requiresAuth: true, color: "from-subject-ap to-subject-ap/70", bgLight: "bg-subject-ap/10", textColor: "text-subject-ap" },
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
    <div className="px-4">
      <div className="bg-card rounded-2xl card-shadow p-3">
        <div className="grid grid-cols-4 gap-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={() => handleClick(item)}
                className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 scale-[1.02]"
                    : "hover:bg-muted/60"
                }`}
              >
                <div
                  className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? `bg-gradient-to-br ${item.color} text-primary-foreground shadow-md`
                      : `${item.bgLight} ${item.textColor}`
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                </div>
                <span className={`text-[10px] font-semibold leading-tight ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {isTeacher && (
            <button
              onClick={() => navigate("/approvals")}
              className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all duration-200 hover:bg-muted/60"
            >
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center bg-destructive/10 text-destructive">
                <UserCheck className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground leading-tight">Approvals</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickAccessMenu;
