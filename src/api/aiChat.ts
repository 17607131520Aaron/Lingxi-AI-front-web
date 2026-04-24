import { http } from "@/utils/request";

export interface ChatSession {
  sessionId: string;
  title: string;
  updatedAt: number;
}

export interface SessionMessageApi {
  role: "user" | "assistant";
  content: string;
  enableWebSearch: boolean;
  createdAt: number;
}

export const listSessions = () => http.get<ChatSession[]>("/ai/sessions");

export const createSession = (sessionId?: string) =>
  http.post<ChatSession>("/ai/sessions", undefined, {
    params: sessionId ? { sessionId } : undefined,
  });

export const listSessionMessages = (sessionId: string) =>
  http.get<SessionMessageApi[]>(`/ai/sessions/${sessionId}/messages`);

export const deleteSession = (sessionId: string) => http.delete<boolean>(`/ai/sessions/${sessionId}`);
