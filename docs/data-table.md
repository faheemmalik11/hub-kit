# Data table guide

The parts every list screen is built from: a search box, one Filter button holding all the
filters, chips saying what is on, a period picker, sortable headers, two-line cells and a
tooltip. The kit ships the behaviour; the project supplies the data and the words.

Every project used to keep its own copy of these in `src/components/data-table/`. The copies
drifted — one had a hyphen where another had an en dash, one had the responsive fix and the
others did not. They live here now so a fix lands once.

---

## 1. Who owns what

**The layout belongs to the project. The parts belong to the kit.**

A route builds its own page — header, tabs, toolbar, state, empty and error states — and imports
the pieces it needs from hub-kit. It does not import a `*Page` component and render it as the
whole screen.

That was tried. `ApprovalRulesPage` lived here and all four projects rendered it, and every time
one project needed something moved it grew another prop — `extraTabs`, `rulesTabHeader` — until
the shared page was a set of holes cut for four different callers and none of them could change
its own layout without touching the other three. The parts it was made of (`RuleTable`,
`RuleEditor`, `ScenarioForm`, `ScenarioResult`, `StatusSummary`, `DeleteRuleDialog`) were already
the reusable thing; the page around them was not.

So: share a table row, a filter popover, a rule editor, a calendar. Do not share a screen.

---

## 2. Import

```tsx
import {
  SearchInput,
  FilterPopover,
  FilterPills,
  DateRangePicker,
  SortableColumnHeader,
  SortControl,
  StackedCell,
  HintTooltip,
  TablePagination,
} from "@hub-kit/core/data-table";
import type { FilterField } from "@hub-kit/core/data-table";
```

No component here reads a translation or touches a query. Text arrives as props with
English defaults; data arrives from the page.

---

## 3. The filter model

This is the important idea. Declare every filter **once, as data**. The Filter button, the
number on its badge, and the chips all read that one list, so they can never disagree about
what is filtering the screen.

```tsx
const filterFields: FilterField[] = [
  {
    kind: "select",
    key: "account",
    label: t("bank.list.filter.account"),
    value: accountId,
    defaultValue: ALL,          // the value that means "not filtering"
    onChange: setAccountId,
    options: [
      { value: ALL, label: t("bank.list.filter.allAccounts") },
      ...accounts.map((a) => ({
        value: a.id,
        label: accountName.get(a.id) ?? a.id,
        keywords: a.iban ?? "",  // searchable, not shown
      })),
    ],
  },
];
```

`defaultValue` is what makes a field count as inactive. Screens that keep filters in the URL
usually already have a sentinel like `"__all"` — pass that, do not invent a second one.

### The three kinds

| kind | control | use it for |
| --- | --- | --- |
| `select` | Combobox | one value out of a list |
| `dateRange` | DateRangePicker | a period — **one** field, not a from and a to |
| `toggle` | Switch | a yes/no narrowing, e.g. "Without address" |

A `dateRange` is one field on purpose. As two independent controls it counted twice on the
badge and produced two chips for one range, and it let a reader pick a range that ran
backwards.

```tsx
{
  kind: "dateRange",
  key: "period",
  label: t("filter.period"),
  value: period,
  defaultValue: ALL,
  onChange: (v) => {
    setPeriod(v);
    // A preset resolves to real dates at once; the custom option only opens the calendar.
    if (v === CUSTOM) return;
    const range = periodRange(v, from, to);
    setFrom(range.from ?? "");
    setTo(range.to ?? "");
  },
  options: periodOptions,
  customValue: CUSTOM,
  from,
  to,
  onRangeApply: (newFrom, newTo) => {
    setPeriod(CUSTOM);
    setFrom(newFrom);
    setTo(newTo);
  },
  locale: dateLocale(),
  formatDay: (iso) => formatDate(iso),
  backLabel: t("period.back"),
  placeholder: t("filter.period"),
  searchPlaceholder: t("common.combobox.search"),
  emptyLabel: t("common.combobox.empty"),
  rangeLabels: {
    reset: t("period.reset"),
    apply: t("period.apply"),
    previousMonth: t("period.previousMonth"),
    nextMonth: t("period.nextMonth"),
    pickSecond: t("period.pickSecond"),
  },
}
```

The preset list itself stays in the project. It is the project's vocabulary, and presets
computed from the calendar are the only ones that stay honest on a screen that pages its
rows server-side — a list derived from the rows would be derived from one page of them.

### Helpers

- `countActiveFilters(fields)` — how many are narrowing the list.
- `clearFilters(fields)` — put them all back to neutral.
- `activeFilters(fields)` — the active ones resolved for display, each with its own `clear`.

---

## 4. The toolbar

```tsx
<div className="mt-6 flex flex-wrap items-center gap-3">
  <SearchInput
    value={search}
    onValueChange={setSearch}
    placeholder={t("bank.list.search")}
    className="min-w-[240px] flex-1 max-w-none"
  />
  <FilterPopover
    fields={filterFields}
    labels={{
      button: t("filter.button"),
      title: t("filter.title"),
      reset: t("filter.reset"),
    }}
  />
</div>

<FilterPills
  fields={filterFields}
  extra={
    searchTerm
      ? [{
          key: "search",
          label: t("bank.list.search"),
          valueLabel: searchTerm,
          clear: () => { setSearch(""); setSearchTerm(""); },
        }]
      : []
  }
  className="mt-3"
/>
```

One Filter button, not a row of loose dropdowns. Five dropdowns strung across a toolbar wrap
onto two lines on a laptop and push the table down the page.

`FilterPopover` opens a popover on the desktop and a **bottom sheet on a phone** — a popover
there either clips against the viewport edge or floats somewhere unrelated to the tap. Pass
`mobileExtra` to put a sort control in that sheet, since a card list has no headers to click.

`FilterPills` says *which* filters are on, which the badge cannot. Each chip clears its own
field. A search term is not a `FilterField`, so it rides along in `extra`.

---

## 5. Sortable headers

```tsx
<SortableColumnHeader
  column="booking_date"
  sort={sortColumn}
  direction={sortDirection}
  onSort={(column) => sortBy(column as MySort)}
  className="whitespace-nowrap"
>
  {t("col.date")}
</SortableColumnHeader>

<SortableColumnHeader column="amount" sort={sortColumn} direction={sortDirection}
  onSort={...} align="right">
  {t("col.amount")}
</SortableColumnHeader>
```

It knows a column key, the active key and a direction — nothing about what is being sorted or
where. Client-side or a backend `order by`, both work.

Use `align="right"` for a right-aligned column, **not** `className="text-right"`. The arrow
stays to the right of the label in every column; mirroring it moved the same control to the
other side halfway across the header.

The direction is drawn *and* announced with `aria-sort`, and the header is a real button, so
sorting is reachable from the keyboard.

`nextSortState(column, sort, direction)` gives the usual rule: same column flips, a different
column starts ascending.

For card layouts and filter sheets, `SortControl` is the dropdown version.

---

## 6. Two-line cells

`StackedCell` is the name-over-identifier cell: an account and its IBAN, a counterparty and
its IBAN.

```tsx
<TableCell className="max-w-[220px]">
  <StackedCell
    primary={counterpartyName ?? "—"}
    secondary={counterpartyIban}
    primaryClassName="text-sm font-medium"
  />
</TableCell>
```

| prop | meaning |
| --- | --- |
| `primary` | the name. Always shown. |
| `secondary` | the identifier under it. Omitted when empty **or identical to `primary`**. |
| `primaryClassName` / `secondaryClassName` | per-column type sizes |

Squeezing both onto one line meant the identifier was the half that got truncated away — the
half that tells two similarly named rows apart.

**Do not pass a `primary` that already ends in part of the `secondary`.** If the project
builds unique account labels by appending an IBAN tail, strip that tail for `primary`; the
second line carries the whole IBAN now. Keep the tail in the filter dropdown, which is one
line per option and still needs it.

---

## 7. Tooltip

```tsx
<TableCell className="max-w-[280px] text-sm text-muted-foreground">
  <HintTooltip label={paymentReference}>
    <div className="truncate">{paymentReference ?? "—"}</div>
  </HintTooltip>
</TableCell>
```

Two rules make it useful rather than noisy:

- It opens **only when the text is actually cut off** (`scrollWidth > clientWidth`). A cell
  reading "Pleo" has nothing more to reveal, and a tooltip repeating what is already on screen
  teaches people to ignore tooltips. Pass `onlyWhenClipped={false}` for a real hint with no
  truncation to detect.
- It opens **at the pointer**, not centred on the cell, because a box in the middle of the
  words covers the text it is explaining.

Colour comes from the theme — `bg-primary` / `text-primary-foreground` resolve to whichever
palette the project loaded. A project wanting a different ground passes `contentClassName`
rather than editing the kit.

Needs a `TooltipProvider` above it. Every project mounts one in its app shell already.

`StackedCell` uses this internally, so its lines explain themselves with no extra wiring.

---

## 8. Pagination

```tsx
<TablePagination
  page={page} totalPages={totalPages} pageSize={pageSize}
  total={total} from={from} to={to}
  onPage={setPage} onPageSize={setPageSize}
  labels={paginationLabels}
/>
```

`PAGE_SIZES` is the shared list; `englishPaginationLabels` is the default wording.

---

## 9. Wiring a project to the kit source

During development the kit is read from its own source folder, so editing a file in
`../hub-kit` hot-reloads in the app with no publish and no reinstall.

In `vite.config.ts`, alias each subpath to `../hub-kit/src/<folder>/index.ts` behind an
`existsSync` check, so a machine without the sibling folder falls back to the installed
package. **Add new subpaths to that list** — a missing entry silently falls through to `dist`
and your source edits do nothing.

Two things bite:

- **Dedupe the shared runtime.** Compiling kit source means its bare imports resolve against
  `../hub-kit/node_modules`. On a project whose React differs from the kit's, that is a second
  React and an instant invalid-hook-call. List `react`, `react-dom`, the Radix packages,
  `cmdk` and `lucide-react` in `resolve.dedupe`.
- **Let Tailwind see the kit.** Tailwind 4 takes `@source`; Tailwind 3 needs
  `"../hub-kit/src/**/*.{ts,tsx}"` in `content`. Without it every kit-only class is dropped
  from the build with no error.

Never alias `react` to `./node_modules/@types/react` to fix a duplicate-types error. Vite
reads the same tsconfig, `@types/react` has no runtime entry, and every page dies.

---

## 10. Checklist for a list screen

1. The route owns the layout. No `*Page` imported from the kit and rendered as the screen.
2. Declare every filter in one `FilterField[]`, with a real `defaultValue`.
3. `SearchInput` + `FilterPopover` in the toolbar. No loose dropdowns beside them.
4. `FilterPills` under it, with the search term in `extra`.
5. Sortable columns use `SortableColumnHeader`; right-aligned ones use `align="right"`.
6. Name-plus-identifier columns use `StackedCell`; strip any identifier tail from `primary`.
7. Truncating cells use `HintTooltip`, never the browser's `title`.
8. Keep the period presets in the project; keep the picker in the kit.
9. No German in the kit, and no rendered string in the kit.
