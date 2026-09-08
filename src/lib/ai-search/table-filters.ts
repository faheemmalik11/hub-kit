import type { InvoiceFilters } from "./types";

export function isFullyRepresentable(filters: InvoiceFilters): boolean {
  if (filters.assignedCompany) return false;
  if (filters.reviewState) return false;
  if (filters.conditions.length > 0) return false;
  if (filters.costCategory || filters.issuerLike || filters.nameLike) return false;
  if (filters.amountMin !== null || filters.amountMax !== null) return false;
  if (filters.paymentState === "overdue") return false;
  return true;
}

export function shouldNarrowList(result: {
  offTopic: boolean;
  broad: boolean;
  aggregate: boolean | object | null;
  matches: unknown[];
}): boolean {
  if (result.offTopic || result.broad) return false;
  if (result.aggregate && result.matches.length === 0) return false;
  return true;
}
