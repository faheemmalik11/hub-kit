import { Download, FileText } from "lucide-react";
import { useEffect, useState } from "react";

import { ProgressRing } from "../checklist/progress-ring";
import { Button } from "../../ui/button";
import { cn } from "../../lib/class-names";
import { findTourTarget } from "../tour/find-target";
import { OnboardingStepList } from "./onboarding-step-list";
import {
  englishOnboardingHighlightLabels,
  type OnboardingHighlightLabels,
} from "./onboarding-highlight-labels";
import { useOnboardingTargetTracking } from "./use-onboarding-target-tracking";
import type { OnboardingTaskRunner } from "./use-onboarding-task-runner";
import type { OnboardingStep, OnboardingStepStatus } from "../../lib/onboarding";

export interface OnboardingTaskPanelLabels {
  nextButton: string;
  resetButton: string;
  finishedTitle: string;
  closeButton?: string;
  sampleFileButton?: string;
}

export interface OnboardingTaskPanelProps {
  runner: OnboardingTaskRunner;
  labels: OnboardingTaskPanelLabels;
  pathname: string;
  highlightLabels?: OnboardingHighlightLabels;
  onNavigate?: (path: string) => void;
  className?: string;
  onClose?: () => void;
  onRestart?: () => void;
}

export function OnboardingTaskPanel({
  runner,
  labels,
  pathname,
  highlightLabels = englishOnboardingHighlightLabels,
  onNavigate,
  className,
  onClose,
  onRestart,
}: OnboardingTaskPanelProps) {
  const { task, currentStep, stepStatuses, isFinished, completeInfoStep, restart } = runner;
  const completedCount = stepStatuses.filter((status) => status === "done").length;
  const target = isFinished ? null : currentStep.target;
  const stepPath = isFinished ? null : (currentStep.path ?? null);
  const { onWrongPage, targetOffScreen } = useOnboardingTargetTracking(target, stepPath, pathname);

  const sampleFileUrl = isFinished ? undefined : currentStep.sampleFileUrl;
  const sampleFileName = isFinished ? undefined : currentStep.sampleFileName;
  const [draggableSampleFile, setDraggableSampleFile] = useState<File | null>(null);
  useEffect(() => {
    if (!sampleFileUrl) {
      setDraggableSampleFile(null);
      return;
    }
    let cancelled = false;
    fetch(sampleFileUrl)
      .then((response) => response.blob())
      .then((blob) => {
        if (cancelled) return;
        setDraggableSampleFile(new File([blob], sampleFileName ?? "sample-file", { type: blob.type }));
      });
    return () => {
      cancelled = true;
    };
  }, [sampleFileUrl, sampleFileName]);

  const renderStepExtra = (step: OnboardingStep, _index: number, status: OnboardingStepStatus) => {
    if (status !== "active" || !step.sampleFileUrl || !labels.sampleFileButton) {
      return null;
    }
    if (step.sampleFileDropPath && pathname !== step.sampleFileDropPath) {
      return null;
    }
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-muted-foreground">{labels.sampleFileButton}</p>
        <div
          role="button"
          tabIndex={0}
          draggable={Boolean(draggableSampleFile)}
          onDragStart={(event) => {
            if (!draggableSampleFile) return;
            event.dataTransfer.items.add(draggableSampleFile);
            event.dataTransfer.effectAllowed = "copy";
          }}
          onClick={() => {
            const link = document.createElement("a");
            link.href = step.sampleFileUrl!;
            if (step.sampleFileName) link.download = step.sampleFileName;
            link.click();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.currentTarget.click();
            }
          }}
          className="inline-flex w-fit cursor-pointer select-none items-center gap-2 rounded-lg bg-muted/40 py-1.5 pl-2 pr-3 outline-none hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-[var(--tour-accent,var(--primary))]"
        >
          <span draggable={false} className="shrink-0">
            <FileText className="size-4 text-muted-foreground" aria-hidden />
          </span>
          <span className="text-sm font-medium text-foreground">{step.sampleFileName}</span>
          <span draggable={false} className="ml-auto shrink-0">
            <Download className="size-3.5 text-muted-foreground/60" aria-hidden />
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-xl",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <ProgressRing completed={completedCount} total={task.steps.length} size={44} strokeWidth={4} />
          <span className="absolute inset-0 grid place-items-center text-[10px] font-bold text-foreground tabular-nums">
            {completedCount}/{task.steps.length}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">{task.title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{task.goal}</p>
        </div>
      </div>

      {isFinished && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          {labels.finishedTitle}
        </div>
      )}

      {!isFinished && onWrongPage && stepPath && (
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-sm text-muted-foreground">
            {highlightLabels.goToPage(currentStep.pageLabel ?? stepPath)}
          </p>
          <Button
            size="sm"
            className="mt-3"
            onClick={() => onNavigate?.(stepPath)}
          >
            {highlightLabels.goToPageButton}
          </Button>
        </div>
      )}

      {!isFinished && !onWrongPage && targetOffScreen && target && (
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-sm text-muted-foreground">{highlightLabels.scrollToTarget}</p>
          <Button
            size="sm"
            className="mt-3"
            onClick={() =>
              findTourTarget(target)?.scrollIntoView({ behavior: "smooth", block: "center" })
            }
          >
            {highlightLabels.scrollToTargetButton}
          </Button>
        </div>
      )}

      {!isFinished && !onWrongPage && !targetOffScreen && (currentStep.type === "info" || currentStep.helpText) && (
        <div className="rounded-lg bg-muted/40 p-3">
          {currentStep.helpText && (
            <p className="text-sm text-muted-foreground">{currentStep.helpText}</p>
          )}
          {currentStep.type === "info" && (
            <Button size="sm" className="mt-3" onClick={completeInfoStep}>
              {labels.nextButton}
            </Button>
          )}
        </div>
      )}

      <OnboardingStepList steps={task.steps} statuses={stepStatuses} renderStepExtra={renderStepExtra} />

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => {
            onRestart?.();
            restart();
          }}
        >
          {labels.resetButton}
        </Button>
        {onClose && labels.closeButton && (
          <Button variant="ghost" size="sm" className="flex-1" onClick={onClose}>
            {labels.closeButton}
          </Button>
        )}
      </div>
    </div>
  );
}
