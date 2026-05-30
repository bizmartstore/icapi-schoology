import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CornerDownRight, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  recipient_id?: string | null;
  reply_to_id?: string | null;
};

type Props = {
  message: ChatMessage;
  profile?: ChatProfile;
  isMine: boolean;
  fmtTime: (iso: string) => string;
  compact?: boolean;
  replyPreview?: { author: string; content: string } | null;
  onReply?: () => void;
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

const ChatMessageBubble = ({
  message,
  profile,
  isMine,
  fmtTime,
  compact,
  replyPreview,
  onReply,
}: Props) => {
  const name = displayName(message, profile);
  const avatarSrc = profile?.avatar_data || undefined;
  const avatarSize = compact ? "h-6 w-6" : "h-7 w-7";
  const textSize = compact ? "text-xs" : "text-sm";
  const nameSize = compact ? "text-[9px]" : "text-[10px]";
  const timeSize = compact ? "text-[8px]" : "text-[10px]";

  return (
    <div className={`flex gap-2 group ${isMine ? "flex-row-reverse" : "flex-row"}`}>
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
        <div className={`flex items-center gap-1 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
          <p className={`${nameSize} font-bold ${isMine ? "text-primary text-right" : "text-muted-foreground"}`}>
            {name}
          </p>
          {onReply && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onReply}
              aria-label="Reply"
            >
              <Reply className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div
          className={`rounded-2xl px-3 py-1.5 ${
            isMine
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-card border border-border text-foreground rounded-bl-md"
          } ${compact ? "" : "card-shadow"}`}
        >
          {replyPreview && (
            <div
              className={`mb-1.5 pl-2 border-l-2 text-[10px] leading-snug ${
                isMine ? "border-primary-foreground/40 text-primary-foreground/80" : "border-primary/40 text-muted-foreground"
              }`}
            >
              <span className="font-bold flex items-center gap-0.5">
                <CornerDownRight className="h-2.5 w-2.5" />
                {replyPreview.author}
              </span>
              <p className="line-clamp-2">{replyPreview.content}</p>
            </div>
          )}
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
