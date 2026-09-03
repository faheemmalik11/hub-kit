export interface DocumentSourcesLabels {
  title: string;
  howItWorks?: string;
  learnMore?: string;
  addSourceTitle?: string;
  addSourceDetail?: string;
  subtitle: string;
  filingActive: string;
  filingActiveDetail: string;
  filingInactive: string;
  filingInactiveDetail: string;
  lastRun: string;
  viewLogs: string;
  sourcesTitle: string;
  noSources: string;
  statusConnected: string;
  statusNotConnected: string;
  statusNotConfigured: string;
  edit: string;
  open?: string;
  connect: string;
  setUp: string;
  footerTitle: string;
  footerDetail: string;
  nextRun?: string;
  sheet: {
    close: string;
    refreshOptions: string;
    optionsLoading: string;
    optionsFailed: string;
    unknownValue?: (shortId: string) => string;
    selectedCount?: (count: number) => string;
    searchPlaceholder?: string;
    noMatch?: string;
    lastChangedBy: (name: string) => string;
    adminOnly: string;
    testConnection: string;
    testRunning: string;
    advanced: string;
    none: string;
    cancel: string;
    save: string;
    saving: string;
    saveFailed: string;
    saved: string;
  };
}

export const englishDocumentSourcesLabels: DocumentSourcesLabels = {
  title: "Document sources & filing",
  howItWorks: "How it works",
  learnMore: "Learn more about filing",
  addSourceTitle: "Add document source",
  addSourceDetail: "Email, cloud storage and more",
  subtitle:
    "Choose where documents are collected from and what happens to them after processing.",
  filingActive: "Filing is active",
  filingActiveDetail:
    "Documents are being collected from your connected sources.",
  filingInactive: "Filing is paused",
  filingInactiveDetail: "No documents are being collected right now.",
  lastRun: "Last run",
  viewLogs: "View logs",
  sourcesTitle: "Document sources",
  noSources: "No sources are set up for this project.",
  statusConnected: "Connected",
  statusNotConnected: "Not connected",
  statusNotConfigured: "Not configured",
  edit: "Edit",
  open: "Open",
  connect: "Connect",
  setUp: "Set up",
  footerTitle: "Configurations are used by the filing service",
  footerDetail:
    "Changes you make here are applied the next time documents are processed.",
  nextRun: "Next run",
  sheet: {
    close: "Close",
    refreshOptions: "Refresh",
    optionsLoading: "Loading…",
    optionsFailed: "The list could not be loaded. Saved values are kept.",
    unknownValue: (shortId) => `Unknown entry ${shortId}`,
    selectedCount: (count) => `${count} selected`,
    searchPlaceholder: "Search …",
    noMatch: "No match found.",
    lastChangedBy: (name) => `Last changed by ${name}`,
    adminOnly: "Only administrators can change these settings.",
    testConnection: "Test connection",
    testRunning: "Testing…",
    advanced: "Advanced settings",
    none: "(none)",
    cancel: "Cancel",
    save: "Save changes",
    saving: "Saving…",
    saveFailed: "Saving failed. Please try again.",
    saved: "Saved.",
  },
};
