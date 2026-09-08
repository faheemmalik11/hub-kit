import type { InvoiceFilters } from "./types";

export function buildWhereClause(
  filters: InvoiceFilters,
  hasEmbedding: boolean,
  fallbackNote?: string,
  tableName = "v_invoices_review",
): string {
  const clauses: string[] = ["archived_at is null", "not_relevant_at is null"];
  if (filters.companyCode) clauses.push(`company_code = '${filters.companyCode}'`);
  if (filters.unassignedCompany) clauses.push("company_code is null");
  if (filters.assignedCompany) clauses.push("company_code is not null");
  if (filters.propertyCode) clauses.push(`property_code = '${filters.propertyCode}'`);
  if (filters.costCategory) clauses.push(`cost_category = '${filters.costCategory}'`);
  if (filters.issuerLike) clauses.push(`issuer ilike '%${filters.issuerLike}%'`);
  if (filters.nameLike) {
    clauses.push(
      `(issuer ilike '%${filters.nameLike}%' or company_code ilike '%${filters.nameLike}%' or company_name ilike '%${filters.nameLike}%')`,
    );
  }
  if (filters.dateFrom) clauses.push(`document_date >= '${filters.dateFrom}'`);
  if (filters.dateTo) clauses.push(`document_date <= '${filters.dateTo}'`);
  if (filters.status) clauses.push(`status = '${filters.status}'`);
  if (filters.reviewState === "needed") {
    clauses.push("(review_problem_count > 0 or (review_unchecked and status = 'zu_pruefen'))");
  }
  if (filters.reviewState === "clear") {
    clauses.push("(review_problem_count = 0 and not (review_unchecked and status = 'zu_pruefen'))");
  }
  if (filters.amountMin !== null) clauses.push(`amount_gross >= ${filters.amountMin}`);
  if (filters.amountMax !== null) clauses.push(`amount_gross <= ${filters.amountMax}`);
  if (filters.paymentState === "paid") clauses.push("paid_at is not null");
  if (filters.paymentState === "open") clauses.push("paid_at is null");
  if (filters.paymentState === "overdue") {
    clauses.push("paid_at is null and due_date < current_date");
  }
  for (const condition of filters.conditions) {
    const operator = { eq: "=", neq: "<>", gte: ">=", lte: "<=", contains: "ilike" }[condition.op];
    const value =
      condition.op === "contains" ? `'%${condition.value}%'` : `'${condition.value}'`;
    clauses.push(`${condition.field} ${operator} ${value}`);
  }
  const where = clauses.join("\n  and ");
  const orderBy = hasEmbedding
    ? "order by embedding <=> '[query embedding]'::vector asc"
    : "order by document_date desc";
  let sql = `select * from ${tableName}\nwhere ${where}\n${orderBy}`;
  if (fallbackNote) sql += `\n-- ${fallbackNote}`;
  return sql;
}

export function describeResolvedFilters(filters: InvoiceFilters): string {
  const parts = [
    filters.companyCode && `companyCode=${filters.companyCode}`,
    filters.unassignedCompany && "unassignedCompany=true",
    filters.assignedCompany && "assignedCompany=true",
    filters.propertyCode && `propertyCode=${filters.propertyCode}`,
    filters.costCategory && `costCategory=${filters.costCategory}`,
    filters.issuerLike && `issuerLike=${filters.issuerLike}`,
    filters.nameLike && `nameLike=${filters.nameLike}`,
    filters.dateFrom && `dateFrom=${filters.dateFrom}`,
    filters.dateTo && `dateTo=${filters.dateTo}`,
    filters.status && `status=${filters.status}`,
    filters.reviewState && `reviewState=${filters.reviewState}`,
    filters.paymentState && `paymentState=${filters.paymentState}`,
    filters.amountMin !== null && `amountMin=${filters.amountMin}`,
    filters.amountMax !== null && `amountMax=${filters.amountMax}`,
    filters.conditions.length > 0 &&
      `conditions=[${filters.conditions
        .map((condition) => `${condition.field} ${condition.op} ${condition.value}`)
        .join(", ")}]`,
  ].filter((part): part is string => Boolean(part));
  return parts.join(", ");
}
