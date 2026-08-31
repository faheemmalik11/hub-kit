export interface BankTransactionsLabels {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  accountAll: string;
  statusAll: string;
  columnDate: string;
  columnCounterparty: string;
  columnReference: string;
  columnAccount: string;
  columnAmount: string;
  columnType: string;
  columnDirection: string;
  columnStatus: string;
  empty: string;
  sortLabel: string;
  sortAscending: string;
  sortDescending: string;
  matchingStatus: (status: string) => string;
  panelTitle: string;
  panelSubtitle: (account: string) => string;
  candidatesTitle: string;
  candidatesEmpty: string;
  candidateConfirm: string;
  candidateReject: string;
  matchConfirmed: string;
  matchRejected: string;
  scoreLabel: (score: number) => string;
  manualSearchToggle: string;
  manualSearchPlaceholder: string;
  manualSearchEmpty: string;
  noReceiptButton: string;
  noReceiptDialogTitle: string;
  noReceiptReasonPlaceholder: string;
  noReceiptConfirm: string;
  noReceiptMarked: string;
  noReceiptClear: string;
  noReceiptCleared: string;
  close: string;
}

export const englishBankTransactionsLabels: BankTransactionsLabels = {
  title: "Bank reconciliation",
  subtitle: "Match incoming bank movements to invoices.",
  searchPlaceholder: "Search counterparty or reference",
  accountAll: "All accounts",
  statusAll: "All statuses",
  columnDate: "Date",
  columnCounterparty: "Counterparty",
  columnReference: "Reference",
  columnAccount: "Account",
  columnAmount: "Amount",
  columnType: "Type",
  columnDirection: "Direction",
  columnStatus: "Status",
  empty: "No transactions found.",
  sortLabel: "Sort by",
  sortAscending: "Ascending",
  sortDescending: "Descending",
  matchingStatus: (status) => status,
  panelTitle: "Match this transaction",
  panelSubtitle: (account) => `Account: ${account}`,
  candidatesTitle: "Suggested matches",
  candidatesEmpty: "No suggested matches.",
  candidateConfirm: "Confirm match",
  candidateReject: "Not a match",
  matchConfirmed: "Match confirmed.",
  matchRejected: "Match rejected.",
  scoreLabel: (score) => `${score}% match`,
  manualSearchToggle: "Search manually",
  manualSearchPlaceholder: "Search invoices…",
  manualSearchEmpty: "No invoices found.",
  noReceiptButton: "No receipt expected",
  noReceiptDialogTitle: "Mark as no receipt expected",
  noReceiptReasonPlaceholder: "Reason",
  noReceiptConfirm: "Confirm",
  noReceiptMarked: "Marked as no receipt expected.",
  noReceiptClear: "Undo",
  noReceiptCleared: "Cleared.",
  close: "Close",
};
