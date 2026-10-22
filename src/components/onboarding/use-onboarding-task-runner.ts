import { useCallback, useMemo, useState } from "react";

import type { OnboardingStep, OnboardingStepStatus, OnboardingTask } from "../../lib/onboarding";
import { useOnboardingCompletion } from "./use-onboarding-completion";

export interface OnboardingTaskRunner {
  task: OnboardingTask;
  currentStepIndex: number;
  currentStep: OnboardingStep;
  stepStatuses: OnboardingStepStatus[];
  isFinished: boolean;
  completeInfoStep: () => void;
  restart: () => void;
}

export interface OnboardingTaskRunnerOptions {
  initialStepIndex?: number;
}

export function useOnboardingTaskRunner(
  task: OnboardingTask,
  options?: OnboardingTaskRunnerOptions,
): OnboardingTaskRunner {
  const [currentStepIndex, setCurrentStepIndex] = useState(options?.initialStepIndex ?? 0);
  const isFinished = currentStepIndex >= task.steps.length;
  const currentStep = task.steps[currentStepIndex] ?? task.steps[task.steps.length - 1];

  const advance = useCallback(() => {
    setCurrentStepIndex((index) => Math.min(index + 1, task.steps.length));
  }, [task.steps.length]);

  useOnboardingCompletion(
    !isFinished && currentStep.type !== "info" ? currentStep.completionCondition : null,
    advance,
  );

  const completeInfoStep = useCallback(() => {
    if (!isFinished && currentStep.type === "info") {
      advance();
    }
  }, [isFinished, currentStep, advance]);

  const restart = useCallback(() => {
    setCurrentStepIndex(0);
  }, []);

  const stepStatuses = useMemo<OnboardingStepStatus[]>(
    () =>
      task.steps.map((_, index) =>
        index < currentStepIndex ? "done" : index === currentStepIndex ? "active" : "pending",
      ),
    [task.steps, currentStepIndex],
  );

  return {
    task,
    currentStepIndex,
    currentStep,
    stepStatuses,
    isFinished,
    completeInfoStep,
    restart,
  };
}
