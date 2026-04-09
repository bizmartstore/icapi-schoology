import { useState } from "react";
import LMSHeader from "@/components/lms/LMSHeader";
import QuickAccessMenu from "@/components/lms/QuickAccessMenu";
import { Send, Paperclip } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const conversations = [
  { id: 1, name: "Mrs. Santos", subject: "Mathematics", lastMsg: "Please review Module 3 before the quiz", time: "2m ago", unread: 2 },
  { id: 2, name: "Ms. Cruz", subject: "Science", lastMsg: "Lab report template has been uploaded", time: "1h ago", unread: 0 },
  { id: 3, name: "Mr. Reyes", subject: "English", lastMsg: "Great essay! Keep it up.", time: "3h ago", unread: 0 },
  { id: 4, name: "Study Group", subject: "General", lastMsg: "Can someone share notes from today?", time: "5h ago", unread: 5 },
];

const chatMessages = [
  { from: "teacher", text: "Good morning class! Don't forget about the quiz tomorrow.", time: "8:00 AM" },
  { from: "teacher", text: "Please review Module 3 before the quiz. Focus on linear equations.", time: "8:01 AM" },
  { from: "me", text: "Good morning, Ma'am! Will the quiz cover Module 3 only?", time: "8:15 AM" },
  { from: "teacher", text: "Yes, Modules 2 and 3. Make sure to practice the exercises.", time: "8:20 AM" },
  { from: "me", text: "Thank you po, Ma'am! 🙏", time: "8:22 AM" },
];

const MessagesPage = () => {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);

  if (selectedChat !== null) {
    const conv = conversations.find(c => c.id === selectedChat)!;
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <LMSHeader />
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
          <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
            <button onClick={() => setSelectedChat(null)} className="text-sm text-primary font-medium">← Back</button>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">{conv.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-bold text-foreground">{conv.name}</p>
              <p className="text-[10px] text-muted-foreground">{conv.subject}</p>
            </div>
          </div>
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  msg.from === "me"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card card-shadow text-foreground rounded-bl-md"
                }`}>
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${msg.from === "me" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-card border-t border-border p-3">
            <div className="flex items-center gap-2">
              <button className="p-2 text-muted-foreground"><Paperclip className="h-5 w-5" /></button>
              <input className="flex-1 bg-muted rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Type a message..." />
              <button className="h-9 w-9 rounded-full bg-primary flex items-center justify-center">
                <Send className="h-4 w-4 text-primary-foreground" />
              </button>
            </div>
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
        <div className="px-4">
          <h2 className="text-base font-bold text-foreground mb-3">Messages</h2>
          <div className="space-y-2">
            {conversations.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setSelectedChat(c.id)}
                className="w-full bg-card rounded-2xl p-3 px-4 card-shadow flex items-center gap-3 text-left hover:card-shadow-hover transition-all animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">{c.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{c.name}</p>
                    <span className="text-[10px] text-muted-foreground">{c.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{c.lastMsg}</p>
                </div>
                {c.unread > 0 && (
                  <span className="h-5 min-w-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center px-1.5">{c.unread}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
