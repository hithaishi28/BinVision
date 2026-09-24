import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Bot, Check, ChevronDown, Copy, RotateCw, Send, Sparkles, Trash2, X } from "lucide-react";
import { CATEGORY_META, formatClassName } from "@/lib/detection";
import { chatWithBinVisionAI } from "@/lib/chat-service";
import {
  appendChatMessage,
  clearChat,
  getChatState,
  setAssistantContext,
  updateChat,
  useChatState,
} from "@/lib/chat-store";
import { useAnalyses } from "@/lib/analysis-store";

const generalQuestions = [
  "How do I sort household waste?",
  "Where should batteries go?",
  "What does confidence mean?",
];
const analysisQuestions = [
  "Explain these results",
  "Which items are recyclable?",
  "How should I dispose of this?",
  "Explain the confidence scores",
];
const id = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function AssistantWidget() {
  const chat = useChatState();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const latestAssistantRef = useRef<HTMLDivElement>(null);
  const lastScrolledAssistantId = useRef<string | null>(null);
  const analyses = useAnalyses();
  const context = chat.context ?? analyses[0]?.analysis;
  const selectedIndex = chat.selectedDetectionIndex ?? chat.context?.selected_detection_index;
  const selected = context && selectedIndex != null ? context.detections[selectedIndex] : undefined;
  const suggestions = context ? analysisQuestions : generalQuestions;
  const latestAssistantId = [...chat.messages].reverse().find((message) => message.role === "assistant")?.id;
  useEffect(() => {
    if (!chat.open) return;
    if (latestAssistantId && latestAssistantId !== lastScrolledAssistantId.current) {
      latestAssistantRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      lastScrolledAssistantId.current = latestAssistantId;
    }
  }, [chat.messages, chat.open, latestAssistantId]);

  async function send(text = draft) {
    const question = text.trim();
    if (!question || sending) return;
    setDraft("");
    setSending(true);
    appendChatMessage({ id: id(), role: "user", content: question });
    try {
      const history = getChatState()
        .messages.filter((item) => !item.error)
        .slice(0, -1)
        .map(({ role, content }) => ({ role, content }));
      const answer = await chatWithBinVisionAI(
        question,
        history,
        getChatState().context ?? context,
      );
      appendChatMessage({ id: id(), role: "assistant", content: answer });
    } catch (error) {
      appendChatMessage({
        id: id(),
        role: "assistant",
        content: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        error: true,
      });
    } finally {
      setSending(false);
    }
  }
  async function retry(message: string) {
    const old = getChatState().messages;
    const previousUser = [...old].reverse().find((item) => item.role === "user");
    updateChat({
      messages: previousUser ? old.slice(0, old.indexOf(previousUser)) : old.slice(0, -1),
    });
    if (previousUser) await send(previousUser.content);
    else await send(message);
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    void send();
  }
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  }
  const contextLabel = useMemo(
    () =>
      selected
        ? `${formatClassName(selected.class_name)} · ${CATEGORY_META[selected.category].label} · ${Math.round(selected.confidence * 100)}%`
        : context
          ? `${context.summary.total} detected items · analysis context`
          : undefined,
    [context, selected],
  );

  return (
    <>
      {chat.open && (
        <section
          aria-label="BinVision AI assistant"
          className="fixed inset-x-3 bottom-3 z-50 flex max-h-[min(760px,88dvh)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#101b1a] text-white shadow-[0_24px_80px_rgba(8,20,18,.35)] sm:inset-x-auto sm:right-6 sm:bottom-24 sm:w-[410px]"
        >
          <header className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-[#193b33] via-[#152923] to-[#101b1a] px-5 py-4">
            <div className="absolute -right-7 -top-10 size-36 rounded-full bg-emerald-400/10 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-2xl bg-emerald-400 text-[#08241c] shadow-lg shadow-emerald-950/30">
                <Bot size={21} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 font-display text-sm font-bold">
                  BinVision AI <Sparkles size={13} className="text-emerald-300" />
                </p>
                <p className="text-xs text-emerald-100/65">Your waste sorting copilot</p>
              </div>
              <button
                type="button"
                aria-label="Clear conversation"
                title="Clear conversation"
                onClick={clearChat}
                className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                aria-label="Close assistant"
                onClick={() => updateChat({ open: false })}
                className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <X size={17} />
              </button>
            </div>
            {contextLabel && (
              <div className="relative mt-3 truncate rounded-xl border border-emerald-200/10 bg-black/20 px-3 py-2 text-[11px] text-emerald-50/80">
                <span className="mr-1.5 text-emerald-300">●</span>AI context: {contextLabel}
              </div>
            )}
          </header>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
            {chat.messages.length === 0 ? (
              <div className="py-4">
                <div className="mx-auto grid size-14 place-items-center rounded-[20px] border border-emerald-200/10 bg-emerald-300/[.08] text-emerald-200">
                  <Sparkles size={24} />
                </div>
                <h3 className="mt-4 text-center font-display text-lg font-semibold">
                  A smarter way to sort.
                </h3>
                <p className="mx-auto mt-1 max-w-xs text-center text-sm leading-6 text-white/55">
                  Ask about materials, disposal, or your latest detection results.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {suggestions.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => void send(question)}
                      className="rounded-full border border-white/10 bg-white/[.04] px-3 py-2 text-left text-xs text-white/80 transition hover:border-emerald-300/30 hover:bg-emerald-300/10"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chat.messages.map((message) => (
                <div
                  key={message.id}
                  ref={message.role === "assistant" && message.id === latestAssistantId ? latestAssistantRef : undefined}
                  className={`group flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-3 text-sm leading-6 shadow-sm ${message.role === "user" ? "rounded-br-md bg-emerald-400 text-[#08241c]" : message.error ? "rounded-bl-md border border-rose-300/20 bg-rose-400/10 text-rose-100" : "rounded-bl-md border border-white/[.07] bg-white/[.06] text-white/90"}`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    {message.error ? (
                      <button
                        type="button"
                        onClick={() => void retry(message.content)}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-200 underline underline-offset-4"
                      >
                        <RotateCw size={12} />
                        Retry
                      </button>
                    ) : (
                      message.role === "assistant" && (
                        <button
                          type="button"
                          aria-label="Copy response"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(message.content);
                              setCopied(message.id);
                              window.setTimeout(() => setCopied(null), 1400);
                            } catch {
                              setCopied(null);
                            }
                          }}
                          className="mt-2 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-[10px] text-white/45 opacity-70 transition hover:bg-white/10 hover:text-white"
                        >
                          <>
                            {copied === message.id ? <Check size={12} /> : <Copy size={12} />}{" "}
                            {copied === message.id ? "Copied" : "Copy"}
                          </>
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="flex items-center gap-2 text-xs text-white/55">
                <span className="grid size-7 place-items-center rounded-lg bg-emerald-300/10 text-emerald-200">
                  <Bot size={14} />
                </span>
                <span className="flex items-center gap-1">
                  Thinking<span className="animate-pulse">•••</span>
                </span>
              </div>
            )}
            {chat.messages.length > 0 && !sending && (
              <div className="flex flex-wrap gap-1.5">
                {suggestions.slice(0, 3).map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => void send(question)}
                    className="rounded-full border border-white/10 px-2.5 py-1.5 text-[10px] text-white/55 transition hover:bg-white/10 hover:text-white"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}
          </div>
          <form onSubmit={submit} className="border-t border-white/10 bg-black/15 p-3">
            <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[.06] p-2 transition focus-within:border-emerald-300/40">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                maxLength={4000}
                aria-label="Message BinVision AI"
                placeholder="Ask about your waste…"
                className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-5 text-white outline-none placeholder:text-white/35"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                aria-label="Send message"
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-400 text-[#08241c] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="mt-2 px-1 text-[10px] text-white/35">
              Enter to send · Shift + Enter for a new line
            </p>
          </form>
        </section>
      )}
      <button
        type="button"
        aria-label={chat.open ? "Close BinVision AI" : "Open BinVision AI"}
        aria-expanded={chat.open}
        onClick={() => updateChat({ open: !chat.open })}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-emerald-200/20 bg-[#10251f] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_32px_rgba(7,25,18,.35)] transition hover:-translate-y-0.5 hover:bg-[#17372c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
      >
        <span className="grid size-7 place-items-center rounded-full bg-emerald-400 text-[#08241c]">
          <Bot size={17} />
        </span>
        <span className="hidden sm:inline">Ask BinVision AI</span>
        {chat.open ? <ChevronDown size={15} className="sm:hidden" /> : null}
      </button>
    </>
  );
}
