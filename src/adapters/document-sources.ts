import type { ComponentType } from "react";

import type { QueryResult } from "../lib/query-result";

export type SourceKind = "mailbox" | "storage" | "upload" | "portal";

export type SourceStatus = "connected" | "not_connected" | "not_configured";

export type SourceIcon = ComponentType<{ className?: string }> | { imageSrc: string };

export interface FieldOption {
  value: string;
  label: string;
  children?: FieldOption[];
}

export type SourceFieldValue = string | string[] | boolean | null;

export interface SourceField {
  key: string;
  kind: "select" | "multiSelect" | "treeSelect" | "toggle" | "text";
  label: string;
  description?: string;
  value: SourceFieldValue;
  options?: FieldOption[];
  optionsLoading?: boolean;
  optionsError?: boolean;
  placeholder?: string;
  advanced?: boolean;
  showInHeader?: boolean;
}

export interface SourceRun {
  text: string;
  ok: boolean;
  running?: boolean;
}

export interface DocumentSource {
  id: string;
  kind: SourceKind;
  name: string;
  detail: string;
  icon: SourceIcon;
  status: SourceStatus;
  statusDetail: string;
  link?: string;
  lastChangedBy?: string | null;
  selectedItems?: string[];
  selectedItemsLabel?: string;
  selectedItemsLoading?: boolean;
  runs?: SourceRun[];
  fields: SourceField[];
}

export interface FilingStatus {
  active: boolean;
  lastRunLabel: string | null;
  nextRunLabel?: string | null;
}

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
}

export interface DocumentSourcesAdapter {
  useFilingStatus(): FilingStatus;
  useSources(): QueryResult<DocumentSource[]>;
  useCanEdit?(): boolean;
  saveSource(
    sourceId: string,
    values: Record<string, SourceFieldValue>,
  ): Promise<void>;
  refreshOptions?(sourceId: string, fieldKey: string): void;
  testConnection?(sourceId: string): Promise<ConnectionTestResult>;
  connect?(sourceId: string): void;
  addSource?(): void;
}
