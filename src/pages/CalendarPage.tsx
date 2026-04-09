import { useState } from "react";
import LMSHeader from "@/components/lms/LMSHeader";
import QuickAccessMenu from "@/components/lms/QuickAccessMenu";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const events = [
  { day: 10, title: "Math Quiz", color: "bg-subject-math", time: "10:00 AM" },
  { day: 12, title: "Science Lab Report Due", color: "bg-subject-science", time: "11:59 PM" },
  { day: 15, title: "Filipino Oral Exam", color: "bg-subject-filipino", time: "2:00 PM" },
  { day: 18, title: "MAPEH Performance Task", color: "bg-subject-mapeh", time: "9:00 AM" },
  { day: 20, title: "English Essay Due", color: "bg-subject-english", time: "11:59 PM" },
];

const CalendarPage = () => {
  const [currentMonth] = useState("January 2025");
  const daysInMonth = 31;
  const firstDayOffset = 3; // Wednesday

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddedDays = Array.from({ length: firstDayOffset }, () => null).concat(days);

  return (
    <div className="min-h-screen bg-background pb-8">
      <LMSHeader />
      <div className="max-w-3xl mx-auto">
        <QuickAccessMenu />
        <div className="px-4 space-y-4">
          <div className="bg-card rounded-2xl p-4 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <button className="p-1"><ChevronLeft className="h-5 w-5 text-muted-foreground" /></button>
              <h2 className="text-base font-bold text-foreground">{currentMonth}</h2>
              <button className="p-1"><ChevronRight className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {daysOfWeek.map(d => (
                <span key={d} className="text-[10px] font-semibold text-muted-foreground">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {paddedDays.map((day, i) => {
                const event = events.find(e => e.day === day);
                const isToday = day === 9;
                return (
                  <div key={i} className={`h-10 flex flex-col items-center justify-center rounded-xl text-sm relative ${
                    isToday ? "bg-primary text-primary-foreground font-bold" : day ? "text-foreground hover:bg-muted cursor-pointer" : ""
                  }`}>
                    {day && <span className="text-xs">{day}</span>}
                    {event && <span className={`h-1.5 w-1.5 rounded-full ${event.color} absolute bottom-1`} />}
                  </div>
                );
              })}
            </div>
          </div>

          <h3 className="text-sm font-bold text-foreground">Upcoming Events</h3>
          <div className="space-y-2">
            {events.map((e, i) => (
              <div key={i} className="bg-card rounded-2xl p-3 px-4 card-shadow flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                <div className={`h-10 w-10 rounded-xl ${e.color} flex items-center justify-center text-primary-foreground font-bold text-sm`}>
                  {e.day}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{e.title}</p>
                  <p className="text-[11px] text-muted-foreground">{e.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
