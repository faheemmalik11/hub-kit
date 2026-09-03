import type { DateRangeCalendarLabels } from "../dashboard/date-range-calendar";

export interface FilterOption {
  value: string;
  label: string;
  keywords?: string;
}

export type FilterField =
  | {
      kind: "select";
      key: string;
      label: string;
      value: string;
      defaultValue: string;
      options: FilterOption[];
      onChange: (value: string) => void;
    }
  | {
      kind: "dateRange";
      key: string;
      label: string;
      value: string;
      defaultValue: string;
      onChange: (value: string) => void;
      options: FilterOption[];
      from: string;
      to: string;
      onRangeApply: (from: string, to: string) => void;
      customValue: string;
      rangeLabels: DateRangeCalendarLabels;
      locale: string;
      backLabel: string;
      placeholder: string;
      searchPlaceholder: string;
      emptyLabel: string;
      formatDay: (isoDay: string) => string;
    }
  | {
      kind: "toggle";
      key: string;
      label: string;
      fieldLabel?: string;
      value: boolean;
      onChange: (value: boolean) => void;
    };

export function countActiveFilters(fields: FilterField[]): number {
  return fields.filter((field) => {
    if (field.kind === "toggle") return field.value;
    return field.value !== field.defaultValue;
  }).length;
}

export function clearFilters(fields: FilterField[]): void {
  for (const field of fields) {
    if (field.kind === "toggle") {
      field.onChange(false);
    } else if (field.kind === "dateRange") {
      field.onChange(field.defaultValue);
      field.onRangeApply("", "");
    } else {
      field.onChange(field.defaultValue);
    }
  }
}

export interface ActiveFilter {
  key: string;
  label: string;
  valueLabel?: string;
  clear: () => void;
}

export function activeFilters(fields: FilterField[]): ActiveFilter[] {
  const active: ActiveFilter[] = [];
  for (const field of fields) {
    if (field.kind === "toggle") {
      if (field.value) {
        active.push({ key: field.key, label: field.label, clear: () => field.onChange(false) });
      }
      continue;
    }
    if (field.value === field.defaultValue) continue;

    if (field.kind === "dateRange") {
      const range = [field.from, field.to].filter(Boolean).map(field.formatDay).join(" – ");
      active.push({
        key: field.key,
        label: field.label,
        valueLabel:
          (field.value === field.customValue && range) ||
          field.options.find((option) => option.value === field.value)?.label ||
          field.value,
        clear: () => {
          field.onChange(field.defaultValue);
          field.onRangeApply("", "");
        },
      });
      continue;
    }

    active.push({
      key: field.key,
      label: field.label,
      valueLabel: field.options.find((option) => option.value === field.value)?.label ?? field.value,
      clear: () => field.onChange(field.defaultValue),
    });
  }
  return active;
}
