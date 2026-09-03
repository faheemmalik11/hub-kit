---
name: data-table
description: Build or change a list screen (table with search, filters, chips, period picker, sortable headers, two-line cells, tooltips) in Hub Kit or in any project that consumes it — Immonetz, Stäy Hub, Eiffler, Mayestate. Use when adding a filter, a sortable column, a date range, a truncating cell, or when a screen still has loose filter dropdowns or a local copy of a data-table component.
---

# Data table screens

Full reference: `docs/data-table.md` in the hub-kit repo. Read it before building a screen.
This file is the short version plus the mistakes that have actually been made.

## The rule

Every list screen in every project is built from the same components, and those components
live in **hub-kit only**. If a project has its own copy of a filter popover, a period picker
or a sortable header, that copy is drift waiting to happen — the four repos already diverged
over a hyphen versus an en dash and one missing responsive fix.

**The layout is the project's, the parts are the kit's.** Never import a whole `*Page` from
hub-kit and render it as the screen. The route owns the page: its header, its tabs, its state,
its empty and error states. From the kit it takes the pieces — `RuleTable`, `RuleEditor`,
`ScenarioForm`, `SearchInput`, `FilterPopover`, `StackedCell` — and composes them.

A whole page in the kit looks like sharing and is not: every project that needs one thing moved
grows another `extraTabs` or `rulesTabHeader` prop until the "shared" page is a pile of holes
cut for four callers, and no project can change its own layout without touching the other three.

```tsx
import {
  SearchInput, FilterPopover, FilterPills, DateRangePicker,
  SortableColumnHeader, SortControl, StackedCell, HintTooltip, TablePagination,
} from "@hub-kit/core/data-table";
import type { FilterField } from "@hub-kit/core/data-table";
```

## Non-negotiables in the kit

1. **No German.** Not in a name, a type, a prop or a comment. `dateRange`, not `zeitraum`;
   `from`/`to`, not `von`/`bis`; `direction`, not `richtung`.
2. **No rendered strings.** Every label is a prop with an English default. The kit never
   calls `useTranslation`.
3. **No colours, no brand.** Theme tokens only — `bg-primary`, `text-brand-dark`. A project
   that needs a different shade passes a className.
4. **No database.** Data arrives from the page.

## Declare filters once, as data

One `FilterField[]` feeds the Filter button, its active count and the chips. Three kinds:
`select`, `dateRange`, `toggle`. `defaultValue` is what marks a field inactive — reuse the
screen's existing "no filter" sentinel rather than inventing a second one.

A period is **one** `dateRange` field, never a separate from and to. As two fields it counted
twice on the badge and produced two chips for one range.

The preset list stays in the project (its own vocabulary). Only the picker is shared.

## Things that have gone wrong

- **A tooltip on everything.** `HintTooltip` opens only when the text is really clipped. A
  cell reading "Pleo" has nothing to reveal, and a tooltip that repeats visible text teaches
  people to ignore tooltips. It also opens at the pointer — a box centred on the cell covers
  the words it is explaining.
- **The identifier shown twice.** If the project appends an IBAN tail to make account labels
  unique, strip it from `StackedCell`'s `primary`; the second line already carries the whole
  IBAN. Keep the tail in the filter dropdown, which is one line per option.
- **`className="text-right"` on a sortable header.** Use `align="right"`, or the arrow
  mirrors to the wrong side of the label.
- **A new export that does not hot-reload.** Projects alias kit subpaths to
  `../hub-kit/src/<folder>/index.ts`. Add every new subpath to that list in each project's
  `vite.config.ts`, or it silently falls through to `dist`.
- **Aliasing `react` to `@types/react` to silence duplicate-type errors.** Vite reads the same
  tsconfig, `@types/react` has no runtime entry, and every page dies with
  `ReferenceError: module is not defined`. Fix duplicates with `resolve.dedupe` instead.
- **Tailwind not scanning the kit.** Tailwind 4 uses `@source`; Tailwind 3 (Eiffler) needs
  `"../hub-kit/src/**/*.{ts,tsx}"` in `content`. Missing it drops kit-only classes with no
  error at all.

## Projects and their differences

| project | React | Tailwind | notes |
| --- | --- | --- | --- |
| Immonetz | 19 | 4 | reference implementation |
| Stäy Hub | 19 | 4 | same shape as Immonetz |
| Mayestate | 19 | 4 | list query takes no date bounds; sorting not wired |
| Eiffler | **18** | **3** | screen lives under `src/accounting`, `@acc/` aliases, plain Vite; needs `resolve.dedupe` and a widened Tailwind `content` |

Eiffler is why hub-kit's React peer is `>=18`. Do not use a React 19-only API in the kit
without checking it first.

## After changing a shared component

It is shared — a change lands in four apps at once. Build all four:

```bash
cd hub-kit && npm run check && npm run build
for r in immonetz staeyhub mayestate2 eiffler-hubv2; do (cd ../$r && npm run build) done
```

A green build is not proof the screen renders. These screens are auth-gated, so say plainly
what was verified and what was not.
