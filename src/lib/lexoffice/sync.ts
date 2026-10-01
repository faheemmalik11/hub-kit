import {
  LEXOFFICE_LISTABLE_INVOICE_STATUSES,
  normalizeLexofficeVoucherStatus,
  toPlainDate,
  type LexofficeClient,
  type LexofficeContactSummary,
  type LexofficeListableInvoiceStatus,
  type LexofficeVoucherStatus,
  type LexofficeVoucherSummary,
} from "./client";
import { readableLexofficeError } from "./errors";
import { netFromGrossAndTax, roundToCents } from "./invoice-totals";

export interface LexofficeSyncedInvoice {
  lexofficeVoucherId: string;
  customerId: string;
  voucherNumber: string | null;
  voucherStatus: LexofficeVoucherStatus;
  voucherDate: string | null;
  dueDate: string | null;
  amountGross: number | null;
  amountNet: number | null;
  dunningLevel: number | null;
  dunningDueDate: string | null;
}

export interface LexofficeSyncStore {
  customerIdsByContactId(): Promise<Map<string, string>>;
  createCustomerFromContact(contact: LexofficeContactSummary): Promise<string | null>;
  isInvoiceOwnedByAnotherCompany(lexofficeVoucherId: string): Promise<boolean>;
  saveInvoice(invoice: LexofficeSyncedInvoice): Promise<boolean>;
}

export interface LexofficeFailedStatus {
  status: LexofficeListableInvoiceStatus;
  reason: string;
}

export interface LexofficeSyncResult {
  invoicesSynced: number;
  customersSynced: number;
  failedStatuses: LexofficeFailedStatus[];
}

export function describeFailedStatuses(failedStatuses: LexofficeFailedStatus[]): string {
  const details = failedStatuses.map((failed) => `${failed.status} (${failed.reason})`).join("; ");
  return `Sync partially failed: could not fully fetch voucherStatus ${details}. Some invoices may not reflect their latest LexOffice status this run.`;
}

async function bestEffort<T>(load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await load();
  } catch {
    return fallback;
  }
}

async function resolveCustomerId(
  voucher: LexofficeVoucherSummary,
  client: LexofficeClient,
  store: LexofficeSyncStore,
  customerIdByContactId: Map<string, string>,
): Promise<{ customerId: string | null; createdCustomer: boolean }> {
  if (!voucher.contactId) return { customerId: null, createdCustomer: false };
  const known = customerIdByContactId.get(voucher.contactId);
  if (known) return { customerId: known, createdCustomer: false };

  const contactId = voucher.contactId;
  const createdId = await bestEffort(async () => {
    const contact = await client.getContactSummary(contactId);
    return store.createCustomerFromContact({ ...contact, name: contact.name ?? voucher.contactName ?? "—" });
  }, null);
  if (!createdId) return { customerId: null, createdCustomer: false };
  customerIdByContactId.set(contactId, createdId);
  return { customerId: createdId, createdCustomer: true };
}

async function syncedInvoiceFrom(
  voucher: LexofficeVoucherSummary,
  customerId: string,
  client: LexofficeClient,
): Promise<LexofficeSyncedInvoice> {
  const voucherStatus = normalizeLexofficeVoucherStatus(voucher.voucherStatus);
  const dunning =
    voucherStatus === "open" ? await bestEffort(() => client.getLatestDunning(voucher.id), null) : null;

  let amountNet = netFromGrossAndTax(voucher.totalAmount, voucher.taxAmount);
  if (amountNet == null) {
    const fetchedNet = await bestEffort(() => client.getInvoiceNetAmount(voucher.id), null);
    amountNet = fetchedNet == null ? null : roundToCents(fetchedNet);
  }

  return {
    lexofficeVoucherId: voucher.id,
    customerId,
    voucherNumber: voucher.voucherNumber,
    voucherStatus,
    voucherDate: toPlainDate(voucher.voucherDate),
    dueDate: toPlainDate(voucher.dueDate),
    amountGross: voucher.totalAmount,
    amountNet,
    dunningLevel: dunning?.level ?? null,
    dunningDueDate: dunning?.dueDate ?? null,
  };
}

export async function syncLexofficeInvoices(
  client: LexofficeClient,
  store: LexofficeSyncStore,
): Promise<LexofficeSyncResult> {
  const result: LexofficeSyncResult = { invoicesSynced: 0, customersSynced: 0, failedStatuses: [] };
  const customerIdByContactId = await store.customerIdsByContactId();

  for (const status of LEXOFFICE_LISTABLE_INVOICE_STATUSES) {
    for (let page = 0, isLastPage = false; !isLastPage; page++) {
      let vouchers: LexofficeVoucherSummary[];
      try {
        const voucherPage = await client.listInvoices(status, page);
        vouchers = voucherPage.vouchers;
        isLastPage = voucherPage.isLastPage;
      } catch (error) {
        result.failedStatuses.push({ status, reason: readableLexofficeError(error) });
        break;
      }

      for (const voucher of vouchers) {
        const { customerId, createdCustomer } = await resolveCustomerId(
          voucher,
          client,
          store,
          customerIdByContactId,
        );
        if (createdCustomer) result.customersSynced++;
        if (!customerId) continue;
        if (await store.isInvoiceOwnedByAnotherCompany(voucher.id)) continue;

        const saved = await store.saveInvoice(await syncedInvoiceFrom(voucher, customerId, client));
        if (saved) result.invoicesSynced++;
      }
    }
  }

  return result;
}
