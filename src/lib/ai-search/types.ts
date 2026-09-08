export interface AiSearchVocabulary {
  companies: { code: string; name: string | null }[];
  properties: { code: string; name: string | null }[];
  categories: string[];
  suppliers: string[];
}

export interface ConditionFieldSpec {
  key: string;
  type: "number" | "date" | "text";
  description: string;
}

export type ConditionOperator = "eq" | "neq" | "gte" | "lte" | "contains";

export interface SearchCondition {
  field: string;
  op: ConditionOperator;
  value: string | number;
}

export interface InvoiceFilters {
  conditions: SearchCondition[];
  companyCode: string | null;
  unassignedCompany: boolean;
  assignedCompany: boolean;
  propertyCode: string | null;
  costCategory: string | null;
  issuerLike: string | null;
  nameLike: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  status: string | null;
  reviewState: "needed" | "clear" | null;
  paymentState: "open" | "paid" | "overdue" | null;
  amountMin: number | null;
  amountMax: number | null;
}

export type SumField = "gross" | "net" | "vat";
export type GroupByDimension = "company" | "issuer" | "property" | "category";
export type AnswerLanguage = "de" | "en";

export interface QueryAspects {
  needsCompanies: boolean;
  needsProperties: boolean;
  needsCategories: boolean;
  needsSuppliers: boolean;
  offTopic: boolean;
  language: AnswerLanguage;
}

export interface SearchIntent {
  filters: InvoiceFilters;
  unresolvedCompanyName: string | null;
  unresolvedPropertyName: string | null;
  unsupportedAspects: string[];
  groupBy: GroupByDimension | null;
  aggregate: "sum" | "count" | null;
  sumField: SumField;
  needsSemanticRanking: boolean;
  semanticTopic: string | null;
  offTopic: boolean;
  language: AnswerLanguage;
}

export interface InvoiceMatch {
  id: string;
  invoiceNumber: string | null;
  issuer: string | null;
  documentDate: string | null;
  amountGross: number | null;
  companyCode: string | null;
  propertyCode: string | null;
  costCategory: string | null;
  serviceDescription: string | null;
  isPaid: boolean;
  similarity: number | null;
}

export interface InvoiceSearchRow {
  id: string;
  invoice_number: string | null;
  issuer: string | null;
  document_date: string | null;
  amount_gross: number | null;
  company_code: string | null;
  property_code: string | null;
  cost_category: string | null;
  service_description: string | null;
  paid_at: string | null;
  similarity: number | null;
}

export interface GroupedTotalRow {
  group_key: string;
  invoice_count: number;
  total_gross: number;
  total_net: number;
  total_vat: number;
  paid_gross: number;
  open_gross: number;
}

export interface AggregateTotalsRow {
  total_count: number;
  total_gross: number;
  total_net: number;
  total_vat: number;
  all_paid_count: number;
  all_paid_gross: number;
  all_paid_net: number;
  all_paid_vat: number;
  all_open_count: number;
  all_open_gross: number;
  all_open_net: number;
  all_open_vat: number;
}

export interface AggregateResult {
  totalCount: number;
  totalGross: number;
  totalNet: number;
  totalVat: number;
  allPaidCount: number;
  allPaidGross: number;
  allPaidNet: number;
  allPaidVat: number;
  allOpenCount: number;
  allOpenGross: number;
  allOpenNet: number;
  allOpenVat: number;
  sumField: SumField;
}

export interface FilteredTotals {
  count: number;
  gross: number;
  net: number;
  vat: number;
  allPaidCount: number;
  allPaidGross: number;
  allOpenCount: number;
  allOpenGross: number;
}

export interface PaymentContext {
  paidCount: number;
  paidGross: number;
  openCount: number;
  openGross: number;
}

export interface RetrievalResult {
  matches: InvoiceMatch[];
  unresolvedCompanyName: string | null;
  unresolvedPropertyName: string | null;
  unsupportedAspects: string[];
  groupedTotals?: { groupBy: GroupByDimension; rows: GroupedTotalRow[] } | null;
  sql: string;
  aggregate: AggregateResult | null;
  resolvedFilters: InvoiceFilters;
  language: AnswerLanguage;
  totalMatches: number | null;
  semantic: boolean;
  paymentContext: PaymentContext | null;
  filteredTotals: FilteredTotals | null;
  offTopic: boolean;
  broad: boolean;
}

export interface AiSearchResult extends RetrievalResult {
  answer: string;
}

export interface ModelJsonRequest {
  instructions: string;
  input: string;
  schemaName: string;
  schema: object;
  temperature?: number;
}

export interface ModelJsonClient {
  completeJson(request: ModelJsonRequest): Promise<unknown>;
}

export interface EmbeddingClient {
  embed(text: string): Promise<number[]>;
}

export interface AiSearchExecutor {
  searchRows(
    filters: InvoiceFilters,
    embedding: number[] | null,
    limit: number,
  ): Promise<InvoiceSearchRow[]>;
  aggregate(filters: InvoiceFilters): Promise<AggregateTotalsRow | null>;
  groupedTotals?(
    filters: InvoiceFilters,
    groupBy: GroupByDimension,
    limit: number,
  ): Promise<GroupedTotalRow[]>;
}

export interface AiSearchPromptExamples {
  companyCode: string;
  supplierName: string;
}

export interface AiSearchConfig {
  vocabulary(): Promise<AiSearchVocabulary>;
  executor: AiSearchExecutor;
  intentModel: ModelJsonClient;
  classifierModel?: ModelJsonClient;
  synthesisModel: ModelJsonClient;
  embeddings: EmbeddingClient;
  statusValues: string[];
  conditionFields?: ConditionFieldSpec[];
  promptExamples: AiSearchPromptExamples;
  unassignedCompanyCode?: string | null;
  sqlPreviewTable?: string;
  unassignedCompanyMode?: "collapse" | "parameter";
  includeSupplierListInPrompt?: boolean;
  fillAggregateMatches?: boolean;
  searchLimit?: number;
  minSemanticSimilarity?: number;
  now?: () => Date;
}
