export interface OnboardingEvent {
  type: string;
  recordId: string;
  data?: Record<string, unknown>;
  at: number;
}

export type OnboardingEventInput = Omit<OnboardingEvent, "at">;

export type OnboardingEventHandler = (event: OnboardingEvent) => void;

export interface OnboardingCompletionCondition {
  eventType: string;
  recordId?: string;
  data?: Record<string, unknown>;
}
