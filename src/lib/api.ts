import type {
  ChatRequestPayload,
  ChatResponsePayload,
  HealthPayload,
  LibraryOverviewPayload,
} from "@/types/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export const api = {
  health: () => request<HealthPayload>("/api/health"),
  getOverview: () => request<LibraryOverviewPayload>("/api/library/overview"),
  chat: (payload: ChatRequestPayload) =>
    request<ChatResponsePayload>("/api/chat", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
