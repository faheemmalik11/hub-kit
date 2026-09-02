import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Loader2,
  RefreshCw,
  TriangleAlert,
  Wifi,
} from "lucide-react";

import type {
  ConnectionTestResult,
  DocumentSource,
  FieldOption,
  SourceField,
  SourceFieldValue,
} from "../../adapters/document-sources";
import { Button } from "../../ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../ui/collapsible";
import { Combobox } from "../../ui/combobox";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { MultiCombobox } from "../../ui/multi-combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../../ui/sheet";
import { Switch } from "../../ui/switch";
import { cn } from "../../lib/class-names";
import { SourceIconBadge, StatusChip } from "./source-visuals";
import type { DocumentSourcesLabels } from "./labels";

export interface SourceSettingsSheetProps {
  source: DocumentSource | null;
  labels: DocumentSourcesLabels;
  canEdit: boolean;
  onClose: () => void;
  onSave: (
    sourceId: string,
    values: Record<string, SourceFieldValue>,
  ) => Promise<void>;
  onRefreshOptions?: (sourceId: string, fieldKey: string) => void;
  onTestConnection?: (sourceId: string) => Promise<ConnectionTestResult>;
}

export function SourceSettingsSheet({
  source,
  labels,
  canEdit,
  onClose,
  onSave,
  onRefreshOptions,
  onTestConnection,
}: SourceSettingsSheetProps) {
  return (
    <Sheet
      open={source !== null}
      onOpenChange={(open) => (!open ? onClose() : undefined)}
    >
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg lg:max-w-xl">
        {source && (
          <SheetBody
            key={source.id}
            source={source}
            labels={labels}
            canEdit={canEdit}
            onClose={onClose}
            onSave={onSave}
            onRefreshOptions={onRefreshOptions}
            onTestConnection={onTestConnection}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function SheetBody({
  source,
  labels,
  canEdit,
  onClose,
  onSave,
  onRefreshOptions,
  onTestConnection,
}: SourceSettingsSheetProps & { source: DocumentSource }) {
  const initialValues = useMemo(() => {
    const values: Record<string, SourceFieldValue> = {};
    for (const field of source.fields) {
      values[field.key] = field.value;
    }
    return values;
  }, [source.fields]);

  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(
    null,
  );

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const isDirty = useMemo(
    () =>
      source.fields.some(
        (field) => !sameValue(values[field.key], initialValues[field.key]),
      ),
    [source.fields, values, initialValues],
  );

  const setValue = (key: string, value: SourceFieldValue) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const plainFields = source.fields.filter((field) => !field.advanced);
  const advancedFields = source.fields.filter((field) => field.advanced);

  const save = async () => {
    setSaving(true);
    setSaveError(false);
    try {
      await onSave(source.id, values);
      onClose();
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    if (!onTestConnection) {
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      setTestResult(await onTestConnection(source.id));
    } catch {
      setTestResult({ ok: false, message: labels.sheet.saveFailed });
    } finally {
      setTesting(false);
    }
  };

  const renderField = (field: SourceField) => (
    <FieldRow
      key={field.key}
      field={field}
      value={values[field.key]}
      onChange={(value) => setValue(field.key, value)}
      onRefresh={
        onRefreshOptions
          ? () => onRefreshOptions(source.id, field.key)
          : undefined
      }
      labels={labels}
    />
  );

  return (
    <>
      <SheetHeader className="border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <SourceIconBadge icon={source.icon} className="size-12" />
          <div className="min-w-0">
            <SheetTitle className="truncate text-left">
              {source.name}
            </SheetTitle>
            <SheetDescription className="truncate text-left">
              {source.detail}
            </SheetDescription>
            <div className="mt-1">
              <StatusChip status={source.status} labels={labels} />
            </div>
          </div>
        </div>
        {source.lastChangedBy && (
          <p className="text-xs text-muted-foreground">
            {labels.sheet.lastChangedBy(source.lastChangedBy)}
          </p>
        )}
      </SheetHeader>

      <div className="flex gap-4 border-b border-border">
        <span className="border-b-2 border-primary pb-2 pt-3 text-sm font-semibold text-foreground">
          {labels.sheet.settingsTab}
        </span>
      </div>

      <div className="flex-1 divide-y divide-border">
        {plainFields.map(renderField)}

        {advancedFields.length > 0 && (
          <Collapsible className="py-4">
            <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between text-sm font-semibold text-foreground">
              {labels.sheet.advanced}
              <ChevronDown className="size-4 text-muted-foreground" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-5 pt-4">
              {advancedFields.map(renderField)}
            </CollapsibleContent>
          </Collapsible>
        )}

        {onTestConnection && (
          <div className="border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={test}
              disabled={testing}
            >
              {testing ? <Loader2 className="animate-spin" /> : <Wifi />}
              {testing ? labels.sheet.testRunning : labels.sheet.testConnection}
            </Button>
            {testResult && (
              <p
                className={cn(
                  "mt-2 text-sm",
                  testResult.ok ? "text-success" : "text-destructive",
                )}
              >
                {testResult.message}
              </p>
            )}
          </div>
        )}
      </div>

      <SheetFooter className="mt-auto flex-col gap-2 border-t border-border pt-4">
        {saveError && (
          <p className="text-sm text-destructive">{labels.sheet.saveFailed}</p>
        )}
        {!canEdit && (
          <p className="text-xs text-muted-foreground">
            {labels.sheet.adminOnly}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            {labels.sheet.cancel}
          </Button>
          <Button
            type="button"
            onClick={save}
            disabled={saving || !canEdit || !isDirty}
          >
            {saving && <Loader2 className="animate-spin" />}
            {saving ? labels.sheet.saving : labels.sheet.save}
          </Button>
        </div>
      </SheetFooter>
    </>
  );
}

function FieldRow({
  field,
  value,
  onChange,
  onRefresh,
  labels,
}: {
  field: SourceField;
  value: SourceFieldValue;
  onChange: (value: SourceFieldValue) => void;
  onRefresh?: () => void;
  labels: DocumentSourcesLabels;
}) {
  const hasOptions =
    field.kind === "select" ||
    field.kind === "multiSelect" ||
    field.kind === "treeSelect";

  if (field.kind === "toggle") {
    return (
      <div className="flex items-center justify-between gap-4 py-4 first:pt-5">
        <div className="min-w-0">
          <Label className="text-sm font-semibold text-foreground">{field.label}</Label>
          {field.description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{field.description}</p>
          )}
        </div>
        <Switch checked={value === true} onCheckedChange={onChange} />
      </div>
    );
  }

  return (
    <div className="py-4 first:pt-5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-semibold text-foreground">
          {field.label}
        </Label>
        {hasOptions && onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={field.optionsLoading}
            className="inline-flex cursor-pointer items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw
              className={cn("size-3", field.optionsLoading && "animate-spin")}
            />
            {labels.sheet.refreshOptions}
          </button>
        )}
      </div>
      {field.description && (
        <p className="mt-0.5 text-sm text-muted-foreground">
          {field.description}
        </p>
      )}
      {hasOptions && field.optionsError && (
        <p className="mt-2 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          {labels.sheet.optionsFailed}
        </p>
      )}
      <div className="mt-2">
        <FieldControl
          field={field}
          value={value}
          onChange={onChange}
          noneLabel={labels.sheet.none}
          loadingLabel={labels.sheet.optionsLoading}
        />
      </div>
    </div>
  );
}

function FieldControl({
  field,
  value,
  onChange,
  noneLabel,
  loadingLabel,
}: {
  field: SourceField;
  value: SourceFieldValue;
  onChange: (value: SourceFieldValue) => void;
  noneLabel: string;
  loadingLabel: string;
}) {
  const selectedIds = Array.isArray(value)
    ? value
    : typeof value === "string" && value
      ? [value]
      : [];
  const options = withSavedValues(
    field.options,
    selectedIds,
    field.optionsLoading === true,
  );
  const placeholder = field.optionsLoading
    ? loadingLabel
    : (field.placeholder ?? noneLabel);

  switch (field.kind) {
    case "select":
      return (
        <Select
          value={typeof value === "string" && value !== "" ? value : NONE_VALUE}
          onValueChange={(next) => onChange(next === NONE_VALUE ? null : next)}
          disabled={field.optionsLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>{noneLabel}</SelectItem>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "multiSelect":
      return (
        <MultiCombobox
          values={selectedIds}
          onValuesChange={onChange}
          options={options}
          placeholder={placeholder}
          disabled={field.optionsLoading}
        />
      );
    case "treeSelect":
      return (
        <Combobox
          value={typeof value === "string" && value !== "" ? value : NONE_VALUE}
          onValueChange={(next) => onChange(next === NONE_VALUE ? null : next)}
          options={[{ value: NONE_VALUE, label: noneLabel }, ...options]}
          placeholder={placeholder}
          disabled={field.optionsLoading}
        />
      );
    case "toggle":
      return <Switch checked={value === true} onCheckedChange={onChange} />;
    case "text":
      return (
        <Input
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
        />
      );
  }
}

const NONE_VALUE = "__none";

function sameValue(left: SourceFieldValue, right: SourceFieldValue): boolean {
  if (Array.isArray(left) || Array.isArray(right)) {
    const asList = (value: SourceFieldValue) =>
      Array.isArray(value) ? value : [];
    return asList(left).join("\u0000") === asList(right).join("\u0000");
  }
  return (left ?? "") === (right ?? "");
}

function withSavedValues(
  options: FieldOption[] | undefined,
  selectedIds: string[],
  loading: boolean,
): { value: string; label: string; depth?: number }[] {
  const flat = flattenTree(options ?? []);
  if (loading) {
    return flat;
  }
  const known = new Set(flat.map((option) => option.value));
  const missing = selectedIds.filter(
    (id) => id && id !== NONE_VALUE && !known.has(id),
  );
  return [...flat, ...missing.map((id) => ({ value: id, label: id }))];
}

function flattenTree(
  options: FieldOption[],
  depth = 0,
): { value: string; label: string; depth: number }[] {
  return options.flatMap((option) => {
    const children = flattenTree(option.children ?? [], depth + 1);
    if (!option.value) {
      return children;
    }
    return [{ value: option.value, label: option.label, depth }, ...children];
  });
}
