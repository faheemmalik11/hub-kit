import { ReviewBadgeLabels } from "./ReviewBadge";
import { ReviewCardLabels } from "./ReviewCard";
import { WorkflowLadderLabels } from "./WorkflowLadder";
import { WorkflowHistoryLabels } from "./WorkflowHistoryList";
import { OutgoingInvoiceLabels } from "./OutgoingInvoiceFlag";
import { ReviewLabels, ReviewReasonId } from "./review";
import { HistoryLabels } from "./history";

export interface InvoiceDetailLabels {
  review: ReviewBadgeLabels & ReviewCardLabels & ReviewLabels;
  workflowLadder: WorkflowLadderLabels;
  workflowHistory: WorkflowHistoryLabels;
  outgoing: OutgoingInvoiceLabels;
  history: HistoryLabels;
}

const DURATION_UNIT_WORD: Record<"minuten" | "stunden" | "tage", string> = {
  minuten: "minute",
  stunden: "hour",
  tage: "day",
};

function pluralize(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

const REASON_TEXT: Record<
  ReviewReasonId,
  (params: { confidence?: { found: number; required: number }; ibanCount?: number }) => string
> = {
  brutto_fehlt: () => "The gross amount is missing.",
  steller_fehlt: () => "The issuer is missing.",
  summe_stimmt_nicht: () => "Net + VAT does not add up to the total.",
  ust_satz_ungueltig: () => "The VAT rate is not one of the active rates.",
  iban_ungueltig: () => "The IBAN's checksum does not check out.",
  datum_zukunft: () => "The document date is in the future.",
  rechnungsnr_fehlt: () => "The invoice number is missing.",
  datum_fehlt: () => "The document date is missing.",
  iban_fehlt: () => "No IBAN was found to pay this to.",
  empfaenger_fehlt: () => "The recipient name is missing.",
  iban_mehrere: (p) => `${p.ibanCount ?? "Several"} IBANs were found; which one is unclear.`,
  konfidenz_unter_schwelle: (p) =>
    p.confidence ? `Extraction confidence ${p.confidence.found}% is below the ${p.confidence.required}% required.` : "Extraction confidence is below the required threshold.",
  nicht_relevant: () => "This does not read as an invoice this pipeline handles.",
  gesellschaft_fehlt: () => "No company could be resolved for this invoice.",
  manuell_markiert: () => "Marked for review by hand.",
  keine_ueberweisung_belegt: () => "No transfer proof was found for this payment.",
  lastschrift_erkannt: () => "This looks like a direct debit, not a transfer.",
  ocr_ohne_sichtpruefung: () => "OCR text with no visual check yet.",
  keine_rechnung_bestaetigt: () => "Not yet confirmed as an invoice.",
  konfidenz_unter_sicherheitsgrenze: () => "Confidence is below the safety floor.",
  zahlungsnachweis_veraltet: () => "The payment proof is out of date.",
  nicht_lesbar: () => "The document could not be read.",
  ausgeschlossen: () => "Excluded by an exclusion rule.",
};

export const englishInvoiceDetailLabels: InvoiceDetailLabels = {
  review: {
    none: "Reviewed",
    duplicate: "Duplicate",
    excluded: "Excluded",
    alreadyPaid: "Already paid",
    needed: "Needs review",
    title: "Needs review",
    checks: (count) => pluralize(count, "check"),
    choose: "Choose",
    fix: "Fix",
    gateLabel: () => undefined,
    gateHint: (field) => field,
    reasonText: (id, params) => REASON_TEXT[id](params),
    sumComparison: (expected, found) => `Expected ${expected}, document says ${found}.`,
    formatMoney: (value) => value.toFixed(2),
  },
  workflowLadder: {
    navAriaLabel: "Workflow stage",
    stepLabel: (step) => step,
  },
  workflowHistory: {
    emptyText: "No history yet.",
    actorSystem: "System",
    actingAs: (name) => `acting as ${name}`,
    reason: "Reason",
    arrivedLabel: "Arrived",
    formatDateTime: (iso) => iso,
    durationShort: (value, unit) => pluralize(value, DURATION_UNIT_WORD[unit]),
  },
  outgoing: {
    banner: (issuer, recipient) => `Outgoing invoice: from ${issuer} to ${recipient}.`,
    bannerShort: "Outgoing",
    unknownIssuer: "unknown issuer",
    unknownRecipient: "unknown recipient",
  },
  history: {
    typeLabel: (type) => type,
    stateLabel: (targetStatus) => targetStatus,
    corrected: "Manually corrected",
    queryAdditional: "Sent back with a query",
  },
};
