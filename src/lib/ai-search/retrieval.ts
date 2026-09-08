import { buildWhereClause } from "./describe";
import { extractIntent } from "./intent";
import type {
  AggregateResult,
  AggregateTotalsRow,
  AiSearchConfig,
  AiSearchVocabulary,
  FilteredTotals,
  InvoiceFilters,
  InvoiceMatch,
  InvoiceSearchRow,
  PaymentContext,
  RetrievalResult,
} from "./types";

const DEFAULT_SEARCH_LIMIT = 15;
const DEFAULT_MIN_SEMANTIC_SIMILARITY = 0.3;

function toMatch(row: InvoiceSearchRow): InvoiceMatch {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    issuer: row.issuer,
    documentDate: row.document_date,
    amountGross: row.amount_gross,
    companyCode: row.company_code,
    propertyCode: row.property_code,
    costCategory: row.cost_category,
    serviceDescription: row.service_description,
    isPaid: row.paid_at !== null,
    similarity: row.similarity,
  };
}

function toAggregateResult(
  row: AggregateTotalsRow | null,
  sumField: AggregateResult["sumField"],
): AggregateResult {
  return {
    totalCount: Number(row?.total_count ?? 0),
    totalGross: Number(row?.total_gross ?? 0),
    totalNet: Number(row?.total_net ?? 0),
    totalVat: Number(row?.total_vat ?? 0),
    allPaidCount: Number(row?.all_paid_count ?? 0),
    allPaidGross: Number(row?.all_paid_gross ?? 0),
    allPaidNet: Number(row?.all_paid_net ?? 0),
    allPaidVat: Number(row?.all_paid_vat ?? 0),
    allOpenCount: Number(row?.all_open_count ?? 0),
    allOpenGross: Number(row?.all_open_gross ?? 0),
    allOpenNet: Number(row?.all_open_net ?? 0),
    allOpenVat: Number(row?.all_open_vat ?? 0),
    sumField,
  };
}

async function loadFilteredTotals(
  config: AiSearchConfig,
  filters: InvoiceFilters,
): Promise<FilteredTotals | null> {
  try {
    const row = await config.executor.aggregate(filters);
    if (!row) return null;
    return {
      count: Number(row.total_count ?? 0),
      gross: Number(row.total_gross ?? 0),
      net: Number(row.total_net ?? 0),
      vat: Number(row.total_vat ?? 0),
      allPaidCount: Number(row.all_paid_count ?? 0),
      allPaidGross: Number(row.all_paid_gross ?? 0),
      allOpenCount: Number(row.all_open_count ?? 0),
      allOpenGross: Number(row.all_open_gross ?? 0),
    };
  } catch {
    return null;
  }
}

async function loadPaymentContext(
  config: AiSearchConfig,
  filters: InvoiceFilters,
): Promise<PaymentContext | null> {
  try {
    const row = await config.executor.aggregate({ ...filters, paymentState: null });
    if (!row) return null;
    return {
      paidCount: Number(row.all_paid_count ?? 0),
      paidGross: Number(row.all_paid_gross ?? 0),
      openCount: Number(row.all_open_count ?? 0),
      openGross: Number(row.all_open_gross ?? 0),
    };
  } catch {
    return null;
  }
}

async function countMatchesIfCapped(
  config: AiSearchConfig,
  filters: InvoiceFilters,
  rowCount: number,
  limit: number,
): Promise<number | null> {
  if (rowCount < limit) return null;
  try {
    const row = await config.executor.aggregate(filters);
    const count = Number(row?.total_count);
    return Number.isFinite(count) ? count : null;
  } catch {
    return null;
  }
}

export async function runRetrieval(
  config: AiSearchConfig,
  vocabulary: AiSearchVocabulary,
  query: string,
): Promise<RetrievalResult> {
  const limit = config.searchLimit ?? DEFAULT_SEARCH_LIMIT;
  const table = config.sqlPreviewTable;
  const similarityFloor = config.minSemanticSimilarity ?? DEFAULT_MIN_SEMANTIC_SIMILARITY;

  const intent = await extractIntent(config, vocabulary, query);
  const unresolvedCompanyName = intent.unresolvedCompanyName;
  const unresolvedPropertyName = intent.unresolvedPropertyName;
  const unsupportedAspects = intent.unsupportedAspects;
  const { filters, aggregate, sumField, needsSemanticRanking, semanticTopic, offTopic, language } =
    intent;

  if (!offTopic && (unresolvedCompanyName || unresolvedPropertyName)) {
    return {
      unresolvedCompanyName,
      unresolvedPropertyName,
      unsupportedAspects,
      matches: [],
      sql: "-- unknown company/property in the question: no query was run",
      aggregate: null,
      resolvedFilters: filters,
      language,
      totalMatches: 0,
      semantic: false,
      paymentContext: null,
      filteredTotals: null,
      offTopic: false,
      broad: false,
    };
  }

  if (offTopic) {
    return {
      unresolvedCompanyName,
      unresolvedPropertyName,
      unsupportedAspects,
      matches: [],
      sql: "-- off-topic question: no query was run",
      aggregate: null,
      resolvedFilters: filters,
      language,
      totalMatches: 0,
      semantic: false,
      paymentContext: null,
      filteredTotals: null,
      offTopic: true,
      broad: false,
    };
  }

  const embedText = semanticTopic || query;

  if (intent.groupBy && config.executor.groupedTotals) {
    const groupedTotals = config.executor.groupedTotals.bind(config.executor);
    const [groups, aggregateRow, fillRows] = await Promise.all([
      groupedTotals(filters, intent.groupBy, 5),
      config.executor.aggregate(filters),
      config.fillAggregateMatches
        ? config.executor.searchRows(filters, null, limit)
        : Promise.resolve([]),
    ]);
    const aggregateResult = toAggregateResult(aggregateRow, sumField);
    return {
      unresolvedCompanyName,
      unresolvedPropertyName,
      unsupportedAspects,
      groupedTotals: { groupBy: intent.groupBy, rows: groups },
      matches: fillRows.map(toMatch),
      sql: buildWhereClause(
        filters,
        false,
        `grouped by ${intent.groupBy}, ordered by total_gross desc, top ${groups.length}`,
        table,
      ),
      aggregate: aggregateResult,
      resolvedFilters: filters,
      language,
      totalMatches: fillRows.length > 0 ? aggregateResult.totalCount : null,
      semantic: false,
      paymentContext: null,
      filteredTotals: null,
      offTopic: false,
      broad: false,
    };
  }

  if (aggregate) {
    const [aggregateRow, fillRows] = await Promise.all([
      config.executor.aggregate(filters),
      config.fillAggregateMatches
        ? config.executor.searchRows(filters, null, limit)
        : Promise.resolve([]),
    ]);
    const aggregateResult = toAggregateResult(aggregateRow, sumField);

    if (aggregateResult.totalCount === 0 && filters.costCategory) {
      const embedding = await config.embeddings.embed(embedText);
      const retryFilters: InvoiceFilters = { ...filters, costCategory: null };
      const candidates = await config.executor.searchRows(retryFilters, embedding, limit);
      return {
        unresolvedCompanyName,
        unresolvedPropertyName,
        unsupportedAspects,
        matches: candidates.map(toMatch),
        sql: buildWhereClause(
          filters,
          false,
          `no exact match for cost_category = '${filters.costCategory}' — candidates below are unverified semantic matches, NOT part of the total\n-- question asked for sumField: ${sumField}`,
          table,
        ),
        aggregate: aggregateResult,
        resolvedFilters: filters,
        language,
        totalMatches: null,
        semantic: true,
        paymentContext: null,
        filteredTotals: null,
        offTopic: false,
        broad: false,
      };
    }

    return {
      unresolvedCompanyName,
      unresolvedPropertyName,
      unsupportedAspects,
      matches: fillRows.map(toMatch),
      sql: buildWhereClause(filters, false, `question asked for sumField: ${sumField}`, table),
      aggregate: aggregateResult,
      resolvedFilters: filters,
      language,
      totalMatches: fillRows.length > 0 ? aggregateResult.totalCount : null,
      semantic: false,
      paymentContext: null,
      filteredTotals: null,
      offTopic: false,
      broad: false,
    };
  }

  let embedding = needsSemanticRanking ? await config.embeddings.embed(embedText) : null;
  let rows = await config.executor.searchRows(filters, embedding, limit);
  if (embedding) {
    rows = rows.filter((row) => (row.similarity ?? 0) >= similarityFloor);
  }

  if (rows.length === 0 && filters.costCategory) {
    if (!embedding) embedding = await config.embeddings.embed(embedText);
    const retryFilters: InvoiceFilters = { ...filters, costCategory: null };
    rows = await config.executor.searchRows(retryFilters, embedding, limit);
    rows = rows.filter((row) => (row.similarity ?? 0) >= similarityFloor);
    return {
      unresolvedCompanyName,
      unresolvedPropertyName,
      unsupportedAspects,
      matches: rows.map(toMatch),
      sql: buildWhereClause(
        retryFilters,
        true,
        `retried without cost_category = '${filters.costCategory}': that exact filter matched nothing`,
        table,
      ),
      aggregate: null,
      resolvedFilters: retryFilters,
      language,
      totalMatches: await countMatchesIfCapped(config, retryFilters, rows.length, limit),
      semantic: true,
      paymentContext:
        rows.length === 0 && retryFilters.paymentState
          ? await loadPaymentContext(config, retryFilters)
          : null,
      filteredTotals: null,
      offTopic: false,
      broad: false,
    };
  }

  const broad =
    !embedding &&
    !filters.companyCode &&
    !filters.unassignedCompany &&
    !filters.assignedCompany &&
    !filters.propertyCode &&
    !filters.costCategory &&
    !filters.issuerLike &&
    !filters.nameLike &&
    !filters.dateFrom &&
    !filters.dateTo &&
    !filters.status &&
    !filters.reviewState &&
    !filters.paymentState &&
    filters.amountMin === null &&
    filters.amountMax === null &&
    filters.conditions.length === 0;

  const filteredTotals = embedding ? null : await loadFilteredTotals(config, filters);
  const totalMatches =
    filteredTotals && rows.length >= limit
      ? filteredTotals.count
      : filteredTotals
        ? null
        : await countMatchesIfCapped(config, filters, rows.length, limit);

  return {
    unresolvedCompanyName,
    unresolvedPropertyName,
    unsupportedAspects,
    matches: rows.map(toMatch),
    sql: buildWhereClause(filters, !!embedding, undefined, table),
    aggregate: null,
    resolvedFilters: filters,
    language,
    totalMatches,
    semantic: !!embedding,
    paymentContext:
      rows.length === 0 && filters.paymentState ? await loadPaymentContext(config, filters) : null,
    filteredTotals,
    offTopic: false,
    broad,
  };
}
