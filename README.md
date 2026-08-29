# Hub Kit

One package that powers every Hub project. Pages, components and the theme system live
here; each project supplies its data adapters, its dictionary, and one theme file.

Rules for working in this repo: see `CLAUDE.md`. The full plan: see `PLAN.md`.

## Install in a project

```bash
npm install @wt/hub-kit
```

In the project's `styles.css`:

```css
@import "@wt/hub-kit/themes/staey.css";
@source "../node_modules/@wt/hub-kit/dist";
```

## Use a component

```tsx
import { QueueKpiRow } from "@wt/hub-kit/invoice-queue";
import { NotificationBell, AlertList } from "@wt/hub-kit/notifications";
import { Button, Table } from "@wt/hub-kit/ui";
```

## Use a page

A page needs one adapter the project implements, and takes optional labels for
translation. English works out of the box.

```tsx
import { ProcessingLogPage } from "@wt/hub-kit/pages";
import { processingLogAdapter } from "../adapters/processing-log";

export function ActivityLog() {
  return <ProcessingLogPage adapter={processingLogAdapter} />;
}
```

The adapter interfaces are in `@wt/hub-kit/adapters`. Query hooks return a plain
`QueryResult` shape, so the project implements them with React Query and Supabase;
mutations are plain functions returning promises, so the project wraps its own writes
and cache invalidation.

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
