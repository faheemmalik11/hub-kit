import type { QueryResult } from "../lib/query-result";

export interface LexofficeCompany {
  id: string;
  code: string;
  name: string | null;
  notApplicable: boolean;
}

export interface LexofficeConnection {
  id: string;
  companyId: string;
  isEnabled: boolean;
  note: string | null;
  updatedAt: string;
}

export interface LexofficeSyncRun {
  status: "success" | "error";
  errorMessage: string | null;
  createdAt: string;
}

export interface LexofficeSyncCounts {
  invoicesSynced: number;
  customersSynced: number;
}

export interface LexofficeConnectionInput {
  companyId: string;
  apiKey: string;
  isEnabled: boolean;
  note: string | null;
}

export interface LexofficeConnectionStatusInput {
  connectionId: string;
  isEnabled: boolean;
  note: string | null;
}

export interface LexofficeConnectionAdapter {
  useCompanies(): QueryResult<LexofficeCompany[]>;
  useConnections(): QueryResult<LexofficeConnection[]>;
  useInvoiceCountByCompany(): Record<string, number>;
  useLastSyncRun(companyId: string | null): QueryResult<LexofficeSyncRun | null>;
  syncCompany(companyId: string): Promise<LexofficeSyncCounts>;
  saveConnection(input: LexofficeConnectionInput): Promise<void>;
  updateConnectionStatus(input: LexofficeConnectionStatusInput): Promise<void>;
  setNotApplicable?: (companyId: string, notApplicable: boolean) => Promise<void>;
  canManage: boolean;
  formatLastRun(iso: string): string;
}
