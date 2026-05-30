import { createContext, useContext, useState, ReactNode } from "react";
import { useUnreadMessages, type UnreadMessagesState } from "@/hooks/useUnreadMessages";

type ActiveChatContextType = UnreadMessagesState & {
  activeSectionId: string | null;
  setActiveSectionId: (id: string | null) => void;
};

const ActiveChatContext = createContext<ActiveChatContextType | null>(null);

export const UnreadMessagesProvider = ({ children }: { children: ReactNode }) => {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const unread = useUnreadMessages(activeSectionId);

  return (
    <ActiveChatContext.Provider value={{ ...unread, activeSectionId, setActiveSectionId }}>
      {children}
    </ActiveChatContext.Provider>
  );
};

export const useUnreadMessagesContext = () => {
  const ctx = useContext(ActiveChatContext);
  if (!ctx) {
    return {
      totalUnread: 0,
      unreadBySection: {},
      loading: false,
      markSectionRead: () => {},
      refreshUnread: () => {},
      activeSectionId: null,
      setActiveSectionId: () => {},
    } satisfies ActiveChatContextType;
  }
  return ctx;
};
