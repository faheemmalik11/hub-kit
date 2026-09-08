import { useState } from "react";

import { shouldNarrowList } from "../../lib/ai-search/table-filters";
import type { InvoiceFilters } from "../../lib/ai-search/types";
import type { AiAskHandle, AiAskResult } from "./types";

export interface UseAiSearchOptions<TableFilters> {
  ask: AiAskHandle;
  translateFilters(filters: InvoiceFilters): TableFilters | null;
  applyFilters(filters: TableFilters): void;
  resetFilters(): void;
  applySimpleQuery(query: string | undefined): void;
}

export interface AiSearchState {
  aiMode: boolean;
  openAiMode(): void;
  closeAiMode(): void;
  submit(question: string): void;
  clear(): void;
  active: boolean;
  translated: boolean;
  narrowIds: string[] | undefined;
}

export function useAiSearch<TableFilters>(
  options: UseAiSearchOptions<TableFilters>,
): AiSearchState {
  const { ask } = options;
  const [aiMode, setAiMode] = useState(false);
  const [translated, setTranslated] = useState(false);

  const clear = () => {
    if (translated) options.resetFilters();
    setTranslated(false);
    ask.reset();
  };

  const openAiMode = () => {
    setAiMode(true);
    options.applySimpleQuery(undefined);
  };

  const closeAiMode = () => {
    setAiMode(false);
    clear();
  };

  const submit = (value: string) => {
    if (ask.isPending) return;
    const query = value.trim();
    if (!query) return;
    setTranslated(false);
    ask.mutate(
      { query },
      {
        onSuccess: (data: AiAskResult) => {
          if (data.offTopic) return;
          options.resetFilters();
          if (data.semantic) return;
          if (data.unresolvedCompanyName || data.unresolvedPropertyName) return;
          const next = options.translateFilters(data.resolvedFilters);
          if (!next) return;
          setTranslated(true);
          options.applyFilters(next);
        },
      },
    );
  };

  const active = ask.data !== undefined;
  const narrowIds =
    active && !translated && ask.data && shouldNarrowList(ask.data)
      ? ask.data.matches.map((match) => match.id)
      : undefined;

  return {
    aiMode,
    openAiMode,
    closeAiMode,
    submit,
    clear,
    active,
    translated,
    narrowIds,
  };
}
