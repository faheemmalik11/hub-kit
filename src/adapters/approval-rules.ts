import type { QueryResult } from "../lib/query-result";

export type DimensionKey = "supplier" | "businessLine" | "property" | "company";

export const DIMENSION_WEIGHT: Record<DimensionKey, number> = {
  supplier: 8,
  businessLine: 4,
  property: 2,
  company: 1,
};

export const PINNED_DIMENSION_WEIGHT = 16;

export const ANY_VALUE = "__any";

export interface ScopeOption {
  id: string;

  label: string;

  code?: string;

  keywords?: string;
}

export interface ApproverOption {
  id: string;
  name: string;

  isActive: boolean;

  roleLabel?: string;
}

export interface ApprovalRuleView {
  id: string;

  scope: Partial<Record<DimensionKey, string | null>>;

  minAmount: number;

  steps: string[];

  autoFinalStep?: boolean;
  isActive: boolean;

  createdAt: string;
  note: string | null;
}

export interface ApprovalRuleDraft {
  id?: string;
  scope: Partial<Record<DimensionKey, string | null>>;
  minAmount: number;
  steps: string[];

  autoFinalStep?: boolean;
}

export interface RuleQuery {
  scope: Partial<Record<DimensionKey, string | null>>;
  amount: number;
}

export interface ApprovalRulesConfig {
  dimensions: DimensionKey[];

  maxSteps: number;

  defaultChainLabels: string[];
}

export interface ApprovalRulesAdapter {
  config: ApprovalRulesConfig;
  rules: QueryResult<ApprovalRuleView[]>;

  scopeOptions: Partial<Record<DimensionKey, ScopeOption[]>>;
  approvers: ApproverOption[];

  approverName: (userId: string) => string | null;
  saveRule: (draft: ApprovalRuleDraft) => Promise<void>;
  setRuleActive: (id: string, isActive: boolean) => Promise<void>;
  deleteRule: (id: string, reason: string) => Promise<void>;
  isSaving: boolean;
}
