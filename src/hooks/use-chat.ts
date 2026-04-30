import { useState } from "react";

import { api } from "@/lib/api";
import type { ChatRequestPayload, ChatUiMessage } from "@/types/api";

const initialMessages: ChatUiMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    createdAt: new Date().toISOString(),
    content:
      "Cuentame que te apetece ver y te recomendare peliculas o series con ficha visual y acceso directo a Jellyfin.",
    recommendations: [],
  },
];

export function useChat() {
  const [messages, setMessages] = useState<ChatUiMessage[]>(initialMessages);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (payload: ChatRequestPayload) => {
    const userMessage: ChatUiMessage = {
      id: crypto.randomUUID(),
      role: "user",
      createdAt: new Date().toISOString(),
      content: payload.message || "Contexto adjunto",
      meta: {
        model: payload.model,
        files: payload.files.length,
        pasted: payload.pastedContent.length,
        thinking: payload.isThinkingEnabled,
      },
    };

    setMessages((current) => [...current, userMessage]);
    setError(null);
    setIsSending(true);

    try {
      const response = await api.chat(payload);
      const assistantMessage: ChatUiMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        createdAt: new Date().toISOString(),
        content: response.response,
        recommendations: response.recommendations ?? [],
        meta: {
          model: response.model,
          files: response.echo.fileCount,
          pasted: response.echo.pastedCount,
          thinking: response.echo.thinking,
        },
      };
      setMessages((current) => [...current, assistantMessage]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo completar la peticion al asistente.";
      setError(message);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          createdAt: new Date().toISOString(),
          content:
            "La peticion fallo. Revisa la conexion con la API o las variables de entorno del backend antes de volver a intentarlo.",
          recommendations: [],
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return { messages, isSending, error, sendMessage };
}
