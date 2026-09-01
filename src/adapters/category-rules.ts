export type BwaBlock = "revenue" | "cost_of_goods" | "costs" | "neutral" | "taxes" | "special_case";
export type CategoryDirection = "incoming" | "outgoing";

export interface CategoryRecord {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  bwaBlock: BwaBlock;
  bwaLine: string;
  direction: CategoryDirection;
  sortOrder: number;
  isCatchall: boolean;
  isExcludedFromPnl: boolean;
  isActive: boolean;
  note: string | null;
}

export interface NewCategory {
  code: string;
  name: string;
  parentId: string | null;
  bwaBlock: BwaBlock;
  bwaLine: string;
  direction: CategoryDirection;
  note: string | null;
}

export interface AssignmentRuleScopeChip {
  label: string;
  value: string;
}

export interface AssignmentRuleRow {
  id: string;
  categoryLabel: string;
  scopeChips: AssignmentRuleScopeChip[];
  isActive: boolean;
  note: string | null;
  createdAt: string;
}

export interface NewAssignmentRule {
  categoryId: string;
  supplierId: string | null;
  propertyId: string | null;
  companyId: string | null;
  referencePattern: string | null;
  note: string | null;
}

export interface CategoryRulesAdapter {
  useCategories(): { data: CategoryRecord[]; loading: boolean; error: unknown };
  createCategory(input: NewCategory): Promise<void>;
  updateCategory(id: string, input: Partial<NewCategory>): Promise<void>;
  archiveCategory(id: string): Promise<void>;
  moveCategory(id: string, direction: "up" | "down"): Promise<void>;

  useRules(): { data: AssignmentRuleRow[]; loading: boolean; error: unknown };
  useCategoryOptions(): { data: { id: string; label: string }[]; loading: boolean };
  useSupplierOptions(): { data: { id: string; name: string }[]; loading: boolean };
  usePropertyOptions(): { data: { id: string; code: string; name: string | null }[]; loading: boolean };
  useCompanyOptions(): { data: { id: string; code: string; name: string }[]; loading: boolean };
  createRule(input: NewAssignmentRule): Promise<void>;
  setRuleActive(id: string, active: boolean): Promise<void>;
  deleteRule(id: string): Promise<void>;
}
