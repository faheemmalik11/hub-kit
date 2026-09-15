import { useState } from "react";

import type {
  FieldOption,
  RunNowFolder,
  SourceField,
} from "../../adapters/document-sources";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { cn } from "../../lib/class-names";
import { englishDocumentSourcesLabels, type DocumentSourcesLabels } from "./labels";
import { FieldControl } from "./SourceSettingsSheet";

type Mode = "default" | "folders";

/** Every option in a possibly nested folder list, so a picked id can carry the name it was shown as. */
function namesById(options: FieldOption[] | undefined): Map<string, string> {
  const names = new Map<string, string>();
  const walk = (list: FieldOption[]) => {
    for (const option of list) {
      if (option.value) names.set(option.value, option.label);
      walk(option.children ?? []);
    }
  };
  walk(options ?? []);
  return names;
}

/**
 * Run one channel now: its usual folders, or a set picked for this run only.
 *
 * The usual folders are selected when it opens, because that is what almost every press means. The
 * picker is the settings sheet's own control over the channel's own folder list, so a folder that
 * can be chosen here is one the sheet would offer too.
 */
export function RunNowDialog({
  open,
  onOpenChange,
  sourceName,
  folderField,
  labels,
  onStart,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceName: string;
  folderField: SourceField;
  labels: DocumentSourcesLabels;
  /** Null for the usual folders; otherwise the folders picked, with the names they were shown as. */
  onStart: (folders: RunNowFolder[] | null) => Promise<void>;
}) {
  const text = labels.runNowDialog ?? englishDocumentSourcesLabels.runNowDialog!;
  const [mode, setMode] = useState<Mode>("default");
  const [picked, setPicked] = useState<string[]>([]);
  const [starting, setStarting] = useState(false);

  const nothingPicked = mode === "folders" && picked.length === 0;

  async function start() {
    const names = namesById(folderField.options);
    const folders =
      mode === "folders" ? picked.map((id) => ({ id, name: names.get(id) ?? id })) : null;
    setStarting(true);
    try {
      await onStart(folders);
      onOpenChange(false);
      setMode("default");
      setPicked([]);
    } finally {
      setStarting(false);
    }
  }

  const option = (value: Mode, title: string, hint: string) => (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
        mode === value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40",
      )}
    >
      <input
        type="radio"
        name="run-now-mode"
        className="mt-1 size-4 accent-[var(--color-primary)]"
        checked={mode === value}
        onChange={() => setMode(value)}
        disabled={starting}
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>
      </span>
    </label>
  );

  return (
    <Dialog open={open} onOpenChange={(next) => !starting && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{text.title(sourceName)}</DialogTitle>
          <DialogDescription>{text.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {option("default", text.defaultRun, text.defaultRunHint)}
          {option("folders", text.chosenFolders, text.chosenFoldersHint)}
        </div>

        {mode === "folders" && (
          <FieldControl
            // Always many: one run may read several archive folders at once.
            field={{ ...folderField, kind: "multiSelect" }}
            value={picked}
            onChange={(next) => setPicked(Array.isArray(next) ? next : next ? [String(next)] : [])}
            labels={labels}
          />
        )}

        <p className="text-xs text-muted-foreground">{text.limits}</p>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={starting}
          >
            {text.cancel}
          </Button>
          <Button type="button" onClick={start} disabled={starting || nothingPicked}>
            {starting ? text.starting : text.start}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
