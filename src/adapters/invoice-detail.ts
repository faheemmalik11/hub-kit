import type { HistoryConfig } from "../pages/invoice-detail/history";
import type { LadderColors } from "../pages/invoice-detail/WorkflowLadder";

export interface InvoiceDetailConfig extends HistoryConfig {
  chainActionIds: string[];
  autoSteps: string[];
  correctableStatuses: string[];
  ladderColors: LadderColors;
  fieldJumpTargets: Record<string, { tab: string; anchor: string }>;
}
