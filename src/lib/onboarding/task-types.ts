import type { SpotlightSide } from "../spotlight-placement";
import type { OnboardingCompletionCondition } from "./types";

export type OnboardingStepType =
  | "upload"
  | "check"
  | "match"
  | "confirm"
  | "approve"
  | "handover"
  | "info";

export interface OnboardingDeviationQuestion {
  prompt: string;
  allowFreeText: boolean;
}

export interface OnboardingStep {
  id: string;
  type: OnboardingStepType;
  instruction: string;
  target: string;
  completionCondition: OnboardingCompletionCondition | null;
  helpText?: string;
  expectedOutcome?: string;
  deviationQuestion?: OnboardingDeviationQuestion;
  path?: string;
  pageLabel?: string;
  placement?: SpotlightSide;
  sampleFileUrl?: string;
  sampleFileName?: string;
  sampleFileDropPath?: string;
}

export interface OnboardingTask {
  id: string;
  title: string;
  goal: string;
  roles: string[];
  steps: OnboardingStep[];
}

export type OnboardingStepStatus = "pending" | "active" | "done";
