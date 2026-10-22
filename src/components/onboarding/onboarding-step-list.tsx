import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../../lib/class-names";
import type { OnboardingStep, OnboardingStepStatus } from "../../lib/onboarding";

const NUMBER_CIRCLE_CLASS: Record<OnboardingStepStatus, string> = {
  done: "bg-emerald-100 text-emerald-700",
  active: "bg-[var(--tour-accent,var(--primary))] text-primary-foreground",
  pending: "bg-muted text-muted-foreground",
};

export interface OnboardingStepListProps {
  steps: OnboardingStep[];
  statuses: OnboardingStepStatus[];
  renderStepExtra?: (step: OnboardingStep, index: number, status: OnboardingStepStatus) => ReactNode;
  className?: string;
}

export function OnboardingStepList({
  steps,
  statuses,
  renderStepExtra,
  className,
}: OnboardingStepListProps) {
  return (
    <ol className={cn("space-y-3", className)}>
      {steps.map((step, index) => {
        const status = statuses[index];
        const extra = renderStepExtra?.(step, index, status);
        return (
          <li key={step.id} className="flex flex-col gap-2">
            <div className="flex items-start gap-2.5">
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums",
                  NUMBER_CIRCLE_CLASS[status],
                )}
                aria-hidden
              >
                {status === "done" ? <Check className="size-3" /> : index + 1}
              </span>
              <p
                className={cn(
                  "text-sm leading-snug",
                  status === "active" ? "font-semibold text-foreground" : "text-foreground",
                  status === "done" && "text-muted-foreground",
                )}
              >
                {step.instruction}
              </p>
            </div>
            {extra && <div className="pl-[30px]">{extra}</div>}
          </li>
        );
      })}
    </ol>
  );
}
