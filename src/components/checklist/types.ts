export type ChecklistStepState = "done" | "open" | "problem";

export interface ChecklistStepItem {
  key: string;
  state: ChecklistStepState;
  title: string;
  description: string;
  problems?: {
    text: string;
    link?: { to: string; search?: Record<string, unknown>; hash?: string };
  }[];
  actionLabel?: string;
  link?: { to: string; search?: Record<string, unknown>; hash?: string };
}
