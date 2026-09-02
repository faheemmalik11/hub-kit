# Hub Kit

One package that powers every Hub project. Pages, components and the theme system live
here; each project supplies its data adapters, its dictionary, and one theme file.

Rules for working in this repo: see `CLAUDE.md`. The full plan: see `docs/plan.md`.

## Install in a project

```bash
npm install @hub-kit/core
```

In the project's `styles.css`:

```css
@import "@hub-kit/core/themes/default.css";
@source "../node_modules/@hub-kit/core/dist";
```

## Use a component

```tsx
import { QueueKpiRow } from "@hub-kit/core/invoice-queue";
import { NotificationBell, AlertList } from "@hub-kit/core/notifications";
import { Button, Table } from "@hub-kit/core/ui";
```

## Use a page

A page needs one adapter the project implements, and takes optional labels for
translation. English works out of the box.

```tsx
import { ProcessingLogPage } from "@hub-kit/core/pages";
import { processingLogAdapter } from "../adapters/processing-log";

export function ActivityLog() {
  return <ProcessingLogPage adapter={processingLogAdapter} />;
}
```

The adapter interfaces are in `hub-kit/adapters`. Query hooks return a plain
`QueryResult` shape, so the project implements them with React Query and Supabase;
mutations are plain functions returning promises, so the project wraps its own writes
and cache invalidation.

## Set up a new project

```bash
npx hub-kit init
```

This creates `hub.config.mjs`, `src/hub/registry.tsx` and a starter adapter, then prints
the two CSS lines to add. Nothing is overwritten if the files already exist.

## Add a guided tour

Tours are plain data the project owns. One object per page, keyed by the project's own
route path:

```tsx
import { TourProvider, TourButton, type TourDefinition } from "@hub-kit/core/tour";

const overviewTour: TourDefinition = {
  id: "overview",
  steps: [
    {
      target: "overview-money-cards",
      title: "Your figures at a glance",
      content: [{ kind: "paragraph", text: "Incoming and outgoing invoices for the period." }],
      showPlaceholderData: true,
    },
  ],
};

<TourProvider tours={{ "/overview": overviewTour }}>
  <Shell headerActions={<TourButton />} ...rest />
</TourProvider>
```

A tour opens by itself the first time a user lands on the page. Once it is skipped or
finished it never opens by itself again; the Tour button always reopens it. Pages with no
tour show no button. Target names are listed in `docs/tour-guide.md`.

Steps carry typed content blocks: `paragraph`, `list`, `image`, `video`, `link`,
`keyValueList` and `callout`. The array order is the order on the card. Styling comes from
the theme, so a project supplies content only.

A step with `showPlaceholderData` fills an empty page with sample values while the tour is
open. Sample values come from a separate read-only adapter, so real data is never read
through or written to.

Full instructions, including the target names each kit page offers: `docs/tour-guide.md`.

## Generate route files

`hub.config.mjs` in the project root names the enabled pages:

```js
export default {
  registryImport: "@/hub/registry",
  pages: [
    { component: "TeamPage", path: "/team" },
    { component: "NotificationsPage", path: "/benachrichtigungen" },
    { component: "ActivityLogPage", path: "/protokoll" },
  ],
};
```

Then:

```bash
npx hub-kit sync
```

This writes one thin route file per page. The project's `src/hub/registry.tsx` binds
each kit page to its adapters and dictionary once.

## Build this package

```bash
npm run build   # compiles src/ to dist/ with type declarations
npm run check   # type check only
```
