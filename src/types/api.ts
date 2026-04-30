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
  recommendations: RecommendationItem[];
}

export interface RecommendationItem {
  title: string;
  type: string;
  year?: number | null;
  genres: string[];
  runtimeMinutes?: number | null;
  rating?: number | null;
  posterUrl?: string | null;
  description?: string | null;
  reason?: string | null;
  jellyfin: {
    available: boolean;
    playUrl?: string | null;
    statusMessage: string;
  };
}

export interface LibraryItem {
  id?: string;
  name: string;
  type?: string;
  year?: number;
  overview?: string;
  localSeasons?: number;
  imageUrl?: string;
  backdropUrl?: string;
  hasPrimaryImage?: boolean;
  hasBackdrop?: boolean;
  genres?: string[];
  communityRating?: number;
  officialRating?: string;
  runtimeMinutes?: number;
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

export interface MemoryPayload {
  content: string;
}

export interface SaveMemoryPayload {
  ok: boolean;
}

export interface ChatUiMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt: string;
  recommendations?: RecommendationItem[];
  meta?: {
    model?: string;
    files?: number;
    pasted?: number;
    thinking?: boolean;
  };
}
