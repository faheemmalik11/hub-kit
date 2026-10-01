import { LexofficeApiError, readableLexofficeError } from "./errors";

const LEXOFFICE_BASE_URL = "https://api.lexware.io/v1";
const MINIMUM_GAP_BETWEEN_REQUESTS_MS = 550;
const RATE_LIMIT_RETRIES = 3;
const VOUCHER_PAGE_SIZE = 100;

export type LexofficeVoucherStatus = "draft" | "open" | "paidoff" | "voided";

export const LEXOFFICE_LISTABLE_INVOICE_STATUSES = [
  "draft",
  "open",
  "paidoff",
  "voided",
  "overdue",
] as const;

export type LexofficeListableInvoiceStatus = (typeof LEXOFFICE_LISTABLE_INVOICE_STATUSES)[number];

export interface LexofficeContactFields {
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  addressStreet: string;
  addressZip: string;
  addressCity: string;
  addressCountryCode: string;
  vatId: string | null;
}

export interface LexofficeNewContact extends LexofficeContactFields {
  isCompany: boolean;
}

export interface LexofficeInvoiceLine {
  description: string;
  quantity: number;
  unitName: string;
  amountNet: number;
  vatRate: number;
}

export interface LexofficeDraftInvoice {
  contactId: string;
  voucherDate: string;
  lineItems: LexofficeInvoiceLine[];
}

export interface LexofficeVoucherSummary {
  id: string;
  voucherNumber: string | null;
  voucherStatus: string;
  voucherDate: string | null;
  dueDate: string | null;
  contactId: string | null;
  contactName: string | null;
  totalAmount: number | null;
  taxAmount: number | null;
}

export interface LexofficeVoucherPage {
  vouchers: LexofficeVoucherSummary[];
  isLastPage: boolean;
}

export interface LexofficeContactSummary {
  id: string;
  isCompany: boolean;
  name: string | null;
}

export interface LexofficeDunning {
  level: number | null;
  dueDate: string | null;
}

export interface LexofficeClient {
  createContact(contact: LexofficeNewContact): Promise<{ id: string }>;
  updateContact(contactId: string, isCompany: boolean, fields: LexofficeContactFields): Promise<void>;
  getContactSummary(contactId: string): Promise<LexofficeContactSummary>;
  createDraftInvoice(invoice: LexofficeDraftInvoice): Promise<{ id: string }>;
  listInvoices(status: LexofficeListableInvoiceStatus, page: number): Promise<LexofficeVoucherPage>;
  getLatestDunning(invoiceId: string): Promise<LexofficeDunning | null>;
  getInvoiceNetAmount(invoiceId: string): Promise<number | null>;
}

export interface LexofficeClientOptions {
  apiKey: string;
  fetchImpl?: typeof fetch;
}

type LexofficeContactResource = Record<string, unknown> & {
  version?: number;
  company?: Record<string, unknown> & { name?: string };
  person?: Record<string, unknown> & { lastName?: string };
  addresses?: { billing?: Record<string, unknown>[] } & Record<string, unknown>;
  emailAddresses?: Record<string, unknown>;
  phoneNumbers?: Record<string, unknown>;
  vatRegistrationId?: string;
};

interface RawVoucherlistResponse {
  content?: Array<Partial<LexofficeVoucherSummary> & { id: string; voucherStatus: string }>;
  last?: boolean;
}

const requestQueueByApiKey = new Map<string, { queue: Promise<void>; lastRequestAt: number }>();

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function waitForRequestSlot(apiKey: string): Promise<void> {
  const state = requestQueueByApiKey.get(apiKey) ?? { queue: Promise.resolve(), lastRequestAt: 0 };
  requestQueueByApiKey.set(apiKey, state);
  const turn = state.queue.then(async () => {
    const sinceLastRequest = Date.now() - state.lastRequestAt;
    if (sinceLastRequest < MINIMUM_GAP_BETWEEN_REQUESTS_MS) {
      await sleep(MINIMUM_GAP_BETWEEN_REQUESTS_MS - sinceLastRequest);
    }
    state.lastRequestAt = Date.now();
  });
  state.queue = turn.catch(() => undefined);
  return turn;
}

function retryDelayMs(response: Response, attempt: number): number {
  const retryAfterSeconds = Number(response.headers.get("Retry-After"));
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) return retryAfterSeconds * 1000;
  return MINIMUM_GAP_BETWEEN_REQUESTS_MS * (attempt + 2);
}

export function toLexofficeDate(isoDate: string): string {
  return `${isoDate}T12:00:00.000Z`;
}

export function toPlainDate(lexofficeDateTime: string | null | undefined): string | null {
  return lexofficeDateTime ? lexofficeDateTime.slice(0, 10) : null;
}

export function normalizeLexofficeVoucherStatus(rawStatus: string): LexofficeVoucherStatus {
  if (rawStatus === "paid" || rawStatus === "paidoff") return "paidoff";
  if (rawStatus === "voided") return "voided";
  if (rawStatus === "draft") return "draft";
  return "open";
}

export function lexofficeInvoiceUrl(invoiceId: string, status: LexofficeVoucherStatus): string {
  const mode = status === "draft" ? "edit" : "view";
  return `https://app.lexware.de/permalink/invoices/${mode}/${invoiceId}`;
}

function contactGroupWithoutBusiness(
  group: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!group) return undefined;
  const otherCategories = { ...group };
  delete otherCategories.business;
  return Object.keys(otherCategories).length > 0 ? otherCategories : undefined;
}

function billingAddress(fields: LexofficeContactFields) {
  return {
    street: fields.addressStreet,
    zip: fields.addressZip,
    city: fields.addressCity,
    countryCode: fields.addressCountryCode,
  };
}

function contactPersons(fields: LexofficeContactFields) {
  return fields.contactPerson ? [{ lastName: fields.contactPerson }] : [];
}

function newContactBody(contact: LexofficeNewContact) {
  return {
    version: 0,
    roles: { customer: {} },
    ...(contact.isCompany
      ? { company: { name: contact.name, contactPersons: contactPersons(contact) } }
      : { person: { lastName: contact.name } }),
    addresses: { billing: [billingAddress(contact)] },
    ...(contact.email ? { emailAddresses: { business: [contact.email] } } : {}),
    ...(contact.phone ? { phoneNumbers: { business: [contact.phone] } } : {}),
    ...(contact.vatId ? { vatRegistrationId: contact.vatId } : {}),
  };
}

function contactWithEditedFields(
  current: LexofficeContactResource,
  isCompany: boolean,
  fields: LexofficeContactFields,
): LexofficeContactResource {
  const next: LexofficeContactResource = { ...current };
  if (isCompany) {
    next.company = { ...(current.company ?? {}), name: fields.name, contactPersons: contactPersons(fields) };
  } else {
    next.person = { ...(current.person ?? {}), lastName: fields.name };
  }
  next.addresses = {
    ...(current.addresses ?? {}),
    billing: [{ ...(current.addresses?.billing?.[0] ?? {}), ...billingAddress(fields) }],
  };
  next.emailAddresses = fields.email
    ? { ...(current.emailAddresses ?? {}), business: [fields.email] }
    : contactGroupWithoutBusiness(current.emailAddresses);
  next.phoneNumbers = fields.phone
    ? { ...(current.phoneNumbers ?? {}), business: [fields.phone] }
    : contactGroupWithoutBusiness(current.phoneNumbers);
  next.vatRegistrationId = fields.vatId ?? undefined;
  return next;
}

function draftInvoiceBody(invoice: LexofficeDraftInvoice) {
  return {
    voucherDate: toLexofficeDate(invoice.voucherDate),
    address: { contactId: invoice.contactId },
    lineItems: invoice.lineItems.map((line) => ({
      type: "custom",
      name: line.description,
      quantity: line.quantity,
      unitName: line.unitName,
      unitPrice: { currency: "EUR", netAmount: line.amountNet, taxRatePercentage: line.vatRate },
    })),
    totalPrice: { currency: "EUR" },
    taxConditions: { taxType: "net" },
    shippingConditions: { shippingType: "service", shippingDate: toLexofficeDate(invoice.voucherDate) },
  };
}

function voucherSummaryFrom(raw: NonNullable<RawVoucherlistResponse["content"]>[number]): LexofficeVoucherSummary {
  return {
    id: raw.id,
    voucherNumber: raw.voucherNumber ?? null,
    voucherStatus: raw.voucherStatus,
    voucherDate: raw.voucherDate ?? null,
    dueDate: raw.dueDate ?? null,
    contactId: raw.contactId ?? null,
    contactName: raw.contactName ?? null,
    totalAmount: raw.totalAmount ?? null,
    taxAmount: raw.taxAmount ?? null,
  };
}

export function createLexofficeClient(options: LexofficeClientOptions): LexofficeClient {
  const doFetch = options.fetchImpl ?? fetch;

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      await waitForRequestSlot(options.apiKey);
      let response: Response;
      try {
        response = await doFetch(`${LEXOFFICE_BASE_URL}${path}`, {
          ...init,
          headers: {
            Authorization: `Bearer ${options.apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            ...init?.headers,
          },
        });
      } catch (error) {
        throw new LexofficeApiError(`LexOffice request failed: ${readableLexofficeError(error)}`, null, path);
      }
      if (response.status === 429 && attempt < RATE_LIMIT_RETRIES) {
        await sleep(retryDelayMs(response, attempt));
        continue;
      }
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new LexofficeApiError(
          `LexOffice API returned ${response.status} for ${path}: ${body.slice(0, 500)}`,
          response.status,
          path,
        );
      }
      if (response.status === 204) return undefined as T;
      return (await response.json()) as T;
    }
  }

  return {
    createContact(contact) {
      return request<{ id: string }>("/contacts", {
        method: "POST",
        body: JSON.stringify(newContactBody(contact)),
      });
    },

    async updateContact(contactId, isCompany, fields) {
      const path = `/contacts/${contactId}`;
      const current = await request<LexofficeContactResource>(path);
      try {
        await request(path, {
          method: "PUT",
          body: JSON.stringify(contactWithEditedFields(current, isCompany, fields)),
        });
      } catch (error) {
        if (error instanceof LexofficeApiError && error.status === 409) {
          throw new LexofficeApiError(
            "This contact was changed in LexOffice in the meantime. Reload the customer and try again.",
            409,
            path,
          );
        }
        throw error;
      }
    },

    async getContactSummary(contactId) {
      const contact = await request<LexofficeContactResource>(`/contacts/${contactId}`);
      return {
        id: contactId,
        isCompany: !!contact.company,
        name: contact.company?.name ?? contact.person?.lastName ?? null,
      };
    },

    createDraftInvoice(invoice) {
      return request<{ id: string }>("/invoices", {
        method: "POST",
        body: JSON.stringify(draftInvoiceBody(invoice)),
      });
    },

    async listInvoices(status, page) {
      const response = await request<RawVoucherlistResponse>(
        `/voucherlist?voucherType=invoice&voucherStatus=${status}&page=${page}&size=${VOUCHER_PAGE_SIZE}`,
      );
      return {
        vouchers: (response.content ?? []).map(voucherSummaryFrom),
        isLastPage: response.last ?? true,
      };
    },

    async getLatestDunning(invoiceId) {
      const response = await request<{ content?: Array<{ dunningLevel?: number | null; dueDate?: string | null }> }>(
        `/dunnings?precedingSalesVoucherId=${invoiceId}`,
      );
      const latest = (response.content ?? [])[0];
      if (!latest) return null;
      return { level: latest.dunningLevel ?? null, dueDate: toPlainDate(latest.dueDate) };
    },

    async getInvoiceNetAmount(invoiceId) {
      const invoice = await request<{ totalPrice?: { totalNetAmount?: number | null } }>(
        `/invoices/${invoiceId}`,
      );
      return invoice.totalPrice?.totalNetAmount ?? null;
    },
  };
}
