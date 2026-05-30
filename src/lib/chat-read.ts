const PREFIX = "icapi_chat_read";

export const chatReadKey = (userId: string, sectionId: string) =>
  `${PREFIX}_${userId}_${sectionId}`;

export const getSectionLastRead = (userId: string, sectionId: string): string => {
  try {
    return localStorage.getItem(chatReadKey(userId, sectionId)) || "1970-01-01T00:00:00.000Z";
  } catch {
    return "1970-01-01T00:00:00.000Z";
  }
};

export const markSectionRead = (userId: string, sectionId: string, at?: string) => {
  try {
    localStorage.setItem(chatReadKey(userId, sectionId), at || new Date().toISOString());
  } catch {
    /* ignore quota errors */
  }
};
