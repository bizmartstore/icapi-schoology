import { LayoutDashboard, BookOpen, Calendar, MessageCircle, BarChart3, Bell, UserCheck } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", requiresAuth: false, emoji: "🏠" },
  { icon: BookOpen, label: "Subjects", path: "/subjects", requiresAuth: false, emoji: "📚" },
  { icon: Calendar, label: "Calendar", path: "/calendar", requiresAuth: true, emoji: "📅" },
  { icon: MessageCircle, label: "Messages", path: "/messages", requiresAuth: true, emoji: "💬" },
  { icon: BarChart3, label: "Grades", path: "/grades", requiresAuth: true, emoji: "📊" },
  { icon: Bell, label: "Alerts", path: "/notifications", requiresAuth: true, emoji: "🔔" },
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

  const allItems = isTeacher
    ? [...menuItems, { icon: UserCheck, label: "Approvals", path: "/approvals", requiresAuth: true, emoji: "✅" }]
    : menuItems;

  return (
    <div className="bg-card border-b border-border py-3">
      <div className="grid grid-cols-4 gap-y-3 px-2">
        {allItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => handleClick(item)}
              className="flex flex-col items-center gap-1 transition-all duration-150 active:scale-95"
            >
              <div className={`h-11 w-11 rounded-full flex items-center justify-center transition-all ${
                isActive
                  ? "bg-primary/10 ring-2 ring-primary/20"
                  : "bg-background"
              }`}>
                <span className="text-xl">{item.emoji}</span>
              </div>
              <span className={`text-[10px] font-medium leading-tight ${isActive ? "text-primary font-bold" : "text-foreground"}`}>
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
