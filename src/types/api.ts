export interface ChatAttachmentPayload {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string | null;
}

export interface PastedContentPayload {
  id: string;
  content: string;
  timestamp: string;
}

export interface ChatRequestPayload {
  message: string;
  files: ChatAttachmentPayload[];
  pastedContent: PastedContentPayload[];
  model: string;
  isThinkingEnabled: boolean;
}

export interface ChatResponsePayload {
  response: string;
  model: string;
  echo: {
    fileCount: number;
    pastedCount: number;
    thinking: boolean;
  };
}

export interface LibraryItem {
  id?: string;
  name: string;
  type?: string;
  year?: number;
  overview?: string;
  localSeasons?: number;
}

export interface AuditItem {
  name: string;
  localSeasons: number;
  remoteSeasons: number;
  missingSeasons: number;
  status: string;
}

export interface LibraryOverviewPayload {
  stats: {
    movies: number;
    series: number;
    totalItems: number;
  };
  movies: {
    count: number;
    items: LibraryItem[];
  };
  series: {
    count: number;
    items: LibraryItem[];
  };
  sync: {
    lastRefreshAt: string | null;
    isConnected: boolean;
    lastError: string | null;
  };
  capabilities: {
    jellyfinConfigured: boolean;
    tmdbConfigured: boolean;
    assistantConfigured: boolean;
  };
  audit: {
    configured: boolean;
    message: string;
    items: AuditItem[];
    count: number;
    lastAuditedAt: string | null;
    lastError: string | null;
  };
}

export interface HealthPayload {
  status: string;
  appName: string;
}

export interface ChatUiMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt: string;
  meta?: {
    model?: string;
    files?: number;
    pasted?: number;
    thinking?: boolean;
  };
}
