import type { LexofficeInvoiceLine } from "./client";

export interface InvoiceLineWithGross extends LexofficeInvoiceLine {
  amountGross: number;
}

export interface InvoiceTotals {
  amountNet: number;
  amountGross: number;
  lines: InvoiceLineWithGross[];
}

function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function lineGross(line: LexofficeInvoiceLine): number {
  return line.amountNet * line.quantity * (1 + line.vatRate / 100);
}

export function invoiceTotals(lines: LexofficeInvoiceLine[]): InvoiceTotals {
  let amountNet = 0;
  let amountGross = 0;
  for (const line of lines) {
    amountNet += line.amountNet * line.quantity;
    amountGross += lineGross(line);
  }
  return {
    amountNet: roundToCents(amountNet),
    amountGross: roundToCents(amountGross),
    lines: lines.map((line) => ({ ...line, amountGross: roundToCents(lineGross(line)) })),
  };
}

export function netFromGrossAndTax(totalAmount: number | null, taxAmount: number | null): number | null {
  if (totalAmount == null || taxAmount == null) return null;
  return roundToCents(totalAmount - taxAmount);
}

export { roundToCents };
