import { Loader2, Send, Sparkles, TriangleAlert, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "../../lib/class-names";
import { Textarea } from "../../ui/textarea";
import { englishAiSearchLabels, type AiSearchLabels } from "./labels";
import type { AiAskHandle } from "./types";
import type { AiSearchState } from "./use-ai-search";

const INPUT_MAX_HEIGHT = 120;

export interface AiAssistantPanelProps {
  state: AiSearchState;
  ask: AiAskHandle;
  labels?: AiSearchLabels;
  suggestions?: string[];
  renderVoiceButton?(onTranscribed: (text: string) => void): ReactNode;
  compactPlaceholder?: boolean;
  className?: string;
  tourId?: string;
}

export function AiAssistantPanel({
  state,
  ask,
  labels = englishAiSearchLabels,
  suggestions = [],
  renderVoiceButton,
  compactPlaceholder = false,
  className,
  tourId,
}: AiAssistantPanelProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [question, setQuestion] = useState("");

  useEffect(() => {
    const element = inputRef.current;
    if (!element) return;
    element.style.height = "auto";
    const next = Math.min(element.scrollHeight, INPUT_MAX_HEIGHT);
    element.style.height = `${next}px`;
    element.style.overflowY = element.scrollHeight > INPUT_MAX_HEIGHT ? "auto" : "hidden";
  }, [question]);

  return (
    <div
      data-tour={tourId}
      className={cn("rounded-xl border border-border bg-brand-tint p-4", className)}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-card text-brand-dark">
          <Sparkles className="size-4.5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{labels.title}</h2>
          <p className="text-xs text-muted-foreground">{labels.description}</p>
        </div>
        <button
          type="button"
          onClick={state.closeAiMode}
          className="ml-auto flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm font-medium text-brand-dark transition-colors hover:bg-brand-wash"
        >
          <Sparkles className="size-4" />
          {labels.assistant}
          <X className="ml-0.5 size-3.5 text-muted-foreground" />
        </button>
      </div>
      <form
        className="relative mt-3 w-full"
        onSubmit={(event) => {
          event.preventDefault();
          state.submit(question);
        }}
      >
        <Textarea
          ref={inputRef}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              state.submit(question);
            }
          }}
          placeholder={compactPlaceholder ? labels.questionPlaceholderShort : labels.questionPlaceholder}
          rows={1}
          className={cn(
            "h-11 min-h-11 resize-none bg-card py-3 pl-3 pr-28 leading-5",
            !question && "overflow-y-hidden whitespace-nowrap",
          )}
        />
        <div className="absolute right-2 top-2 flex items-center gap-1">
          {(question || state.active) && (
            <button
              type="button"
              onClick={() => {
                setQuestion("");
                state.clear();
              }}
              aria-label={labels.clear}
              className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
          {renderVoiceButton?.((text) => {
            setQuestion(text);
            inputRef.current?.focus();
          })}
          <button
            type="submit"
            disabled={!question.trim() || ask.isPending}
            aria-label={labels.submit}
            title={labels.submit}
            className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            {ask.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </div>
      </form>
      {suggestions.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setQuestion(suggestion);
                state.submit(suggestion);
              }}
              className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      {(ask.isPending || ask.isError || state.active) && (
        <div className="mt-3 border-t border-border/60 pt-3 text-sm">
          {ask.isPending && (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {labels.searching}
            </span>
          )}
          {ask.isError && <span className="text-destructive">{labels.error}</span>}
          {state.active && ask.data && (
            <>
              <div className="flex items-start justify-between gap-3">
                <p className="text-foreground">
                  {ask.data.offTopic ? labels.offTopic : ask.data.answer}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuestion("");
                    state.clear();
                  }}
                  className="shrink-0 text-xs text-muted-foreground underline hover:text-foreground"
                >
                  {labels.clear}
                </button>
              </div>
              {ask.data.aggregate && ask.data.matches.length === 0 && (
                <p className="mt-2 text-xs text-muted-foreground">{labels.aggregateHint}</p>
              )}
              {!state.translated &&
                ask.data.totalMatches !== null &&
                ask.data.totalMatches > ask.data.matches.length && (
                  <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700">
                    <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                    {ask.data.semantic
                      ? labels.truncatedSimilar(ask.data.matches.length, ask.data.totalMatches)
                      : labels.truncated(ask.data.matches.length, ask.data.totalMatches)}
                  </p>
                )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
