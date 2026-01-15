"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Loader2,
  Send,
  Trash2,
  ImageIcon,
  Settings,
  X,
  FolderOpen,
  Plus,
  FileText,
  Sparkles,
  Zap,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { MathContent } from "@/components/MathContent";

// Types
type AttachmentPayload = {
  name: string;
  mimeType: string;
  data: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachment?: { name: string; preview?: string };
  isStreaming?: boolean;
};

type GalleryImage = {
  id: string;
  name: string;
  preview: string;
  data: string;
  mimeType: string;
};

type KnowledgeFile = {
  id: string;
  name: string;
  content: string;
  type: "pdf" | "md";
};

// Constants
const STORAGE_KEYS = {
  SYSTEM_PROMPT: "solver-system-prompt",
  GALLERY: "solver-gallery",
  KNOWLEDGE_BASE: "solver-knowledge-base",
  CHAT_HISTORY: "solver-chat-history",
  DEFAULT_HOMEPAGE: "solver-default-homepage",
};

const DEFAULT_SYSTEM_PROMPT = `Jesteś szybkim i dokładnym solverem zadań matematycznych. Analizuj obrazy, PDF i tekst.
ZASADY:
1. Zwracaj wynik w Markdown + LaTeX ($...$ i $$...$$).
2. Odpowiedź ma być konkretna: wynik + kluczowe kroki rozwiązania.
3. Bez emoji.
4. Jeśli brakuje danych lub obraz jest nieczytelny, krótko napisz czego brakuje.`;

export default function SolverPage() {
  // Core state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Settings & Gallery state
  const [showSettings, setShowSettings] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeFile[]>([]);
  const [isDefaultHomepage, setIsDefaultHomepage] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const knowledgeInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedPrompt = localStorage.getItem(STORAGE_KEYS.SYSTEM_PROMPT);
    if (savedPrompt) setSystemPrompt(savedPrompt);

    const savedGallery = localStorage.getItem(STORAGE_KEYS.GALLERY);
    if (savedGallery) {
      try {
        setGallery(JSON.parse(savedGallery));
      } catch {
        /* ignore */
      }
    }

    const savedKnowledge = localStorage.getItem(STORAGE_KEYS.KNOWLEDGE_BASE);
    if (savedKnowledge) {
      try {
        setKnowledgeBase(JSON.parse(savedKnowledge));
      } catch {
        /* ignore */
      }
    }

    const savedHistory = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    if (savedHistory) {
      try {
        setMessages(JSON.parse(savedHistory));
      } catch {
        /* ignore */
      }
    }

    const savedHomepage = localStorage.getItem(STORAGE_KEYS.DEFAULT_HOMEPAGE);
    setIsDefaultHomepage(savedHomepage === "true");
  }, []);

  // Persist chat history
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(messages.slice(-50)));
    }
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSubmitting]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
    }
  }, [inputText]);

  // Helpers
  const toBase64 = (file: File) =>
    new Promise<AttachmentPayload>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result?.toString() || "";
        const base64 = result.split(",")[1] || "";
        resolve({
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          data: base64,
        });
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const getFilePreview = (file: File): Promise<string | null> =>
    new Promise((resolve) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      } else {
        resolve(null);
      }
    });

  // Gallery management
  const addToGallery = async (file: File) => {
    const preview = await getFilePreview(file);
    if (!preview) return;

    const payload = await toBase64(file);
    const newImage: GalleryImage = {
      id: Date.now().toString(),
      name: file.name,
      preview,
      data: payload.data,
      mimeType: payload.mimeType,
    };

    const updatedGallery = [...gallery, newImage].slice(-20); // Keep last 20
    setGallery(updatedGallery);
    localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(updatedGallery));
  };

  const removeFromGallery = (id: string) => {
    const updatedGallery = gallery.filter((img) => img.id !== id);
    setGallery(updatedGallery);
    localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(updatedGallery));
  };

  const selectFromGallery = (img: GalleryImage) => {
    // Create a synthetic file-like state
    setPendingPreview(img.preview);
    // Store the gallery image data temporarily
    const syntheticFile = new File([new Uint8Array()], img.name, { type: img.mimeType });
    Object.defineProperty(syntheticFile, "__galleryData", { value: img });
    setPendingFile(syntheticFile);
    setShowGallery(false);
  };

  // Knowledge base management
  const addToKnowledgeBase = async (file: File) => {
    if (knowledgeBase.length >= 10) {
      alert("Maksymalnie 10 plików w bazie wiedzy");
      return;
    }

    const content = await file.text();
    const newFile: KnowledgeFile = {
      id: Date.now().toString(),
      name: file.name,
      content: content.slice(0, 50000), // Limit content size
      type: file.name.endsWith(".pdf") ? "pdf" : "md",
    };

    const updated = [...knowledgeBase, newFile];
    setKnowledgeBase(updated);
    localStorage.setItem(STORAGE_KEYS.KNOWLEDGE_BASE, JSON.stringify(updated));
  };

  const removeFromKnowledgeBase = (id: string) => {
    const updated = knowledgeBase.filter((f) => f.id !== id);
    setKnowledgeBase(updated);
    localStorage.setItem(STORAGE_KEYS.KNOWLEDGE_BASE, JSON.stringify(updated));
  };

  // Settings handlers
  const saveSystemPrompt = (prompt: string) => {
    setSystemPrompt(prompt);
    localStorage.setItem(STORAGE_KEYS.SYSTEM_PROMPT, prompt);
  };

  const toggleDefaultHomepage = () => {
    const newValue = !isDefaultHomepage;
    setIsDefaultHomepage(newValue);
    localStorage.setItem(STORAGE_KEYS.DEFAULT_HOMEPAGE, String(newValue));
  };

  // File selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") return;

    setPendingFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setPendingPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPendingPreview(null);
    }
  }, []);

  // Main submit with streaming
  const handleSubmit = useCallback(async () => {
    const hasContent = inputText.trim() || pendingFile;
    if (!hasContent || isSubmitting) return;

    const userMessageId = Date.now().toString();
    const userMessage: Message = {
      id: userMessageId,
      role: "user",
      content: inputText.trim(),
      attachment: pendingFile
        ? { name: pendingFile.name, preview: pendingPreview || undefined }
        : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsSubmitting(true);

    const currentText = inputText.trim();
    const currentFile = pendingFile;

    setInputText("");
    setPendingFile(null);
    setPendingPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Prepare assistant message for streaming
    const assistantMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantMessageId, role: "assistant", content: "", isStreaming: true },
    ]);

    try {
      // Build attachments
      let attachments: AttachmentPayload[] | undefined;
      if (currentFile) {
        // Check if it's from gallery
        const galleryData = (currentFile as unknown as { __galleryData?: GalleryImage })
          .__galleryData;
        if (galleryData) {
          attachments = [
            { name: galleryData.name, mimeType: galleryData.mimeType, data: galleryData.data },
          ];
        } else {
          attachments = [await toBase64(currentFile)];
        }
      }

      // Build context from previous messages (last 4 exchanges max)
      const contextMessages = messages.slice(-8);
      const contextPrompt =
        contextMessages.length > 0
          ? contextMessages
              .map((m) => `${m.role === "user" ? "Użytkownik" : "Asystent"}: ${m.content}`)
              .join("\n") +
            "\n\nUżytkownik: " +
            (currentText || "(załącznik)")
          : currentText || undefined;

      // Build knowledge context
      const knowledgeContext =
        knowledgeBase.length > 0
          ? knowledgeBase.map((f) => `### ${f.name}\n${f.content}`).join("\n\n---\n\n")
          : undefined;

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      const response = await fetch("/api/solver/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: contextPrompt,
          attachments,
          systemPrompt: systemPrompt !== DEFAULT_SYSTEM_PROMPT ? systemPrompt : undefined,
          knowledgeContext,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, content: fullContent } : msg,
          ),
        );
      }

      // Mark streaming as complete
      setMessages((prev) =>
        prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg)),
      );
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        // User cancelled, remove the empty assistant message
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
      } else {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: "Błąd podczas generowania odpowiedzi. Spróbuj ponownie.",
                  isStreaming: false,
                }
              : msg,
          ),
        );
      }
    } finally {
      setIsSubmitting(false);
      abortControllerRef.current = null;
    }
  }, [inputText, pendingFile, pendingPreview, isSubmitting, messages, systemPrompt, knowledgeBase]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearPendingFile = () => {
    setPendingFile(null);
    setPendingPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearChat = () => {
    setMessages([]);
    setInputText("");
    setPendingFile(null);
    setPendingPreview(null);
    localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[var(--background)]">
      {/* Header - minimal */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)]/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 -ml-2 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors rounded-lg hover:bg-[var(--primary)]/5"
            title="Powrót"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 border-l border-[var(--border)] pl-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">Solver</h1>
              <p className="text-[9px] text-[var(--text-muted)] font-medium uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Gemini 3 Flash
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/5"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setShowGallery(true)}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors rounded-lg hover:bg-[var(--primary)]/5"
            title="Galeria"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors rounded-lg hover:bg-[var(--primary)]/5"
            title="Ustawienia"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 flex items-center justify-center mb-6 shadow-lg">
              <Camera className="w-12 h-12 text-[var(--primary)]" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Szybki Solver</h2>
            <p className="text-sm text-[var(--text-muted)] max-w-xs mb-6">
              Zrób zdjęcie zadania lub wpisz pytanie.
              <br />
              <span className="text-[var(--primary)] font-medium">Odpowiedź w sekundy.</span>
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-[var(--text-muted)]">
              <span className="px-2 py-1 bg-[var(--surface)] rounded-full border border-[var(--border)] flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" /> Aparat
              </span>
              <span className="px-2 py-1 bg-[var(--surface)] rounded-full border border-[var(--border)] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> Galeria
              </span>
              <span className="px-2 py-1 bg-[var(--surface)] rounded-full border border-[var(--border)] flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Follow-up
              </span>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-[var(--primary)] text-[var(--background)] rounded-br-md"
                      : "bg-[var(--surface)] border border-[var(--border)] rounded-bl-md"
                  }`}
                >
                  {msg.attachment && (
                    <div className="mb-2">
                      {msg.attachment.preview ? (
                        <img
                          src={msg.attachment.preview}
                          alt={msg.attachment.name}
                          className="max-h-32 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-sm opacity-80">
                          <ImageIcon className="w-4 h-4" />
                          {msg.attachment.name}
                        </div>
                      )}
                    </div>
                  )}
                  {msg.role === "assistant" ? (
                    <div className="relative">
                      <MathContent content={msg.content || " "} />
                      {msg.isStreaming && (
                        <span className="inline-block w-2 h-4 bg-[var(--primary)] animate-pulse ml-1" />
                      )}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content || "(zdjęcie)"}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator (before first token) */}
            {isSubmitting && messages[messages.length - 1]?.content === "" && (
              <div className="flex justify-start">
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2 text-[var(--text-muted)]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Analizuję...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area - fixed bottom */}
      <div className="border-t border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-sm p-3 pb-safe">
        {/* Pending file preview */}
        {pendingFile && (
          <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-[var(--background)] border border-[var(--border)]">
            {pendingPreview ? (
              <img src={pendingPreview} alt="Preview" className="w-12 h-12 rounded object-cover" />
            ) : (
              <div className="w-12 h-12 rounded bg-[var(--primary)]/10 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-[var(--primary)]" />
              </div>
            )}
            <span className="flex-1 text-sm truncate">{pendingFile.name}</span>
            <button onClick={clearPendingFile} className="p-1 hover:text-red-500 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (files) {
                Array.from(files).forEach((f) => addToGallery(f));
              }
              e.target.value = "";
            }}
          />
          <input
            ref={knowledgeInputRef}
            type="file"
            accept=".pdf,.md,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) addToKnowledgeBase(file);
              e.target.value = "";
            }}
          />

          {/* Camera button - PRIMARY */}
          <button
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.setAttribute("capture", "environment");
                fileInputRef.current.click();
                setTimeout(() => fileInputRef.current?.removeAttribute("capture"), 100);
              }
            }}
            disabled={isSubmitting}
            className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--primary)] text-[var(--background)] flex items-center justify-center transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 shadow-lg shadow-[var(--primary)]/25"
          >
            <Camera className="w-6 h-6" />
          </button>

          {/* Gallery button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting}
            className="flex-shrink-0 w-11 h-11 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center transition-all hover:border-[var(--primary)] disabled:opacity-50"
          >
            <ImageIcon className="w-5 h-5 text-[var(--text-muted)]" />
          </button>

          {/* Text input */}
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Wpisz pytanie..."
            rows={1}
            disabled={isSubmitting}
            className="flex-1 resize-none rounded-xl px-4 py-3 text-sm bg-[var(--background)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none transition-colors disabled:opacity-50"
            style={{ maxHeight: 120 }}
          />

          {/* Send button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!inputText.trim() && !pendingFile)}
            className="flex-shrink-0 w-11 h-11 rounded-xl bg-[var(--primary)] text-[var(--background)] flex items-center justify-center transition-all hover:opacity-90 active:scale-95 disabled:opacity-30"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <h2 className="font-bold text-lg">Ustawienia Solvera</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-[var(--background)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Default Homepage Toggle */}
              <div className="flex items-center justify-between p-4 bg-[var(--background)] rounded-xl border border-[var(--border)]">
                <div>
                  <p className="font-medium text-sm">Solver jako strona główna</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Otwieraj Solver zamiast dashboardu
                  </p>
                </div>
                <button
                  onClick={toggleDefaultHomepage}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    isDefaultHomepage ? "bg-[var(--primary)]" : "bg-[var(--border)]"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      isDefaultHomepage ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* System Prompt */}
              <div>
                <label className="block text-sm font-medium mb-2">Custom System Prompt</label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => saveSystemPrompt(e.target.value)}
                  rows={6}
                  className="w-full p-3 text-sm bg-[var(--background)] border border-[var(--border)] rounded-xl focus:border-[var(--primary)] focus:outline-none resize-none"
                  placeholder="Instrukcje dla AI..."
                />
                <button
                  onClick={() => saveSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
                  className="mt-2 text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                >
                  Przywróć domyślny
                </button>
              </div>

              {/* Knowledge Base */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">
                    Baza wiedzy ({knowledgeBase.length}/10)
                  </label>
                  <button
                    onClick={() => knowledgeInputRef.current?.click()}
                    disabled={knowledgeBase.length >= 10}
                    className="flex items-center gap-1 text-xs text-[var(--primary)] hover:underline disabled:opacity-50"
                  >
                    <Plus className="w-3 h-3" />
                    Dodaj plik
                  </button>
                </div>
                <p className="text-xs text-[var(--text-muted)] mb-3">
                  Pliki PDF/MD/TXT używane jako kontekst we wszystkich czatach.
                </p>
                {knowledgeBase.length > 0 ? (
                  <div className="space-y-2">
                    {knowledgeBase.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-2 p-2 bg-[var(--background)] rounded-lg border border-[var(--border)]"
                      >
                        <FileText className="w-4 h-4 text-[var(--primary)]" />
                        <span className="flex-1 text-sm truncate">{file.name}</span>
                        <button
                          onClick={() => removeFromKnowledgeBase(file.id)}
                          className="p-1 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-[var(--text-muted)] text-sm">
                    Brak plików w bazie wiedzy
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <h2 className="font-bold text-lg">Osobista Galeria</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-[var(--primary)] text-[var(--background)] rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-3 h-3" />
                  Dodaj
                </button>
                <button
                  onClick={() => setShowGallery(false)}
                  className="p-2 hover:bg-[var(--background)] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {gallery.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {gallery.map((img) => (
                    <div key={img.id} className="relative group aspect-square">
                      <img
                        src={img.preview}
                        alt={img.name}
                        className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => selectFromGallery(img)}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromGallery(img.id);
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-[var(--text-muted)]">
                  <FolderOpen className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm">Brak obrazów w galerii</p>
                  <p className="text-xs mt-1">Dodaj zdjęcia do szybkiego użycia</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
