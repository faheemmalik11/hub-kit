import { Button } from "../../ui/button";
import type { TourLabels } from "./labels";
import { TourBlock } from "./tour-blocks";
import type { TourStep } from "./types";

export interface TourCardProps {
  step: TourStep;
  stepIndex: number;
  stepCount: number;
  labels: TourLabels;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function TourCard({
  step,
  stepIndex,
  stepCount,
  labels,
  onNext,
  onBack,
  onSkip,
}: TourCardProps) {
  const isLastStep = stepIndex + 1 >= stepCount;

  return (
    <div className="space-y-3">
      <span className="inline-flex rounded-full bg-[var(--tour-accent,var(--primary))] px-2 py-0.5 text-xs font-medium text-primary-foreground">
        {labels.stepCounter(stepIndex + 1, stepCount)}
      </span>
      <h2 className="text-base font-semibold text-popover-foreground">{step.title}</h2>
      <div className="max-h-[50vh] space-y-2 overflow-y-auto">
        {step.content.map((block, index) => (
          <TourBlock key={index} block={block} />
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onSkip}>
          {labels.skip}
        </Button>
        <div className="flex items-center gap-2">
          {stepIndex > 0 && (
            <Button type="button" variant="outline" size="sm" onClick={onBack}>
              {labels.back}
            </Button>
          )}
          <Button type="button" size="sm" onClick={onNext}>
            {isLastStep ? labels.finish : labels.next}
          </Button>
        </div>
      </div>
    </div>
  );
}
