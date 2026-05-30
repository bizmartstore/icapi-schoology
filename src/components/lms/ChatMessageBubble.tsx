import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type ChatProfile = {
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_data?: string | null;
};

export type ChatMessage = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  sender_name?: string | null;
};

type Props = {
  message: ChatMessage;
  profile?: ChatProfile;
  isMine: boolean;
  fmtTime: (iso: string) => string;
  compact?: boolean;
};

const displayName = (message: ChatMessage, profile?: ChatProfile) => {
  if (message.sender_name?.trim()) return message.sender_name.trim();
  if (profile) return `${profile.first_name} ${profile.last_name}`.trim();
  return "Member";
};

const initials = (name: string) => {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.[0] || "?").toUpperCase();
};

const ChatMessageBubble = ({ message, profile, isMine, fmtTime, compact }: Props) => {
  const name = displayName(message, profile);
  const avatarSrc = profile?.avatar_data || undefined;
  const avatarSize = compact ? "h-6 w-6" : "h-7 w-7";
  const textSize = compact ? "text-xs" : "text-sm";
  const nameSize = compact ? "text-[9px]" : "text-[10px]";
  const timeSize = compact ? "text-[8px]" : "text-[10px]";

  return (
    <div className={`flex gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
      <Avatar className={`${avatarSize} shrink-0 mt-0.5`}>
        <AvatarImage src={avatarSrc} alt={name} />
        <AvatarFallback
          className={`${compact ? "text-[9px]" : "text-[10px]"} font-bold ${
            isMine ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
          }`}
        >
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"} flex flex-col`}>
        <p className={`${nameSize} font-bold mb-0.5 ${isMine ? "text-primary text-right" : "text-muted-foreground"}`}>
          {name}
        </p>
        <div
          className={`rounded-2xl px-3 py-1.5 ${
            isMine
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-card border border-border text-foreground rounded-bl-md"
          } ${compact ? "" : "card-shadow"}`}
        >
          <p className={`${textSize} whitespace-pre-wrap break-words leading-snug`}>{message.content}</p>
          <p className={`${timeSize} mt-0.5 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"} text-right`}>
            {fmtTime(message.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatMessageBubble;
