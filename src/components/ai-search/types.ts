import type { InvoiceFilters, InvoiceMatch } from "../../lib/ai-search/types";

export interface AiAskResult {
  answer: string;
  matches: InvoiceMatch[];
  totalMatches: number | null;
  semantic: boolean;
  aggregate: boolean;
  offTopic: boolean;
  broad: boolean;
  resolvedFilters: InvoiceFilters;
  unresolvedCompanyName: string | null;
  unresolvedPropertyName: string | null;
}

export interface AiAskHandle {
  data: AiAskResult | undefined;
  isPending: boolean;
  isError: boolean;
  mutate(
    input: { query: string },
    callbacks?: { onSuccess?: (data: AiAskResult) => void },
  ): void;
  reset(): void;
}
