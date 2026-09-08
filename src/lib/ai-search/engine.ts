import { buildAnswerDataBlock, synthesizeAnswer } from "./answer";
import { classifyQueryAspects } from "./classify";
import { runRetrieval } from "./retrieval";
import type { AiSearchConfig, AiSearchResult } from "./types";

export async function runAiSearch(config: AiSearchConfig, query: string): Promise<AiSearchResult> {
  const [vocabulary, aspects] = await Promise.all([
    config.vocabulary(),
    classifyQueryAspects(config, query),
  ]);
  const retrieval = await runRetrieval(config, vocabulary, query, aspects);
  const answer = retrieval.offTopic
    ? ""
    : await synthesizeAnswer(
        config.synthesisModel,
        query,
        retrieval.resolvedFilters,
        buildAnswerDataBlock(retrieval, vocabulary, config.unassignedCompanyCode),
        retrieval.language,
      );
  return { ...retrieval, answer };
}
