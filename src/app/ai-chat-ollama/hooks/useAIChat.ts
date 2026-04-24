import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { message } from "antd";

type MessageRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  enableWebSearch?: boolean;
}

interface ChatSession {
  sessionId: string;
  title: string;
  updatedAt: number;
}

interface SocketChatEvent {
  sessionId?: string;
  event?: "delta" | "done" | "error";
  data?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface SessionMessageApi {
  role: MessageRole;
  content: string;
  enableWebSearch: boolean;
  createdAt: number;
}

const AI_CHAT_SOCKET_URL = process.env.NEXT_PUBLIC_AI_CHAT_SOCKET_URL ?? "http://127.0.0.1:9011";
const AI_CHAT_API_URL = process.env.NEXT_PUBLIC_AI_CHAT_API_URL ?? "http://127.0.0.1:9000";
const TYPING_INTERVAL_MS = 25;
const CHARS_PER_TICK = 1;
const TITLE_STOPWORDS =
  /^(请问|请帮我|帮我|我想|我需要|麻烦你|你好|hi|hello|能不能|可以|请|如何|怎么|为什么|想问下|问一下)[，,\s]*/i;
const TITLE_INTENT_PATTERN =
  /(出装|铭文|连招|打法|思路|教学|攻略|技巧|推荐|对线|克制|上分|节奏|阵容|发育|打野|辅助|装备|设置|问题|方案|总结|对比|区别)/;

const useAIChat = () => {
  const generateSessionTitle = useCallback((question: string): string => {
    const normalized = question.replace(/\s+/g, " ").trim();
    if (!normalized) {
      return "新会话";
    }
    const cleaned = normalized.replace(TITLE_STOPWORDS, "").trim();
    const source = cleaned || normalized;
    const splitMatch = source.match(/[。！？!?；;，,]/);
    const sentence = (splitMatch ? source.slice(0, splitMatch.index) : source).trim();
    if (!sentence) {
      return "新会话";
    }
    const intent = sentence.match(TITLE_INTENT_PATTERN)?.[0] ?? "";
    const subject = sentence
      .replace(TITLE_INTENT_PATTERN, "")
      .replace(/[的了呢吗吧呀啊]/g, "")
      .trim();
    let title = sentence;
    if (subject && intent) {
      title = `${subject}${intent}`;
    } else if (subject) {
      title = subject;
    }
    if (title.length > 16) {
      title = `${title.slice(0, 16).trim()}...`;
    }
    return title || "新会话";
  }, []);

  const [inputValue, setInputValue] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState("");
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  const sessionIdRef = useRef("");
  const messagesBySessionRef = useRef<Record<string, ChatMessage[]>>({});
  const socketRef = useRef<Socket | null>(null);
  const pendingTextRef = useRef("");
  const assistantMessageIdRef = useRef<string | null>(null);
  const streamDoneRef = useRef(true);
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const appendAssistantText = useCallback((content: string) => {
    if (!content) {
      return;
    }
    const assistantId = assistantMessageIdRef.current;
    if (!assistantId) {
      return;
    }

    setMessages((prev) => {
      const next = prev.map((item) => (item.id === assistantId ? { ...item, content: `${item.content}${content}` } : item));
      const sessionId = sessionIdRef.current;
      if (sessionId) {
        messagesBySessionRef.current[sessionId] = next;
      }
      return next;
    });
  }, []);

  const refreshSessions = useCallback(async () => {
    const response = await fetch(`${AI_CHAT_API_URL}/ai/sessions`);
    const body: ApiResponse<ChatSession[]> = await response.json();
    const list = body.data ?? [];
    setSessions(list);
    return list;
  }, []);

  const createSession = useCallback(async (): Promise<string> => {
    const response = await fetch(`${AI_CHAT_API_URL}/ai/sessions`, { method: "POST" });
    const body: ApiResponse<ChatSession> = await response.json();
    const created = body.data?.sessionId ?? "";
    if (!created) {
      throw new Error("新建会话失败");
    }
    const list = await refreshSessions();
    const exists = list.some((item) => item.sessionId === created);
    if (!exists) {
      setSessions((prev) => [{ sessionId: created, title: "新会话", updatedAt: Date.now() }, ...prev]);
    }
    return created;
  }, [refreshSessions]);

  const loadSessionMessages = useCallback(async (sessionId: string) => {
    if (!sessionId) {
      setMessages([]);
      return;
    }
    setIsSessionLoading(true);
    try {
      const cached = messagesBySessionRef.current[sessionId];
      if (cached) {
        setMessages(cached);
        return;
      }
      const response = await fetch(`${AI_CHAT_API_URL}/ai/sessions/${sessionId}/messages`);
      const body: ApiResponse<SessionMessageApi[]> = await response.json();
      const items = (body.data ?? []).map((item, index) => ({
        id: `${item.role}-${item.createdAt}-${index}`,
        role: item.role,
        content: item.content,
        enableWebSearch: item.enableWebSearch,
      }));
      setMessages(items);
      messagesBySessionRef.current[sessionId] = items;
    } finally {
      setIsSessionLoading(false);
    }
  }, []);

  const stopTypingIfCompleted = useCallback(() => {
    if (!streamDoneRef.current || pendingTextRef.current.length > 0) {
      return;
    }
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    assistantMessageIdRef.current = null;
    setIsReplying(false);
  }, []);

  const interruptCurrentReply = useCallback(() => {
    streamDoneRef.current = true;
    pendingTextRef.current = "";
    assistantMessageIdRef.current = null;
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsReplying(false);
  }, []);

  const ensureTypingLoop = useCallback(() => {
    if (typingTimerRef.current) {
      return;
    }

    typingTimerRef.current = setInterval(() => {
      if (pendingTextRef.current.length === 0) {
        stopTypingIfCompleted();
        return;
      }

      const chunk = pendingTextRef.current.slice(0, CHARS_PER_TICK);
      pendingTextRef.current = pendingTextRef.current.slice(CHARS_PER_TICK);
      appendAssistantText(chunk);
      stopTypingIfCompleted();
    }, TYPING_INTERVAL_MS);
  }, [appendAssistantText, stopTypingIfCompleted]);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setInputValue(event.target.value);
  };

  const appendError = useCallback(
    (content: string) => {
      streamDoneRef.current = true;
      pendingTextRef.current += `\n${content}`;
      stopTypingIfCompleted();
    },
    [stopTypingIfCompleted],
  );

  const ensureSocketConnected = useCallback((): Promise<Socket> => {
    const current = socketRef.current;
    if (current?.connected) {
      return Promise.resolve(current);
    }

    if (current && !current.connected) {
      return new Promise((resolve, reject) => {
        current.once("connect", () => resolve(current));
        current.once("connect_error", () => reject(new Error("Socket.IO 连接失败")));
      });
    }

    return new Promise((resolve, reject) => {
      try {
        const socket = io(AI_CHAT_SOCKET_URL, {
          transports: ["websocket"],
          autoConnect: true,
        });
        socketRef.current = socket;

        socket.on("chat:delta", (payload: SocketChatEvent | string) => {
          const content = typeof payload === "string" ? payload : (payload.data ?? "");
          pendingTextRef.current += content;
        });

        socket.on("chat:done", () => {
          streamDoneRef.current = true;
          stopTypingIfCompleted();
          void refreshSessions();
        });

        socket.on("chat:error", (payload: SocketChatEvent | string) => {
          const message = typeof payload === "string" ? payload : (payload.data ?? "请稍后重试");
          appendError(`[AI 服务调用失败，${message}]`);
          void refreshSessions();
        });

        socket.on("chat:event", (payload: SocketChatEvent) => {
          if (payload.event === "delta") {
            pendingTextRef.current += payload.data ?? "";
            return;
          }
          if (payload.event === "done") {
            streamDoneRef.current = true;
            stopTypingIfCompleted();
            return;
          }
          if (payload.event === "error") {
            appendError(`[AI 服务调用失败，${payload.data ?? "请稍后重试"}]`);
          }
        });

        socket.on("disconnect", () => {
          socketRef.current = null;
          if (!streamDoneRef.current) {
            appendError("[连接已断开，请稍后重试]");
          }
        });

        socket.once("connect", () => resolve(socket));
        socket.once("connect_error", (error) => reject(error));
      } catch (error) {
        reject(error);
      }
    });
  }, [appendError, refreshSessions, stopTypingIfCompleted]);

  const handleSend = useCallback(async (): Promise<void> => {
    const question = inputValue.trim();
    if (!question || isReplying) {
      return;
    }

    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = await createSession();
      setCurrentSessionId(sessionId);
    }
    sessionIdRef.current = sessionId;
    const localTitle = generateSessionTitle(question);
    setSessions((prev) =>
      prev.map((item) =>
        item.sessionId === sessionId && (!item.title || item.title.trim() === "" || item.title === "新会话")
          ? { ...item, title: localTitle }
          : item,
      ),
    );

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
      enableWebSearch,
    };
    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now() + 1}`,
      role: "assistant",
      content: "",
      enableWebSearch,
    };

    setInputValue("");
    setIsReplying(true);
    pendingTextRef.current = "";
    streamDoneRef.current = false;
    assistantMessageIdRef.current = assistantMessage.id;
    setMessages((prev) => {
      const next = [...prev, userMessage, assistantMessage];
      messagesBySessionRef.current[sessionId] = next;
      return next;
    });
    ensureTypingLoop();

    try {
      const socket = await ensureSocketConnected();
      socket.emit("chat:message", {
        sessionId,
        message: question,
        enableWebSearch,
      });
      await refreshSessions();
    } catch (error) {
      appendError("[AI 服务调用失败，请稍后重试]");
      console.error(error);
    }
  }, [
    appendError,
    createSession,
    currentSessionId,
    enableWebSearch,
    ensureSocketConnected,
    ensureTypingLoop,
    generateSessionTitle,
    inputValue,
    isReplying,
    refreshSessions,
  ]);

  const selectSession = useCallback(
    async (sessionId: string) => {
      if (!sessionId) {
        return;
      }
      if (isReplying) {
        message.info("已中断当前回答，正在切换会话");
        interruptCurrentReply();
      }
      setCurrentSessionId(sessionId);
      sessionIdRef.current = sessionId;
      await loadSessionMessages(sessionId);
    },
    [interruptCurrentReply, isReplying, loadSessionMessages],
  );

  const handleCreateSession = useCallback(async () => {
    if (isReplying) {
      message.info("已中断当前回答，正在新建会话");
      interruptCurrentReply();
    }
    const created = await createSession();
    setCurrentSessionId(created);
    sessionIdRef.current = created;
    setMessages([]);
    messagesBySessionRef.current[created] = [];
  }, [createSession, interruptCurrentReply, isReplying]);

  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      if (!sessionId) {
        return;
      }
      if (isReplying && currentSessionId === sessionId) {
        message.info("已中断当前回答，正在删除会话");
        interruptCurrentReply();
      }
      const response = await fetch(`${AI_CHAT_API_URL}/ai/sessions/${sessionId}`, { method: "DELETE" });
      if (!response.ok) {
        message.error("删除会话失败，请稍后重试");
        return;
      }
      delete messagesBySessionRef.current[sessionId];

      const list = await refreshSessions();
      if (list.length === 0) {
        const created = await createSession();
        setCurrentSessionId(created);
        sessionIdRef.current = created;
        setMessages([]);
        messagesBySessionRef.current[created] = [];
        return;
      }

      if (currentSessionId === sessionId) {
        const nextSessionId = list[0].sessionId;
        setCurrentSessionId(nextSessionId);
        sessionIdRef.current = nextSessionId;
        await loadSessionMessages(nextSessionId);
      }
      message.success("会话已删除");
    },
    [
      createSession,
      currentSessionId,
      interruptCurrentReply,
      isReplying,
      loadSessionMessages,
      refreshSessions,
    ],
  );

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setIsSessionLoading(true);
        const sessionList = await refreshSessions();
        let targetSessionId = sessionList[0]?.sessionId ?? "";
        if (!targetSessionId) {
          targetSessionId = await createSession();
        }
        setCurrentSessionId(targetSessionId);
        sessionIdRef.current = targetSessionId;
        await loadSessionMessages(targetSessionId);
      } catch (error) {
        console.error(error);
      } finally {
        setIsSessionLoading(false);
      }
    };
    void bootstrap();
  }, [createSession, loadSessionMessages, refreshSessions]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return {
    inputValue,
    isReplying,
    messages,
    sessions,
    currentSessionId,
    isSessionLoading,
    enableWebSearch,
    setEnableWebSearch,
    selectSession,
    handleCreateSession,
    handleDeleteSession,
    handleInputChange,
    handleSend,
  };
};

export default useAIChat;
