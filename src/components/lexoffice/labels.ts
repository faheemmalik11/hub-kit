import type { IntegrationStatusLabels, NotApplicableLabels } from "../integrations";

export interface LexofficeApiKeyDialogLabels {
  title: (companyCode: string) => string;
  description: string;
  apiKey: string;
  keyStored: string;
  newKeyPlaceholder: string;
  replaceKeyPlaceholder: string;
  whereToFindKey: string;
  keepKeyHint: string;
  enabled: string;
  enabledHint: string;
  note: string;
  notePlaceholder: string;
  cancel: string;
  save: string;
  saved: string;
  saveFailed: (message: string) => string;
}

export interface LexofficeConnectionPanelLabels {
  noCompanies: string;
  columnCompany: string;
  columnAccess: string;
  columnInvoices: string;
  columnLastFetched: string;
  columnActions: string;
  neverFetched: string;
  newKeyNotFetchedYet: string;
  rejectedKey: string;
  genericSyncError: string;
  fetchNow: string;
  fetching: string;
  enterNewKey: string;
  setUp: string;
  edit: string;
  enable: string;
  disable: string;
  fetched: (invoices: number, customers: number) => string;
  fetchFailed: (message: string) => string;
  actionFailed: (message: string) => string;
  unknownError: string;
  status: IntegrationStatusLabels;
  notApplicable: (companyCode: string) => NotApplicableLabels;
  apiKeyDialog: LexofficeApiKeyDialogLabels;
}

export const englishLexofficeApiKeyDialogLabels: LexofficeApiKeyDialogLabels = {
  title: (companyCode) => `Connect LexOffice: ${companyCode}`,
  description: "The key is stored securely and never shown again.",
  apiKey: "LexOffice API key",
  keyStored: "A key is stored.",
  newKeyPlaceholder: "Paste the key here...",
  replaceKeyPlaceholder: "Paste a new key...",
  whereToFindKey: "You find the key in LexOffice under Extensions, Public API.",
  keepKeyHint: "Leave empty to keep the current key.",
  enabled: "Enabled",
  enabledHint: "Off: no sync, no new invoices.",
  note: "Note",
  notePlaceholder: "Optional",
  cancel: "Cancel",
  save: "Save",
  saved: "Saved",
  saveFailed: (message) => `Saving failed: ${message}`,
};

export const englishLexofficeConnectionPanelLabels: LexofficeConnectionPanelLabels = {
  noCompanies: "No companies yet.",
  columnCompany: "Company",
  columnAccess: "LexOffice access",
  columnInvoices: "Invoices",
  columnLastFetched: "Last fetched",
  columnActions: "Actions",
  neverFetched: "never fetched yet",
  newKeyNotFetchedYet: "New key saved, not fetched yet.",
  rejectedKey: "LexOffice rejects the stored API key. Enter a new key under Edit.",
  genericSyncError: "The last fetch failed. Try again or check the API key.",
  fetchNow: "Fetch from LexOffice",
  fetching: "Fetching...",
  enterNewKey: "Enter new key",
  setUp: "Set up",
  edit: "Edit",
  enable: "Enable",
  disable: "Disable",
  fetched: (invoices, customers) =>
    `Fetched ${invoices} invoices and ${customers} customers from LexOffice.`,
  fetchFailed: (message) => `Failed: ${message}`,
  actionFailed: (message) => `Nothing was changed. ${message}`,
  unknownError: "Unknown error.",
  status: {
    configured: "Configured",
    notConfigured: "Not configured",
    disabled: "Disabled",
    notApplicable: "Not applicable",
    problem: "Fetch failing",
  },
  notApplicable: (companyCode) => ({
    markNotApplicable: "Not applicable",
    undoNotApplicable: "Make applicable",
    markTitle: `LexOffice doesn't apply to ${companyCode}?`,
    markText:
      "The company stops being listed as outstanding in the onboarding checklist, and no outgoing invoices can be created for it through LexOffice. This can be undone at any time.",
    undoTitle: `LexOffice applies to ${companyCode} after all?`,
    undoText: "The company appears in the onboarding checklist again until a LexOffice access is configured.",
    confirm: "Confirm",
    cancel: "Cancel",
  }),
  apiKeyDialog: englishLexofficeApiKeyDialogLabels,
};
