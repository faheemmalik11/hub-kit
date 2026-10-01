import { useEffect, useState, type ReactNode } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";

import type { LexofficeConnection, LexofficeConnectionAdapter } from "../../adapters/lexoffice";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import { readableErrorMessage } from "../feedback/query-states";
import type { LexofficeApiKeyDialogLabels } from "./labels";

function noteOrNull(note: string): string | null {
  const trimmed = note.trim();
  return trimmed === "" ? null : trimmed;
}

export function LexofficeApiKeyDialog({
  adapter,
  companyId,
  companyCode,
  existing,
  labels,
  unknownError,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  adapter: Pick<LexofficeConnectionAdapter, "saveConnection" | "updateConnectionStatus">;
  companyId: string;
  companyCode: string;
  existing: LexofficeConnection | undefined;
  labels: LexofficeApiKeyDialogLabels;
  unknownError: string;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen ?? localOpen;
  const setOpen = onOpenChange ?? setLocalOpen;
  const [apiKey, setApiKey] = useState("");
  const [isEnabled, setIsEnabled] = useState(existing?.isEnabled ?? true);
  const [note, setNote] = useState(existing?.note ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setApiKey("");
    setIsEnabled(existing?.isEnabled ?? true);
    setNote(existing?.note ?? "");
  }, [open, existing?.isEnabled, existing?.note]);

  const enteredKey = apiKey.trim();
  const missingFirstKey = !existing && !enteredKey;
  const nothingChanged =
    !!existing &&
    !enteredKey &&
    isEnabled === existing.isEnabled &&
    noteOrNull(note) === (existing.note ?? null);

  async function save() {
    setSaving(true);
    try {
      if (enteredKey) {
        await adapter.saveConnection({ companyId, apiKey: enteredKey, isEnabled, note: noteOrNull(note) });
      } else if (existing) {
        await adapter.updateConnectionStatus({ connectionId: existing.id, isEnabled, note: noteOrNull(note) });
      }
      toast.success(labels.saved);
      setOpen(false);
    } catch (error) {
      toast.error(labels.saveFailed(readableErrorMessage(error, unknownError)));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{labels.title(companyCode)}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="lexoffice-api-key">{labels.apiKey}</Label>
            {existing && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <KeyRound className="size-3.5 text-success" aria-hidden />
                {labels.keyStored}
              </p>
            )}
            <Input
              id="lexoffice-api-key"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder={existing ? labels.replaceKeyPlaceholder : labels.newKeyPlaceholder}
              type="password"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              {existing ? labels.keepKeyHint : labels.whereToFindKey}
            </p>
          </div>
          <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
            <div className="min-w-0">
              <Label htmlFor="lexoffice-enabled" className="text-sm font-medium">
                {labels.enabled}
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">{labels.enabledHint}</p>
            </div>
            <Switch
              id="lexoffice-enabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
              className="mt-0.5 shrink-0"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lexoffice-note">{labels.note}</Label>
            <Input
              id="lexoffice-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={labels.notePlaceholder}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {labels.cancel}
          </Button>
          <Button disabled={missingFirstKey || nothingChanged || saving} onClick={save}>
            {labels.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
