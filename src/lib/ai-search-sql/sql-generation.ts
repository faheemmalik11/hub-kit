import type { ModelJsonClient } from "./types";
import type {
  IntentClassification,
  IntentClassifierConfig,
  IntentEntities,
  QueryColumnSpec,
} from "./types";
import { validateWhereClause, WhereClauseError } from "./where-parser";

export interface SqlGenerationConfig extends IntentClassifierConfig {
  columns: QueryColumnSpec[];
  sqlModel?: ModelJsonClient;
  sqlTable?: string;
  maxConditions?: number;
}

export interface SqlPreview {
  classification: IntentClassification;
  whereClause: string | null;
  rejectedWhereClause: string | null;
  unsupportedAspects: string[];
  sql: string | null;
}

const WHERE_SCHEMA = {
  type: "object",
  properties: {
    whereClause: { type: ["string", "null"] },
    unsupportedAspects: { type: "array", items: { type: "string" } },
  },
  required: ["whereClause", "unsupportedAspects"],
  additionalProperties: false,
} as const;

function columnCatalog(columns: QueryColumnSpec[]): string {
  return columns
    .map((column) => {
      const values = column.values?.length ? ` Known values: ${column.values.join(", ")}.` : "";
      return `- ${column.name} (${column.type}): ${column.description}${values}`;
    })
    .join("\n");
}

export function buildWhereGenerationInstructions(
  config: SqlGenerationConfig,
  retryError?: string,
): string {
  const retryNote = retryError
    ? `\n\nYOUR PREVIOUS ATTEMPT WAS REJECTED by the safety validator with this error: "${retryError}". Produce a corrected clause that satisfies every rule below.`
    : "";
  const now = config.now ? config.now() : new Date();
  const today = now.toISOString().slice(0, 10);
  return `Today is ${today}. You translate a classified invoice-search request into ONE PostgreSQL boolean expression (the content of a WHERE clause). You never write a full statement — no SELECT, no FROM, no ORDER BY, no semicolon. The expression is validated by a strict parser and rejected on any violation.${retryNote}

Allowed columns (the ONLY identifiers you may use — never invent one):
${columnCatalog(config.columns)}

Allowed syntax, nothing else:
- comparisons: = <> > >= < <= on number and date columns; = <> on text and boolean columns
- text matching: column ILIKE '%fragment%' (escape a literal % or _ in the fragment with a backslash)
- lists: column IN ('a', 'b'); negation: NOT, <>
- ranges: column BETWEEN x AND y (number or date columns)
- null checks: column IS NULL, column IS NOT NULL
- combining: AND, OR, parentheses
- literals: numbers plain (1500.5), dates as 'YYYY-MM-DD' strings, text in single quotes ('' for a quote), booleans true/false

You receive the user's question plus its classified intent and entities. The entities are ALREADY validated — company codes are real, dates are resolved. Build the expression from them:
- entities.companies: an entry that equals a known company code → company_code = 'CODE' (several → IN list). An entry that is NOT a known code is an unresolved name typed by the user: match it as text with company_code ILIKE '%name%'.
- entities.suppliers: each entry → issuer ILIKE '%entry%'. When company codes in entities.companies were resolved from the SAME ambiguous name as a supplier fragment (one bare name in the question, not two separately named entities), produce a single OR group: (issuer ILIKE '%name%' OR company_code IN ('CODE1', ...)), never two AND-ed conditions. Distinct named entities stay AND-ed.
- Different entities are AND-ed; several suppliers are OR-ed with each other.
- entities.paymentState: 'paid' → paid_at IS NOT NULL; 'open' → paid_at IS NULL; 'overdue' → paid_at IS NULL AND due_date < 'today (the date above)'.
- entities.reviewState: 'needed' → (review_problem_count > 0 OR (review_unchecked = true AND status = 'zu_pruefen')); 'clear' → review_problem_count = 0 AND NOT (review_unchecked = true AND status = 'zu_pruefen'). Never use review_score for this.
- entities.bankMatch: 'matched' → has_confirmed_bank_match = true; 'suggested' → has_suggested_bank_match = true AND has_confirmed_bank_match = false; 'unmatched' → has_confirmed_bank_match = false AND has_suggested_bank_match = false; 'any' → (has_confirmed_bank_match = true OR has_suggested_bank_match = true).
- entities.unassignedCompany true → company_code IS NULL.
- entities.datevHandover: 'done' → datev_handed_over_at IS NOT NULL; 'pending' → datev_handed_over_at IS NULL.
- entities.trafficLight: a color → traffic_light = 'gruen'/'gelb'/'rot'; 'flagged' → traffic_light IN ('gelb', 'rot').
- entities.documentType: use the document_type column with its known values.
- entities.workflowStep: match the wording against workflow_status known values. Vague wording that plausibly covers several steps uses an IN list over ALL of them — never pick one reading.
- entities.dateFrom/dateTo → document_date >= / <=; entities.dueDateFrom/dueDateTo → due_date >= / <=.
- entities.amountMin/amountMax → amount_gross >= / <=.
- entities.category → cost_category = 'the exact category name'.
- entities.property → property_code = 'CODE' when it is a known code, else property_code ILIKE '%name%'.
- entities.topic: express it ONLY when a listed column clearly states it (e.g. "VAT rate 19%" → vat_rate = 19). When no column expresses it, put the phrase into unsupportedAspects instead — NEVER approximate and NEVER drop it silently.
- entities.directDebit: true → (payment_method ILIKE '%lastschrift%' OR payment_method ILIKE '%einzug%' OR payment_method ILIKE '%abbuch%'); false → payment_method IS NOT NULL AND NOT (payment_method ILIKE '%lastschrift%' OR payment_method ILIKE '%einzug%' OR payment_method ILIKE '%abbuch%'); null → nothing.
- entities.archived is handled outside your clause: never mention archived_at.
- Do not restate scope the system adds itself: no archived_at, no not_relevant_at.

whereClause is null when there is nothing to filter (no entities and no expressible topic). unsupportedAspects lists ONLY the stated constraints that are NOT in your whereClause — a constraint you expressed must NEVER also appear there, and one you could not express must ALWAYS appear there. Losing a constraint silently is the worst possible outcome.

Return only JSON in the shape { "whereClause": string | null, "unsupportedAspects": string[] }.`;
}

export async function generateWhereClause(
  config: SqlGenerationConfig,
  classification: IntentClassification,
  query: string,
): Promise<{ whereClause: string | null; rejectedWhereClause: string | null; unsupportedAspects: string[] }> {
  const model = config.sqlModel ?? config.intentModel;
  let lastError: string | undefined;
  let rejected: string | null = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const raw = (await model.completeJson({
      instructions: buildWhereGenerationInstructions(config, lastError),
      input: JSON.stringify({ question: query, classification }, null, 2),
      schemaName: "invoice_where_clause",
      schema: WHERE_SCHEMA,
      temperature: 0,
    })) as { whereClause?: unknown; unsupportedAspects?: unknown };
    const unsupportedAspects = Array.isArray(raw.unsupportedAspects)
      ? raw.unsupportedAspects.filter(
          (aspect): aspect is string => typeof aspect === "string" && aspect.trim() !== "",
        )
      : [];
    const candidate = typeof raw.whereClause === "string" ? raw.whereClause.trim() : null;
    if (!candidate) {
      return { whereClause: null, rejectedWhereClause: null, unsupportedAspects };
    }
    try {
      const normalized = validateWhereClause(candidate, config.columns, config.maxConditions);
      return { whereClause: normalized, rejectedWhereClause: null, unsupportedAspects };
    } catch (error) {
      if (!(error instanceof WhereClauseError)) throw error;
      lastError = error.message;
      rejected = candidate;
    }
  }
  return {
    whereClause: null,
    rejectedWhereClause: rejected,
    unsupportedAspects: ["the filter condition could not be safely validated"],
  };
}

const LIST_COLUMNS =
  "id, invoice_number, issuer, document_date, due_date, amount_gross, company_code, property_code, cost_category, paid_at";

function groupExpression(entities: IntentEntities, unassignedCode: string | null): string {
  const dimension = entities.groupBy ?? "issuer";
  if (dimension === "company") {
    return unassignedCode ? `coalesce(company_code, '${unassignedCode}')` : "company_code";
  }
  if (dimension === "property") return "property_code";
  if (dimension === "category") return "cost_category";
  return "issuer";
}

export function composeQuery(
  classification: IntentClassification,
  whereClause: string | null,
  config: SqlGenerationConfig,
): string | null {
  if (classification.intent === "off_topic") return null;
  const table = config.sqlTable ?? "v_invoices_review";
  const scope = [
    classification.entities.archived ? "archived_at is not null" : "archived_at is null",
    "not_relevant_at is null",
  ];
  if (whereClause) scope.push(`(${whereClause})`);
  const where = scope.join("\n  and ");

  if (classification.intent === "count_invoices") {
    return `select count(*) as invoice_count\nfrom ${table}\nwhere ${where};`;
  }
  if (classification.intent === "total_amount") {
    return (
      `select\n  count(*) as invoice_count,\n  coalesce(sum(amount_gross), 0) as total_gross,\n` +
      `  coalesce(sum(amount_net), 0) as total_net,\n  coalesce(sum(vat_amount), 0) as total_vat,\n` +
      `  coalesce(sum(amount_gross) filter (where paid_at is not null), 0) as paid_gross,\n` +
      `  coalesce(sum(amount_gross) filter (where paid_at is null), 0) as open_gross\n` +
      `from ${table}\nwhere ${where};`
    );
  }
  if (classification.intent === "rank_breakdown") {
    const groupKey = groupExpression(classification.entities, config.unassignedCompanyCode ?? null);
    return (
      `select\n  ${groupKey} as group_key,\n  count(*) as invoice_count,\n` +
      `  coalesce(sum(amount_gross), 0) as total_gross,\n` +
      `  coalesce(sum(amount_gross) filter (where paid_at is not null), 0) as paid_gross,\n` +
      `  coalesce(sum(amount_gross) filter (where paid_at is null), 0) as open_gross\n` +
      `from ${table}\nwhere ${where}\ngroup by 1\nhaving ${groupKey} is not null\norder by total_gross desc\nlimit 5;`
    );
  }
  return `select ${LIST_COLUMNS}\nfrom ${table}\nwhere ${where}\norder by document_date desc nulls last;`;
}

export async function generateSqlPreview(
  config: SqlGenerationConfig,
  classification: IntentClassification,
  query: string,
): Promise<SqlPreview> {
  if (classification.intent === "off_topic") {
    return {
      classification,
      whereClause: null,
      rejectedWhereClause: null,
      unsupportedAspects: [],
      sql: null,
    };
  }
  const generated = await generateWhereClause(config, classification, query);
  return {
    classification,
    whereClause: generated.whereClause,
    rejectedWhereClause: generated.rejectedWhereClause,
    unsupportedAspects: generated.unsupportedAspects,
    sql: composeQuery(classification, generated.whereClause, config),
  };
}
