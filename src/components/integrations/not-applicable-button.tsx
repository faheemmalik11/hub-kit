import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";
import { Button } from "../../ui/button";

export interface NotApplicableLabels {
  markNotApplicable: string;
  undoNotApplicable: string;
  markTitle: string;
  markText: string;
  undoTitle: string;
  undoText: string;
  confirm: string;
  cancel: string;
}

export function NotApplicableButton({
  notApplicable,
  onConfirm,
  disabled,
  labels,
}: {
  notApplicable: boolean;
  onConfirm: (nextNotApplicable: boolean) => void;
  disabled?: boolean;
  labels: NotApplicableLabels;
}) {
  const [open, setOpen] = useState(false);
  const nextNotApplicable = !notApplicable;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="whitespace-nowrap"
      >
        {notApplicable ? labels.undoNotApplicable : labels.markNotApplicable}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{nextNotApplicable ? labels.markTitle : labels.undoTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {nextNotApplicable ? labels.markText : labels.undoText}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onConfirm(nextNotApplicable);
                setOpen(false);
              }}
            >
              {labels.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
