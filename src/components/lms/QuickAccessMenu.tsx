import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, BookOpen, Calendar, MessageCircle, BarChart3, Bell, UserCheck, School, Shield, PartyPopper } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSectionMembership } from "@/hooks/useSectionMembership";
import { usePendingBadges } from "@/hooks/usePendingBadges";
import { useUnreadMessagesContext } from "@/contexts/UnreadMessagesContext";
import { toast } from "sonner";

type MenuItem = {
  icon: any;
  label: string;
  path: string;
  requiresAuth: boolean;
  requiresSection?: boolean;
  emoji: string;
  gradient: string;
  badge?: number;
};

const QuickAccessMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, roles } = useAuth();
  const { isMemberOfAny } = useSectionMembership();
  const badges = usePendingBadges();
  const { totalUnread } = useUnreadMessagesContext();
  const isLoggedIn = !!user && profile?.approval_status === "approved";
  const isTeacher = roles.includes("teacher");
  const isAdmin = roles.includes("admin");
  const isStudent = roles.includes("student");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const resumeTimer = useRef<number | null>(null);
  const isProgrammaticScroll = useRef(false);
  const pausedRef = useRef(false);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  const pauseFor = (ms = 2500) => {
    setPaused(true);
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => setPaused(false), ms);
  };

  const handleClick = (item: MenuItem) => {
    if (item.requiresAuth && !isLoggedIn) {
      toast.info("Please login to access this feature");
      navigate("/login");
      return;
    }
    if (item.requiresSection && isStudent && !isMemberOfAny) {
      toast.info("Join a section first to unlock this");
      return;
    }
    if (item.path === "/notifications") {
      navigate("/");
      requestAnimationFrame(() => {
        document.getElementById("announcements")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return;
    }
    navigate(item.path);
  };

  const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/", requiresAuth: false, emoji: "🏠", gradient: "from-primary to-primary/80" },
    { icon: BookOpen, label: "Subjects", path: "/subjects", requiresAuth: true, requiresSection: true, emoji: "📚", gradient: "from-subject-science to-subject-science/80" },
    { icon: Calendar, label: "Calendar", path: "/calendar", requiresAuth: true, requiresSection: true, emoji: "📅", gradient: "from-info to-info/80" },
    { icon: PartyPopper, label: "Events", path: "/events", requiresAuth: false, emoji: "🎉", gradient: "from-accent to-accent/80" },
    { icon: MessageCircle, label: "Messages", path: "/messages", requiresAuth: true, emoji: "💬", gradient: "from-subject-english to-subject-english/80", badge: totalUnread },
    { icon: BarChart3, label: "Grades", path: "/grades", requiresAuth: true, requiresSection: true, emoji: "📊", gradient: "from-subject-ap to-subject-ap/80" },
    { icon: Bell, label: "Alerts", path: "/notifications", requiresAuth: true, emoji: "🔔", gradient: "from-warning to-warning/80" },
  ];

  const teacherExtras: MenuItem[] = isTeacher
    ? [
        {
          icon: School,
          label: "Sections",
          path: "/sections",
          requiresAuth: true,
          emoji: "🏫",
          gradient: "from-info to-info/80",
          badge: badges.sectionJoinRequests,
        },
        {
          icon: UserCheck,
          label: "Approvals",
          path: "/approvals",
          requiresAuth: true,
          emoji: "✅",
          gradient: "from-success to-success/80",
          badge: badges.studentApprovals,
        },
      ]
    : [];

  const adminExtras: MenuItem[] = isAdmin
    ? [
        {
          icon: Shield,
          label: "Admin",
          path: "/admin",
          requiresAuth: true,
          emoji: "🛡️",
          gradient: "from-primary to-primary/80",
          badge: badges.adminApprovals,
        },
        ...(!isTeacher
          ? [
              {
                icon: UserCheck,
                label: "Approvals",
                path: "/admin",
                requiresAuth: true,
                emoji: "✅",
                gradient: "from-success to-success/80",
                badge: badges.adminApprovals,
              },
            ]
          : []),
      ]
    : [];

  const allItems: MenuItem[] = [...menuItems, ...teacherExtras, ...adminExtras];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let acc = 0;
    let animId: number;
    const speed = 0.25;

    const step = () => {
      if (!pausedRef.current && el) {
        acc += speed;
        if (acc >= 1) {
          const inc = Math.floor(acc);
          acc -= inc;
          isProgrammaticScroll.current = true;
          const half = el.scrollWidth / 2;
          let next = el.scrollLeft + inc;
          if (half > 0 && next >= half) next -= half;
          el.scrollLeft = next;
          requestAnimationFrame(() => { isProgrammaticScroll.current = false; });
        }
      }
      animId = requestAnimationFrame(step);
    };
    animId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(animId);
      if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    };
  }, []);

  const loopItems = [...allItems, ...allItems];

  return (
    <div className="bg-card border-b border-border py-3">
      <div
        ref={scrollRef}
        className="flex gap-3 px-3 overflow-x-auto scrollbar-hide"
        onTouchStart={() => pauseFor(3000)}
        onTouchEnd={() => pauseFor(3000)}
        onWheel={() => pauseFor(2500)}
        onScroll={() => { if (!isProgrammaticScroll.current) pauseFor(2500); }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => pauseFor(1500)}
      >
        {loopItems.map((item, idx) => {
          const isActive = location.pathname === item.path || (item.path === "/notifications" && location.pathname === "/");
          const showBadge = (item.badge ?? 0) > 0;
          return (
            <button
              key={`${item.label}-${idx}`}
              onClick={() => { pauseFor(2500); handleClick(item); }}
              className="flex flex-col items-center gap-1.5 min-w-[60px] transition-all duration-200 active:scale-90 relative"
            >
              <div className={`relative h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
                isActive
                  ? "bg-gradient-to-br from-primary to-primary/80 shadow-md shadow-primary/25 scale-105"
                  : "bg-gradient-to-br from-muted to-muted/80"
              }`}>
                <span className="text-2xl drop-shadow-sm">{item.emoji}</span>
                {showBadge && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-extrabold flex items-center justify-center border-2 border-card shadow-sm">
                    {item.badge! > 9 ? "9+" : item.badge}
                  </span>
                )}
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
