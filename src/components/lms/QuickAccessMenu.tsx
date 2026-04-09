import { LayoutDashboard, BookOpen, Calendar, MessageCircle, BarChart3, Bell } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", requiresAuth: false },
  { icon: BookOpen, label: "Subjects", path: "/subjects", requiresAuth: false },
  { icon: Calendar, label: "Calendar", path: "/calendar", requiresAuth: true },
  { icon: MessageCircle, label: "Messages", path: "/messages", requiresAuth: true },
  { icon: BarChart3, label: "Grades", path: "/grades", requiresAuth: true },
  { icon: Bell, label: "Alerts", path: "/notifications", requiresAuth: true },
];

const QuickAccessMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const isLoggedIn = !!user && profile?.approval_status === "approved";

  const handleClick = (item: typeof menuItems[0]) => {
    if (item.requiresAuth && !isLoggedIn) {
      toast.info("Please login to access this feature");
      navigate("/login");
      return;
    }
    navigate(item.path);
  };

  return (
    <div className="px-4 py-3">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => handleClick(item)}
              className={`flex flex-col items-center gap-1.5 min-w-[64px] transition-all duration-200 ${
                isActive ? "scale-105" : "hover:scale-105"
              }`}
            >
              <div
                className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground card-shadow"
                    : "bg-card text-muted-foreground card-shadow hover:card-shadow-hover"
                }`}
              >
                <item.icon className="h-5 w-5" />
              </div>
              <span className={`text-[11px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickAccessMenu;
