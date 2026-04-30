import { useState } from "react";

import { api } from "@/lib/api";
import type { ChatUiMessage } from "@/types/api";

export function useSaveMemory() {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const saveMemory = async (messages: ChatUiMessage[]) => {
    const conversationMessages = messages.filter((m) => m.id !== "welcome");
    if (conversationMessages.length === 0) return;

    setIsSaving(true);
    setError(null);

    try {
      const summaryPrompt = `Basándote en esta conversación, genera un resumen estructurado en Markdown con:
- Películas/series recomendadas y la reacción del usuario
- Géneros o preferencias detectadas
- Películas que ya vio o no le gustaron
- Cualquier dato útil para futuras recomendaciones

Sé conciso. Máximo 500 palabras. Usa bullet points.
Conversación: ${JSON.stringify(conversationMessages.slice(-20))}`;

      const response = await api.chat({
        message: summaryPrompt,
        files: [],
        pastedContent: [],
        model: "gemini-2.5-flash",
        isThinkingEnabled: false,
      });

      await api.saveMemory(response.response);
      setLastSavedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la sesión.");
    } finally {
      setIsSaving(false);
    }
  };

  return { saveMemory, isSaving, lastSavedAt, error };
}
