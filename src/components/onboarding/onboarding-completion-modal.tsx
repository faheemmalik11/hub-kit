import { CheckCircle2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Button } from "../../ui/button";

export interface OnboardingCompletionModalLabels {
  title: string;
  message: string;
  exitButton: string;
  restartButton: string;
}

export function OnboardingCompletionModal({
  open,
  onOpenChange,
  labels,
  onExit,
  onRestart,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: OnboardingCompletionModalLabels;
  onExit: () => void;
  onRestart: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[65] text-center sm:text-center">
        <DialogHeader className="items-center text-center sm:text-center">
          <CheckCircle2
            className="size-10 text-[var(--tour-accent,var(--primary))]"
            aria-hidden
          />
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="justify-center sm:justify-center">
          <Button variant="outline" onClick={onRestart}>
            {labels.restartButton}
          </Button>
          <Button onClick={onExit}>{labels.exitButton}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
