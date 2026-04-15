import type { ClipboardEvent, DragEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArrowUp,
  Check,
  ChevronDown,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { ChatAttachmentPayload, ChatRequestPayload, PastedContentPayload } from "@/types/api";

export const Icons = {
  Plus,
  Thinking: Sparkles,
  SelectArrow: ChevronDown,
  ArrowUp,
  X,
  FileText,
  Loader2,
  Check,
  Archive,
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

interface AttachedFile {
  id: string;
  file: File;
  type: string;
  preview: string | null;
  uploadStatus: "uploading" | "complete";
  content?: string;
}

interface FilePreviewCardProps {
  file: AttachedFile;
  onRemove: (id: string) => void;
}

function FilePreviewCard({ file, onRemove }: FilePreviewCardProps) {
  const isImage = file.type.startsWith("image/") && file.preview;

  return (
    <div className="group relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-bg-300 bg-bg-200 shadow-sm transition-all hover:border-text-300">
      {isImage ? (
        <div className="relative h-full w-full">
          <img src={file.preview ?? ""} alt={file.file.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/0" />
        </div>
      ) : (
        <div className="flex h-full flex-col justify-between p-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-white/80 p-1.5">
              <Icons.FileText className="h-4 w-4 text-text-300" />
            </div>
            <span className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-text-400">
              {file.file.name.split(".").pop()}
            </span>
          </div>
          <div>
            <p className="truncate text-xs font-medium text-text-200" title={file.file.name}>
              {file.file.name}
            </p>
            <p className="text-[10px] text-text-400">{formatFileSize(file.file.size)}</p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => onRemove(file.id)}
        className="absolute right-1.5 top-1.5 rounded-full bg-black/55 p-1 text-white opacity-0 transition group-hover:opacity-100"
        aria-label={`Eliminar ${file.file.name}`}
      >
        <Icons.X className="h-3 w-3" />
      </button>

      {file.uploadStatus === "uploading" ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/35">
          <Icons.Loader2 className="h-5 w-5 animate-spin text-white" />
        </div>
      ) : null}
    </div>
  );
}

interface PastedContentCardProps {
  content: PastedContentPayload;
  onRemove: (id: string) => void;
}

function PastedContentCard({ content, onRemove }: PastedContentCardProps) {
  return (
    <div className="group relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-[22px] border border-bg-300 bg-white p-3 shadow-sm">
      <div className="overflow-hidden">
        <p className="max-h-[4.3rem] overflow-hidden whitespace-pre-wrap break-words font-mono text-[10px] leading-[1.45] text-text-400">
          {content.content}
        </p>
      </div>
      <div className="mt-3">
        <span className="rounded-full border border-bg-300 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-text-300">
          Pasted
        </span>
      </div>
      <button
        type="button"
        onClick={() => onRemove(content.id)}
        className="absolute right-2 top-2 rounded-full border border-bg-300 bg-white p-1 text-text-400 opacity-0 transition group-hover:opacity-100"
        aria-label="Eliminar texto pegado"
      >
        <Icons.X className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}

interface Model {
  id: string;
  name: string;
  description: string;
  badge?: string;
}

interface ModelSelectorProps {
  models: Model[];
  selectedModel: string;
  onSelect: (modelId: string) => void;
}

function ModelSelector({ models, selectedModel, onSelect }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentModel = models.find((model) => model.id === selectedModel) ?? models[0];

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={cn(
          "inline-flex h-9 items-center gap-1 rounded-xl px-3 text-xs font-medium transition",
          isOpen
            ? "bg-bg-200 text-text-100"
            : "text-text-300 hover:bg-bg-200 hover:text-text-100",
        )}
      >
        <span className="whitespace-nowrap">{currentModel.name}</span>
        <Icons.SelectArrow className={cn("h-4 w-4 transition", isOpen && "rotate-180")} />
      </button>

      {isOpen ? (
        <div className="absolute bottom-full right-0 z-50 mb-2 flex w-[280px] flex-col rounded-[24px] border border-bg-300 bg-white p-1.5 shadow-[0_28px_60px_-32px_rgba(44,38,30,0.35)]">
          {models.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => {
                onSelect(model.id);
                setIsOpen(false);
              }}
              className="flex w-full items-start justify-between rounded-[18px] px-3 py-3 text-left transition hover:bg-bg-200"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-100">{model.name}</span>
                  {model.badge ? (
                    <span className="rounded-full border border-accent/25 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                      {model.badge}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-text-400">{model.description}</p>
              </div>
              {selectedModel === model.id ? (
                <Icons.Check className="mt-1 h-4 w-4 text-accent" />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface ClaudeChatInputProps {
  onSendMessage: (data: ChatRequestPayload) => Promise<void> | void;
  disabled?: boolean;
}

export default function ClaudeChatInput({
  onSendMessage,
  disabled = false,
}: ClaudeChatInputProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [pastedContent, setPastedContent] = useState<PastedContentPayload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [isThinkingEnabled, setIsThinkingEnabled] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const models = useMemo<Model[]>(
    () => [
      {
        id: "gemini-2.5-pro",
        name: "Gemini Pro",
        description: "Más capaz para consultas complejas de biblioteca y contexto.",
        badge: "Profundo",
      },
      {
        id: "gemini-2.5-flash",
        name: "Gemini Flash",
        description: "Equilibrio entre velocidad y calidad para uso diario.",
      },
      {
        id: "context-only",
        name: "Modo local",
        description: "Respuesta sin modelo externo, usando solo el contexto del servidor.",
      },
    ],
    [],
  );

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 280)}px`;
  }, [message]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "e") {
        event.preventDefault();
        setIsThinkingEnabled((current) => !current);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const readFileContent = async (file: File) => {
    const canReadText =
      file.type.startsWith("text/") ||
      /\.(md|txt|json|csv|log|yaml|yml|xml|ts|tsx|js|jsx|py|html|css)$/i.test(file.name);

    if (!canReadText || file.size > 1_500_000) {
      return undefined;
    }

    try {
      const content = await file.text();
      return content.slice(0, 12000);
    } catch {
      return undefined;
    }
  };

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const pendingFiles = Array.from(fileList).map((file) => {
        const isImage =
          file.type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);

        return {
          id: crypto.randomUUID(),
          file,
          type: isImage ? file.type || "image/unknown" : file.type || "application/octet-stream",
          preview: isImage ? URL.createObjectURL(file) : null,
          uploadStatus: "uploading" as const,
        };
      });

      setFiles((current) => [...current, ...pendingFiles]);

      if (!message.trim()) {
        setMessage(
          pendingFiles.length === 1 ? "Analiza este contexto adjunto." : "Analiza estos adjuntos.",
        );
      }

      await Promise.all(
        pendingFiles.map(async (pendingFile) => {
          const content = await readFileContent(pendingFile.file);
          setFiles((current) =>
            current.map((item) =>
              item.id === pendingFile.id
                ? { ...item, content, uploadStatus: "complete" as const }
                : item,
            ),
          );
        }),
      );
    },
    [message],
  );

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (event: DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files?.length) {
      void handleFiles(event.dataTransfer.files);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedFiles: File[] = [];
    for (const item of Array.from(event.clipboardData.items)) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) {
          pastedFiles.push(file);
        }
      }
    }

    if (pastedFiles.length) {
      event.preventDefault();
      void handleFiles(pastedFiles);
      return;
    }

    const text = event.clipboardData.getData("text");
    if (text.length > 320) {
      event.preventDefault();
      const block: PastedContentPayload = {
        id: crypto.randomUUID(),
        content: text.slice(0, 4000),
        timestamp: new Date().toISOString(),
      };
      setPastedContent((current) => [...current, block]);
      if (!message.trim()) {
        setMessage("Usa este texto pegado como contexto.");
      }
    }
  };

  const removeFile = (id: string) => {
    setFiles((current) => {
      const fileToRemove = current.find((item) => item.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return current.filter((item) => item.id !== id);
    });
  };

  const buildPayload = (): ChatRequestPayload => ({
    message: message.trim(),
    files: files.map<ChatAttachmentPayload>((file) => ({
      id: file.id,
      name: file.file.name,
      type: file.type,
      size: file.file.size,
      content: file.content ?? null,
    })),
    pastedContent,
    model: selectedModel,
    isThinkingEnabled,
  });

  const handleSend = async () => {
    const payload = buildPayload();
    const hasContent =
      payload.message || payload.files.length > 0 || payload.pastedContent.length > 0;

    if (!hasContent || disabled) {
      return;
    }

    await onSendMessage(payload);
    files.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setMessage("");
    setFiles([]);
    setPastedContent([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = async (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await handleSend();
    }
  };

  const hasComposerContent = !!message.trim() || files.length > 0 || pastedContent.length > 0;

  return (
    <div
      className="relative mx-auto w-full max-w-4xl transition-all"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="relative z-10 flex flex-col rounded-[30px] border border-white/70 bg-white/90 shadow-[0_30px_80px_-40px_rgba(44,38,30,0.35)] backdrop-blur">
        <div className="flex flex-col gap-3 px-3 pb-3 pt-3 md:px-4">
          {files.length > 0 || pastedContent.length > 0 ? (
            <div className="custom-scrollbar flex gap-3 overflow-x-auto px-1 pb-1">
              {pastedContent.map((content) => (
                <PastedContentCard
                  key={content.id}
                  content={content}
                  onRemove={(id) =>
                    setPastedContent((current) => current.filter((item) => item.id !== id))
                  }
                />
              ))}
              {files.map((file) => (
                <FilePreviewCard key={file.id} file={file} onRemove={removeFile} />
              ))}
            </div>
          ) : null}

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              placeholder="Consulta el estado de tu Jellyfin, audita temporadas o añade contexto."
              className="custom-scrollbar min-h-[84px] w-full resize-none overflow-y-auto bg-transparent px-2 py-1 text-[15px] leading-7 text-text-100 outline-none placeholder:text-text-400"
              disabled={disabled}
            />
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-text-400 transition hover:bg-bg-200 hover:text-text-100 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Adjuntar archivos"
                disabled={disabled}
              >
                <Icons.Plus className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsThinkingEnabled((current) => !current)}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-2xl px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
                  isThinkingEnabled
                    ? "bg-accent/10 text-accent"
                    : "text-text-400 hover:bg-bg-200 hover:text-text-100",
                )}
                aria-pressed={isThinkingEnabled}
                disabled={disabled}
              >
                <Icons.Thinking className="h-4 w-4" />
                Pensamiento extendido
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 md:justify-end">
              <ModelSelector
                models={models}
                selectedModel={selectedModel}
                onSelect={setSelectedModel}
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={!hasComposerContent || disabled}
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-2xl transition",
                  hasComposerContent && !disabled
                    ? "bg-accent text-white shadow-md hover:bg-accent-hover"
                    : "bg-accent/30 text-white/70",
                )}
                aria-label="Enviar mensaje"
              >
                <Icons.ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isDragging ? (
        <div className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center rounded-[30px] border-2 border-dashed border-accent bg-bg-200/90 backdrop-blur-sm">
          <Icons.Archive className="mb-2 h-10 w-10 animate-bounce text-accent" />
          <p className="font-medium text-accent">Suelta los archivos para añadir contexto</p>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={(event) => {
          if (event.target.files?.length) {
            void handleFiles(event.target.files);
          }
          event.target.value = "";
        }}
      />

      <p className="mt-4 text-center text-xs text-text-500">
        Revisa siempre la información crítica antes de tomar decisiones.
      </p>
    </div>
  );
}
