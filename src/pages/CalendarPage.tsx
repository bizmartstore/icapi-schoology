import { useEffect, useMemo, useState } from "react";
import LMSHeader from "@/components/lms/LMSHeader";
import QuickAccessMenu from "@/components/lms/QuickAccessMenu";
import { ChevronLeft, ChevronRight, Lock, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSectionMembership } from "@/hooks/useSectionMembership";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type CalendarEvent = {
  id: string;
  day: number;
  title: string;
  color: string;
  time: string;
  kind: "activity" | "quiz";
  date: Date;
};

const CalendarPage = () => {
  const { user, roles } = useAuth();
  const { memberSectionIds, isMemberOfAny } = useSectionMembership();
  const isTeacher = roles.includes("teacher");
  const [viewDate, setViewDate] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherSectionIds, setTeacherSectionIds] = useState<string[]>([]);

  useEffect(() => {
    const loadTeacherSections = async () => {
      if (!user || !isTeacher) return;
      const [{ data: advisory }, { data: teaching }] = await Promise.all([
        supabase.from("sections").select("id").eq("adviser_id", user.id),
        supabase.from("section_subjects").select("section_id").eq("teacher_id", user.id),
      ]);
      const ids = new Set<string>();
      (advisory || []).forEach((s: { id: string }) => ids.add(s.id));
      (teaching || []).forEach((s: { section_id: string }) => ids.add(s.section_id));
      setTeacherSectionIds([...ids]);
    };
    loadTeacherSections();
  }, [user?.id, isTeacher]);

  const sectionIds = isTeacher ? teacherSectionIds : memberSectionIds;
  const hasSections = sectionIds.length > 0;

  useEffect(() => {
    const load = async () => {
      if (!user || !hasSections) {
        setEvents([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data: ssRows } = await api
        .from("section_subjects")
        .select("id, subject_id, section_id")
        .in("section_id", sectionIds);

      const ss = ssRows || [];
      if (ss.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const ssIds = ss.map((s) => s.id);
      const subjectIds = [...new Set(ss.map((s) => s.subject_id))];

      const [{ data: actRows }, { data: quizRows }, { data: subjRows }] = await Promise.all([
        supabase.from("activities").select("id, title, due_date, section_subject_id, is_active").eq("is_active", true).in("section_subject_id", ssIds).not("due_date", "is", null),
        supabase.from("quizzes").select("id, title, created_at, section_subject_id, is_published").eq("is_published", true).in("section_subject_id", ssIds),
        supabase.from("subjects").select("id, name, color").in("id", subjectIds),
      ]);

      const ssMap: Record<string, string> = {};
      ss.forEach((s) => (ssMap[s.id] = s.subject_id));

      const subjMap: Record<string, { name: string; color: string }> = {};
      (subjRows || []).forEach((s: { id: string; name: string; color: string | null }) => {
        subjMap[s.id] = { name: s.name, color: s.color || "bg-primary" };
      });

      const list: CalendarEvent[] = [];

      (actRows || []).forEach((a: { id: string; title: string; due_date: string; section_subject_id: string }) => {
        const subjId = ssMap[a.section_subject_id];
        const subj = subjId ? subjMap[subjId] : null;
        const date = new Date(a.due_date);
        list.push({
          id: `a-${a.id}`,
          day: date.getDate(),
          title: a.title,
          color: subj?.color || "bg-primary",
          time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          kind: "activity",
          date,
        });
      });

      (quizRows || []).forEach((q: { id: string; title: string; created_at: string; section_subject_id: string }) => {
        const subjId = ssMap[q.section_subject_id];
        const subj = subjId ? subjMap[subjId] : null;
        const date = new Date(q.created_at);
        list.push({
          id: `q-${q.id}`,
          day: date.getDate(),
          title: `${q.title} (Quiz)`,
          color: subj?.color || "bg-primary",
          time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          kind: "quiz",
          date,
        });
      });

      setEvents(list);
      setLoading(false);
    };

    load();
  }, [user?.id, sectionIds.join(",")]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const currentMonth = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOffset = new Date(year, month, 1).getDay();
  const today = new Date();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddedDays = Array.from({ length: firstDayOffset }, () => null).concat(days);

  const monthEvents = useMemo(
    () => events.filter((e) => e.date.getFullYear() === year && e.date.getMonth() === month),
    [events, year, month]
  );

  const upcomingEvents = useMemo(
    () =>
      [...events]
        .filter((e) => e.date >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 10),
    [events]
  );

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  if (!isTeacher && !isMemberOfAny) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <LMSHeader />
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
            <Lock className="h-10 w-10 text-primary mx-auto mb-3" />
            <p className="text-sm font-bold text-foreground">Join a section to see your calendar</p>
            <p className="text-xs text-muted-foreground mt-1">Activities and quizzes with due dates will appear here.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <LMSHeader />
      <div className="max-w-3xl mx-auto">
        <QuickAccessMenu />
        <div className="px-4 space-y-4">
          <div className="bg-card rounded-2xl p-4 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={prevMonth} className="p-1 hover:bg-muted rounded-lg transition-colors" aria-label="Previous month">
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </button>
              <h2 className="text-base font-bold text-foreground">{currentMonth}</h2>
              <button type="button" onClick={nextMonth} className="p-1 hover:bg-muted rounded-lg transition-colors" aria-label="Next month">
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {daysOfWeek.map((d) => (
                <span key={d} className="text-[10px] font-semibold text-muted-foreground">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {paddedDays.map((day, i) => {
                const dayEvents = day ? monthEvents.filter((e) => e.day === day) : [];
                const isToday =
                  day === today.getDate() &&
                  month === today.getMonth() &&
                  year === today.getFullYear();
                return (
                  <div
                    key={i}
                    className={`h-10 flex flex-col items-center justify-center rounded-xl text-sm relative ${
                      isToday ? "bg-primary text-primary-foreground font-bold" : day ? "text-foreground hover:bg-muted cursor-pointer" : ""
                    }`}
                  >
                    {day && <span className="text-xs">{day}</span>}
                    {dayEvents.length > 0 && (
                      <span className={`h-1.5 w-1.5 rounded-full ${dayEvents[0].color} absolute bottom-1`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <h3 className="text-sm font-bold text-foreground">Upcoming Events</h3>
          {loading ? (
            <div className="text-center py-6 text-sm text-muted-foreground">Loading events...</div>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-center py-8">
              <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No upcoming events</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map((e, i) => (
                <div key={e.id} className="bg-card rounded-2xl p-3 px-4 card-shadow flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className={`h-10 w-10 rounded-xl ${e.color} flex items-center justify-center text-primary-foreground font-bold text-sm`}>
                    {e.date.getDate()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{e.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {e.date.toLocaleDateString()} · {e.time} · {e.kind}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
