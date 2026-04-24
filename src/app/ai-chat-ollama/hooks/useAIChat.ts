import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

type MessageRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
}

interface SocketChatEvent {
  sessionId?: string;
  event?: "delta" | "done" | "error";
  data?: string;
}

const AI_CHAT_SOCKET_URL = process.env.NEXT_PUBLIC_AI_CHAT_SOCKET_URL ?? "http://127.0.0.1:9011";
const TYPING_INTERVAL_MS = 25;
const CHARS_PER_TICK = 1;

const useAIChat = () => {
  const [inputValue, setInputValue] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const sessionIdRef = useRef(`chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
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

    setMessages((prev) =>
      prev.map((item) => (item.id === assistantId ? { ...item, content: `${item.content}${content}` } : item)),
    );
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
        });

        socket.on("chat:error", (payload: SocketChatEvent | string) => {
          const message = typeof payload === "string" ? payload : (payload.data ?? "请稍后重试");
          appendError(`[AI 服务调用失败，${message}]`);
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
  }, [appendError, stopTypingIfCompleted]);

  const handleSend = useCallback(async (): Promise<void> => {
    const question = inputValue.trim();
    if (!question || isReplying) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
    };
    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now() + 1}`,
      role: "assistant",
      content: "",
    };

    setInputValue("");
    setIsReplying(true);
    pendingTextRef.current = "";
    streamDoneRef.current = false;
    assistantMessageIdRef.current = assistantMessage.id;
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    ensureTypingLoop();

    try {
      const socket = await ensureSocketConnected();
      socket.emit("chat:message", {
        sessionId: sessionIdRef.current,
        message: question,
      });
    } catch (error) {
      appendError("[AI 服务调用失败，请稍后重试]");
      console.error(error);
    }
  }, [appendError, ensureSocketConnected, ensureTypingLoop, inputValue, isReplying]);

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

  return { inputValue, isReplying, messages, handleInputChange, handleSend };
};

export default useAIChat;
