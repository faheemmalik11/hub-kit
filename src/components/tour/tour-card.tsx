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
  onSkip: () => void;
}

export function TourCard({ step, stepIndex, stepCount, labels, onNext, onSkip }: TourCardProps) {
  const isLastStep = stepIndex + 1 >= stepCount;

  return (
    <div>
      <span className="inline-flex rounded-full bg-[var(--tour-accent,var(--primary))] px-2 py-0.5 text-[11px] font-semibold text-primary-foreground sm:text-xs">
        {labels.stepCounter(stepIndex + 1, stepCount)}
      </span>
      <h2 className="mt-2 text-[15px] font-semibold leading-snug text-popover-foreground sm:text-[17px]">
        {step.title}
      </h2>
      <div className="mt-2 max-h-[min(70vh,calc(var(--radix-popover-content-available-height,70vh)-6rem))] space-y-2 overflow-y-auto pr-3 pb-1">
        {step.content.map((block, index) => (
          <TourBlock key={index} block={block} />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onSkip}
          className="cursor-pointer text-[12px] text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
        >
          {labels.skip}
        </button>
        <Button
          type="button"
          onClick={onNext}
          className="h-7 rounded-lg bg-[var(--tour-accent,var(--primary))] px-3.5 text-[12px] sm:h-8 sm:px-5 sm:text-sm"
        >
          {isLastStep ? labels.finish : labels.next}
        </Button>
      </div>
    </div>
  );
}
