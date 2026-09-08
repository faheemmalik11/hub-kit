import { buildAnswerDataBlock, synthesizeAnswer } from "./answer";
import { runRetrieval } from "./retrieval";
import type { AiSearchConfig, AiSearchResult } from "./types";

export async function runAiSearch(config: AiSearchConfig, query: string): Promise<AiSearchResult> {
  const vocabulary = await config.vocabulary();
  const retrieval = await runRetrieval(config, vocabulary, query);
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
