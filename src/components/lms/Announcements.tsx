import { Megaphone, ChevronRight } from "lucide-react";

const announcements = [
  { title: "Quarter 2 Exams Schedule Released", from: "School Admin", time: "2 hours ago", preview: "The quarterly examination schedule for all grade levels has been posted..." },
  { title: "Science Fair Registration Open", from: "Ms. Cruz - Science", time: "5 hours ago", preview: "Students interested in joining the Science Fair may now register..." },
  { title: "MAPEH Performance Task Reminder", from: "Ms. Dela Cruz - MAPEH", time: "1 day ago", preview: "Please submit your dance performance video by Friday..." },
];

const Announcements = () => {
  return (
    <section className="px-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-foreground">Recent Announcements</h2>
        <button className="text-xs font-semibold text-primary">View All</button>
      </div>
      <div className="space-y-2">
        {announcements.map((item, i) => (
          <button
            key={i}
            className="w-full bg-card rounded-2xl p-4 card-shadow hover:card-shadow-hover transition-all duration-200 text-left flex gap-3 items-start animate-fade-in"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="h-10 w-10 rounded-xl bg-info/10 flex items-center justify-center flex-shrink-0">
              <Megaphone className="h-5 w-5 text-info" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground mb-0.5 truncate">{item.title}</h3>
              <p className="text-[11px] text-muted-foreground mb-1">{item.from} • {item.time}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{item.preview}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
          </button>
        ))}
      </div>
    </section>
  );
};

export default Announcements;
