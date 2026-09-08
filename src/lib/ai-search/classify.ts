import type { AiSearchConfig, AnswerLanguage, QueryAspects } from "./types";

const ASPECT_SCHEMA = {
  type: "object",
  properties: {
    needsCompanies: { type: "boolean" },
    needsProperties: { type: "boolean" },
    needsCategories: { type: "boolean" },
    needsSuppliers: { type: "boolean" },
    offTopic: { type: "boolean" },
    language: { type: "string", enum: ["de", "en"] },
  },
  required: [
    "needsCompanies",
    "needsProperties",
    "needsCategories",
    "needsSuppliers",
    "offTopic",
    "language",
  ],
  additionalProperties: false,
} as const;

const ASPECT_INSTRUCTIONS = `You route a question asked inside a property-management accounting app. The question is about invoices. Your ONLY job is to decide which reference lists the extraction step after you will need, so it can be given exactly the master data it requires. You do not answer the question and you do not extract filters.

Set each flag as follows. The flags are independent; several can be true at once. When you are unsure about a flag, set it to TRUE — including an unused list costs a little, but a missing list loses information and gives the user a wrong answer.

- needsCompanies: the question refers to one of OUR OWN companies/legal entities — by name or code, by ownership wording ("belonging to X", "der Gesellschaft X", "of the X company"), by asking about invoices WITH or WITHOUT an assigned company, by asking for a per-company breakdown — OR it contains any bare name that could plausibly be one of our companies.
- needsProperties: the question refers to a property/building ("Objekt X", "for the X property", per-property breakdown), or contains a bare name that could plausibly be a property.
- needsCategories: the question names a kind of expense or topic (cleaning, energy, insurance, repairs, "Reinigung", …) or asks for a per-category breakdown.
- needsSuppliers: the question refers to a vendor/supplier/issuer — by name, by wording like "from X", "Lieferant X", "X supplier", per-supplier breakdown — or contains any bare name that could plausibly be a supplier.
- offTopic: true ONLY when the question cannot be answered from invoice data AT ALL: greetings, small talk, random characters or test strings, general knowledge, a completely different domain. false for ANYTHING that plausibly asks about invoices, suppliers, amounts, payments, companies, properties, categories or documents, however vaguely worded — when in doubt, false. A vague invoice question ("show me invoices") is NOT off-topic.
- language: 'de' if the question is German, 'en' if English; 'de' for text that is no language at all.

A bare name with no signal either way ("invoices of nord") sets BOTH needsCompanies and needsSuppliers to true.`;

export async function classifyQueryAspects(
  config: AiSearchConfig,
  query: string,
): Promise<QueryAspects> {
  const model = config.classifierModel ?? config.intentModel;
  const raw = (await model.completeJson({
    instructions: ASPECT_INSTRUCTIONS,
    input: query,
    schemaName: "invoice_search_aspects",
    schema: ASPECT_SCHEMA,
    temperature: 0,
  })) as Partial<Record<keyof QueryAspects, unknown>>;
  const flag = (value: unknown) => value !== false;
  return {
    needsCompanies: flag(raw.needsCompanies),
    needsProperties: flag(raw.needsProperties),
    needsCategories: flag(raw.needsCategories),
    needsSuppliers: flag(raw.needsSuppliers),
    offTopic: raw.offTopic === true,
    language: (raw.language === "en" ? "en" : "de") as AnswerLanguage,
  };
}
