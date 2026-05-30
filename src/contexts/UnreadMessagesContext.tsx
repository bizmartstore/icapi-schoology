import { createContext, useContext, useState, ReactNode } from "react";
import { useUnreadMessages, type ActiveChat, type UnreadMessagesState } from "@/hooks/useUnreadMessages";

type ActiveChatContextType = UnreadMessagesState & {
  activeChat: ActiveChat;
  setActiveChat: (chat: ActiveChat) => void;
  /** @deprecated use setActiveChat */
  activeSectionId: string | null;
  /** @deprecated use setActiveChat */
  setActiveSectionId: (id: string | null) => void;
};

const ActiveChatContext = createContext<ActiveChatContextType | null>(null);

export const UnreadMessagesProvider = ({ children }: { children: ReactNode }) => {
  const [activeChat, setActiveChat] = useState<ActiveChat>(null);
  const unread = useUnreadMessages(activeChat);

  const setActiveSectionId = (id: string | null) => {
    setActiveChat(id ? { sectionId: id, peerId: null } : null);
  };

  return (
    <ActiveChatContext.Provider
      value={{
        ...unread,
        activeChat,
        setActiveChat,
        activeSectionId: activeChat?.sectionId ?? null,
        setActiveSectionId,
      }}
    >
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
      unreadByPrivate: {},
      loading: false,
      markSectionRead: () => {},
      markPrivateRead: () => {},
      refreshUnread: () => {},
      activeChat: null,
      setActiveChat: () => {},
      activeSectionId: null,
      setActiveSectionId: () => {},
    } satisfies ActiveChatContextType;
  }
  return ctx;
};

export type { ActiveChat };
