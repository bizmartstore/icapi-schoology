const PREFIX = "icapi_chat_read";

export const chatReadKey = (userId: string, sectionId: string) =>
  `${PREFIX}_${userId}_${sectionId}`;

export const privateReadKey = (userId: string, sectionId: string, peerId: string) =>
  `${PREFIX}_priv_${userId}_${sectionId}_${peerId}`;

export const privateThreadKey = (sectionId: string, peerId: string) => `${sectionId}:${peerId}`;

export const getSectionLastRead = (userId: string, sectionId: string): string => {
  try {
    return localStorage.getItem(chatReadKey(userId, sectionId)) || "1970-01-01T00:00:00.000Z";
  } catch {
    return "1970-01-01T00:00:00.000Z";
  }
};

export const getPrivateLastRead = (userId: string, sectionId: string, peerId: string): string => {
  try {
    return localStorage.getItem(privateReadKey(userId, sectionId, peerId)) || "1970-01-01T00:00:00.000Z";
  } catch {
    return "1970-01-01T00:00:00.000Z";
  }
};

export const markSectionRead = (userId: string, sectionId: string, at?: string) => {
  try {
    localStorage.setItem(chatReadKey(userId, sectionId), at || new Date().toISOString());
  } catch {
    /* ignore */
  }
};

export const markPrivateRead = (userId: string, sectionId: string, peerId: string, at?: string) => {
  try {
    localStorage.setItem(privateReadKey(userId, sectionId, peerId), at || new Date().toISOString());
  } catch {
    /* ignore */
  }
};
