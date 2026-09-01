export interface CategoryRulesLabels {
  title: string;
  subtitle: string;
  tabCategories: string;
  tabRules: string;
  newCategoryButton: string;
  columnCode: string;
  columnName: string;
  columnBlock: string;
  columnDirection: string;
  catchallBadge: string;
  excludedBadge: string;
  inactiveBadge: string;
  emptyCategories: string;
  editButton: string;
  archiveButton: string;
  moveUp: string;
  moveDown: string;
  newCategoryTitle: string;
  editCategoryTitle: string;
  fieldCode: string;
  fieldName: string;
  fieldParent: string;
  parentNone: string;
  fieldBlock: string;
  fieldLine: string;
  fieldDirection: string;
  directionIncoming: string;
  directionOutgoing: string;
  block: Record<string, string>;
  fieldNote: string;
  cancel: string;
  save: string;
  saving: string;
  saveFailed: (error: string) => string;
  savedToast: string;
  archivedToast: string;
  rulesHint: string;
  newRuleButton: string;
  newRuleTitle: string;
  fieldCategory: string;
  fieldSupplier: string;
  supplierAny: string;
  fieldProperty: string;
  propertyAny: string;
  fieldCompany: string;
  companyAny: string;
  fieldReferencePattern: string;
  fieldReferencePatternPlaceholder: string;
  emptyRules: string;
  emptyRulesHint: string;
  deleteButton: string;
  deleteDialogTitle: string;
  deleteDialogDescription: string;
  deleteCancel: string;
  deleteConfirm: string;
  deletedToast: string;
  scopeSupplier: string;
  scopeProperty: string;
  scopeCompany: string;
  scopeReference: string;
  ruleCreated: string;
  activateButton: string;
  deactivateButton: string;
}

export const englishCategoryRulesLabels: CategoryRulesLabels = {
  title: "Categories & rules",
  subtitle: "The cost taxonomy the evaluation is built on, and the rules that assign invoices to it.",
  tabCategories: "Categories",
  tabRules: "Rules",
  newCategoryButton: "New category",
  columnCode: "Code",
  columnName: "Name",
  columnBlock: "Block",
  columnDirection: "Direction",
  catchallBadge: "Catch-all",
  excludedBadge: "Excluded from P&L",
  inactiveBadge: "Inactive",
  emptyCategories: "No categories yet.",
  editButton: "Edit",
  archiveButton: "Archive",
  moveUp: "Move up",
  moveDown: "Move down",
  newCategoryTitle: "New category",
  editCategoryTitle: "Edit category",
  fieldCode: "Code",
  fieldName: "Name",
  fieldParent: "Parent category",
  parentNone: "Top-level",
  fieldBlock: "P&L block",
  fieldLine: "P&L line",
  fieldDirection: "Direction",
  directionIncoming: "Incoming",
  directionOutgoing: "Outgoing",
  block: {
    revenue: "Revenue",
    cost_of_goods: "Cost of goods",
    costs: "Costs",
    neutral: "Neutral",
    taxes: "Taxes",
    special_case: "Special case",
  },
  fieldNote: "Note",
  cancel: "Cancel",
  save: "Save",
  saving: "Saving…",
  saveFailed: (error) => `Could not save: ${error}`,
  savedToast: "Category saved.",
  archivedToast: "Category archived.",
  rulesHint: "A rule assigns a category automatically to any invoice matching its scope. The most specific rule wins.",
  newRuleButton: "New rule",
  newRuleTitle: "New assignment rule",
  fieldCategory: "Category",
  fieldSupplier: "Supplier",
  supplierAny: "Any supplier",
  fieldProperty: "Property",
  propertyAny: "Any property",
  fieldCompany: "Company",
  companyAny: "Any company",
  fieldReferencePattern: "Reference contains",
  fieldReferencePatternPlaceholder: "Optional text match",
  emptyRules: "No rules yet.",
  emptyRulesHint: "Rules created here apply automatically to new invoices.",
  deleteButton: "Delete",
  deleteDialogTitle: "Delete this rule?",
  deleteDialogDescription: "Invoices it already assigned keep their category; only future matching stops.",
  deleteCancel: "Cancel",
  deleteConfirm: "Delete",
  deletedToast: "Rule deleted.",
  scopeSupplier: "Supplier",
  scopeProperty: "Property",
  scopeCompany: "Company",
  scopeReference: "Reference",
  ruleCreated: "Rule created.",
  activateButton: "Activate",
  deactivateButton: "Deactivate",
};
