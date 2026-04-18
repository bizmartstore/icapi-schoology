import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, BookOpen, Calendar, MessageCircle, BarChart3, Bell, UserCheck, School } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSectionMembership } from "@/hooks/useSectionMembership";
import { toast } from "sonner";

type MenuItem = {
  icon: any;
  label: string;
  path: string;
  requiresAuth: boolean;
  requiresSection?: boolean;
  emoji: string;
  gradient: string;
};

type MenuItemX = MenuItem & { comingSoon?: boolean };

const menuItems: MenuItemX[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", requiresAuth: false, emoji: "🏠", gradient: "from-primary to-primary/80" },
  { icon: BookOpen, label: "Subjects", path: "/subjects", requiresAuth: true, requiresSection: true, emoji: "📚", gradient: "from-subject-science to-subject-science/80" },
  { icon: Calendar, label: "Calendar", path: "/calendar", requiresAuth: true, requiresSection: true, emoji: "📅", gradient: "from-info to-info/80" },
  { icon: MessageCircle, label: "Messages", path: "/messages", requiresAuth: false, emoji: "💬", gradient: "from-subject-english to-subject-english/80", comingSoon: true },
  { icon: BarChart3, label: "Grades", path: "/grades", requiresAuth: true, requiresSection: true, emoji: "📊", gradient: "from-subject-ap to-subject-ap/80" },
  { icon: Bell, label: "Alerts", path: "/notifications", requiresAuth: false, emoji: "🔔", gradient: "from-warning to-warning/80", comingSoon: true },
];

const QuickAccessMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, roles } = useAuth();
  const { isMemberOfAny } = useSectionMembership();
  const isLoggedIn = !!user && profile?.approval_status === "approved";
  const isTeacher = roles.includes("teacher");
  const isStudent = roles.includes("student");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  const handleClick = (item: MenuItemX) => {
    if (item.comingSoon) {
      toast.info(`${item.label} is coming soon! 🚀`);
      return;
    }
    if (item.requiresAuth && !isLoggedIn) {
      toast.info("Please login to access this feature");
      navigate("/login");
      return;
    }
    // Students must join a section to access gated features. Teachers/admins bypass.
    if (item.requiresSection && isStudent && !isMemberOfAny) {
      toast.info("Join a section first to unlock this");
      return;
    }
    navigate(item.path);
  };

  const allItems: MenuItemX[] = isTeacher
    ? [
        ...menuItems,
        { icon: School, label: "Sections", path: "/sections", requiresAuth: true, emoji: "🏫", gradient: "from-info to-info/80" },
        { icon: UserCheck, label: "Approvals", path: "/approvals", requiresAuth: true, emoji: "✅", gradient: "from-success to-success/80" },
      ]
    : menuItems;

  // Auto-scroll marquee effect — RTL (right to left), much slower
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Start at end so visible motion is right-to-left
    el.scrollLeft = el.scrollWidth / 2;
    let animId: number;
    const speed = 0.04; // very slow

    const step = () => {
      if (!paused && el) {
        el.scrollLeft -= speed;
        if (el.scrollLeft <= 0) {
          el.scrollLeft = el.scrollWidth / 2;
        }
      }
      animId = requestAnimationFrame(step);
    };
    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [paused]);

  // Duplicate items for seamless loop
  const loopItems = [...allItems, ...allItems];

  return (
    <div className="bg-card border-b border-border py-3">
      <div
        ref={scrollRef}
        className="flex gap-3 px-3 overflow-x-auto scrollbar-hide"
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {loopItems.map((item, idx) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={`${item.label}-${idx}`}
              onClick={() => handleClick(item)}
              className="flex flex-col items-center gap-1.5 min-w-[60px] transition-all duration-200 active:scale-90"
            >
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
                isActive
                  ? "bg-gradient-to-br from-primary to-primary/80 shadow-md shadow-primary/25 scale-105"
                  : "bg-gradient-to-br from-muted to-muted/80"
              }`}>
                <span className="text-2xl drop-shadow-sm">{item.emoji}</span>
              </div>
              <span className={`text-[10px] font-semibold leading-tight whitespace-nowrap ${isActive ? "text-primary font-bold" : "text-foreground"}`}>
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
