import { LayoutDashboard, BookOpen, Calendar, MessageCircle, BarChart3, Bell } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: BookOpen, label: "Subjects", path: "/subjects" },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
  { icon: MessageCircle, label: "Messages", path: "/messages" },
  { icon: BarChart3, label: "Grades", path: "/grades" },
  { icon: Bell, label: "Alerts", path: "/notifications" },
];

const QuickAccessMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="px-4 py-3">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
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
