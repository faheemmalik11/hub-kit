import { useState } from "react";
import { Check, ChevronDown, ChevronLeft } from "lucide-react";
import { enUS } from "date-fns/locale";
import type { Locale } from "date-fns";
import type { DateRange } from "react-day-picker";

import { Button } from "../../ui/button";
import { Calendar } from "../../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import {
  isOverviewPeriod,
  OVERVIEW_PERIOD_DEFAULT,
  OVERVIEW_PERIODS,
  type OverviewPeriod,
} from "./periods";
import { cn } from "../../lib/class-names";

export interface PeriodValue {
  period: OverviewPeriod;
  from?: string;
  to?: string;
}

export interface PeriodLabels {
  period: Record<OverviewPeriod, string>;
  back: string;
  reset: string;
}

export const englishPeriodLabels: PeriodLabels = {
  period: {
    all: "All time",
    custom: "Custom range",
    last30Days: "Last 30 days",
    currentMonth: "This month",
    lastMonth: "Last month",
    last6Months: "Last 6 months",
    last12Months: "Last 12 months",
    currentYear: "This year",
    lastYear: "Last year",
  },
  back: "Back",
  reset: "Reset",
};

const PRESETS = OVERVIEW_PERIODS.filter((period) => period !== "custom");

const STORAGE_PREFIX = "hub-kit.overview-period.";

export function readStoredPeriod(key: string): PeriodValue {
  if (typeof window === "undefined") return { period: OVERVIEW_PERIOD_DEFAULT };
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PeriodValue>;
      if (isOverviewPeriod(parsed?.period)) {
        return { period: parsed.period, from: parsed.from, to: parsed.to };
      }
    }
  } catch {
  }
  return { period: OVERVIEW_PERIOD_DEFAULT };
}

export function writeStoredPeriod(key: string, value: PeriodValue): void {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
  }
}

export function useStoredPeriod(key: string): [PeriodValue, (value: PeriodValue) => void] {
  const [value, setValue] = useState<PeriodValue>(() => readStoredPeriod(key));
  const set = (next: PeriodValue) => {
    setValue(next);
    writeStoredPeriod(key, next);
  };
  return [value, set];
}

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function fromIsoDate(iso?: string): Date | undefined {
  if (!iso) return undefined;
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

export function PeriodPicker({
  value,
  onChange,
  className,
  labels = englishPeriodLabels,
  formatDay,
  locale = enUS,
}: {
  value: PeriodValue;
  onChange: (value: PeriodValue) => void;
  className?: string;
  labels?: PeriodLabels;
  formatDay: (iso: string) => string;
  locale?: Locale;
}) {
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>();

  const isCustom = value.period === "custom";
  const label =
    isCustom && value.from && value.to
      ? `${formatDay(value.from)} – ${formatDay(value.to)}`
      : labels.period[value.period];

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setCustomOpen(isCustom);
          setRange({ from: fromIsoDate(value.from), to: fromIsoDate(value.to) });
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "h-6 gap-1 px-1.5 text-[0.7rem] font-normal text-muted-foreground hover:text-foreground",
            className,
          )}
        >
          {label}
          <ChevronDown className="size-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-1">
        {customOpen ? (
          <div>
            <Calendar
              mode="range"
              numberOfMonths={1}
              defaultMonth={fromIsoDate(value.from) ?? new Date()}
              selected={range}
              locale={locale}
              onSelect={(nextRange) => {
                setRange(nextRange);
                if (nextRange?.from && nextRange?.to) {
                  onChange({
                    period: "custom",
                    from: toIsoDate(nextRange.from),
                    to: toIsoDate(nextRange.to),
                  });
                  setOpen(false);
                }
              }}
            />
            <div className="flex items-center justify-between border-t border-border px-1 pt-1">
              <button
                type="button"
                onClick={() => setCustomOpen(false)}
                className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ChevronLeft className="size-3" />
                {labels.back}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRange(undefined);
                  onChange({ period: OVERVIEW_PERIOD_DEFAULT, from: undefined, to: undefined });
                  setOpen(false);
                }}
                className="cursor-pointer rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {labels.reset}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {PRESETS.map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => {
                  onChange({ period, from: undefined, to: undefined });
                  setOpen(false);
                }}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-4 rounded-md px-2 py-1.5 text-left text-xs whitespace-nowrap transition-colors hover:bg-muted",
                  period === value.period && "font-medium",
                )}
              >
                {labels.period[period]}
                {period === value.period && <Check className="size-3" />}
              </button>
            ))}
            <div className="my-1 h-px bg-border" />
            <button
              type="button"
              onClick={() => setCustomOpen(true)}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-4 rounded-md px-2 py-1.5 text-left text-xs whitespace-nowrap transition-colors hover:bg-muted",
                isCustom && "font-medium",
              )}
            >
              {labels.period.custom}
              {isCustom && <Check className="size-3" />}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
