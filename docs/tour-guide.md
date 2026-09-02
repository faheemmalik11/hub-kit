# Tour guide

How to add a guided tour to any page in any project. The kit ships the engine; the project
writes the tour as plain data in its own language.

---

## 1. What a tour is

A tour is a list of steps. Each step points at one element on screen, dims everything else,
and shows a card with a step counter, a title, your content and Skip / Next buttons.

A tour opens by itself the first time a user lands on the page. Once the user skips it or
finishes it, it never opens by itself again. The Tour button in the header always reopens it.

---

## 2. Install and wrap once

```bash
npm install git+ssh://git@github.com/faheemmalik11/hub-kit.git#master
```

Wrap the app where the Shell is rendered. This is the only wiring step:

```tsx
import { TourProvider, TourButton } from "@wt/hub-kit/tour";

import { overviewTour, customerTour } from "./tours";

<TourProvider
  tours={{
    "/overview": overviewTour,
    "/customers": customerTour,
  }}
>
  <Shell headerActions={<TourButton />} ...rest />
</TourProvider>
```

The keys are the project's own route paths, exactly as they appear in the address bar.
A page with no entry shows no Tour button. The provider draws the overlay itself, so there
is nothing else to render.

---

## 3. Mark the elements a tour can point at

Every step points at an element carrying a `data-tour` attribute.

On the project's own pages, add the attribute to any element:

```tsx
<section data-tour="my-kpi-row">...</section>
<Button data-tour="my-export-button">Export</Button>
```

Names are free text. Keep them short and stable.

On kit pages the anchors already exist. The Overview page offers:

| Target name | Points at |
| --- | --- |
| `overview-money-cards` | The row of money cards at the top |
| `overview-trend-chart` | The incoming and outgoing trend chart |
| `overview-stages` | The pipeline stages panel |
| `overview-top-suppliers` | The top suppliers ranked list |
| `overview-processing` | The processing summary panel |
| `overview-spend-by-company` | The spend by company ranked list |
| `overview-open-items` | The open items panel |
| `overview-bank` | The bank summary panel |

Other kit pages gain anchors as tours are added to them.

---

## 4. Write the tour

One object per page. Pure data, so it can live in a `.ts` file, or later come from a
database.

```ts
import type { TourDefinition } from "@wt/hub-kit/tour";

export const overviewTour: TourDefinition = {
  id: "overview",
  steps: [
    {
      target: "overview-money-cards",
      title: "Your figures at a glance",
      content: [{ kind: "paragraph", text: "Incoming and outgoing invoices for the period." }],
      showPlaceholderData: true,
    },
    {
      target: "overview-trend-chart",
      title: "How the month is going",
      content: [
        { kind: "paragraph", text: "Compares money in against money out." },
        { kind: "link", href: "https://example.com/handbook", label: "Read more", newTab: true },
      ],
      placement: "left",
    },
  ],
};
```

### Step fields

| Field | Required | Meaning |
| --- | --- | --- |
| `target` | yes | The `data-tour` name of the element to point at |
| `title` | yes | Card heading |
| `content` | yes | The blocks below, shown in array order |
| `placement` | no | `top`, `bottom`, `left` or `right`. Defaults to `bottom` and flips if it would run off screen |
| `showPlaceholderData` | no | Fill an empty page with sample values while this step is open |

### Tour fields

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | yes | Stable name. Used to remember that the user has seen this tour |
| `steps` | yes | The list of steps, in order |
| `autoStart` | no | Set `false` so the tour only ever opens from the button |

---

## 5. Content blocks

The card is built from typed blocks. Order in the array is order on the card. There is no
limit on how many blocks a step has.

```ts
{ kind: "paragraph", text: "Plain sentence." }
{ kind: "list", items: ["First point", "Second point"] }
{ kind: "image", src: "/tour/customers.png", alt: "Customer list" }
{ kind: "video", src: "/tour/search.mp4", caption: "Searching by postcode" }
{ kind: "link", href: "https://example.com", label: "Read the handbook", newTab: true }
{ kind: "keyValueList", pairs: [{ label: "Shortcut", value: "Ctrl + K" }] }
{ kind: "callout", tone: "info", text: "Search also matches partial words." }
```

`tone` is `info` or `warning`.

Images and videos are project files. Put them in the project's `public` folder and use a
path from the site root. The kit ships no images.

Styling is not part of the data. The card takes its colors, radius and font from the
project's theme, so every tour in every project looks the same.

---

## 6. How many steps

As many as the page deserves. The counter, the Back button and the final Done button all
follow the length of the array by themselves.

Every targeted element must be on screen when the tour runs. If a page hides a widget
behind a setting, do not write a step for it.

---

## 7. Placeholder data

A new user often lands on an empty page, which makes a tour hard to follow. Marking a step
with `showPlaceholderData: true` fills the page with obviously fake sample values while
that step is open, and a "Sample data" chip appears so nobody mistakes it for real numbers.

Real data is never written or changed. Sample values come from a separate read-only
adapter, and they only appear when the real data is empty. If the page has real data, the
tour points at the real data.

This works out of the box on the kit's Overview page. The sample wording is English by
default and the sample money is written with the project's own formatter. To put the sample
rows in another language, build the adapter with your own words and pass it in:

```tsx
import { createPlaceholderOverviewAdapter } from "@wt/hub-kit/lib";

const germanSamples = createPlaceholderOverviewAdapter(
  {
    stages: ["Eingang", "Zu prüfen", "Freigegeben"],
    suppliers: ["Beispiellieferant eins", "Beispiellieferant zwei", "Beispiellieferant drei"],
    companies: ["Beispielfirma Nord", "Beispielfirma Süd"],
    channels: ["E-Mail", "Upload"],
    trendPoints: ["Woche 1", "Woche 2", "Woche 3", "Woche 4"],
    openItems: ["Diese Woche fällig", "Überfällig"],
    bank: ["Nicht zugeordnete Buchungen"],
  },
  formatMoney,
);

<OverviewPage adapter={adapter} placeholderAdapter={germanSamples} ...rest />
```

On a project's own page, do the swap in the page itself:

```tsx
import { useTourPlaceholderData } from "@wt/hub-kit/tour";

function MyOverviewPage() {
  const wantsSampleData = useTourPlaceholderData();
  const real = useMyRealData();
  const rows = wantsSampleData && real.rows.length === 0 ? MY_SAMPLE_ROWS : real.rows;
  return <MyChart rows={rows} />;
}
```

---

## 8. Translating the buttons

The card's own words default to English. Pass a dictionary to translate them:

```tsx
<TourProvider tours={tours} labels={germanTourLabels}>
```

```ts
import type { TourLabels } from "@wt/hub-kit/tour";

export const germanTourLabels: TourLabels = {
  openTour: "Tour",
  stepCounter: (current, total) => `${current} von ${total}`,
  next: "Weiter",
  skip: "Tour überspringen",
  finish: "Fertig",
  sampleData: "Beispieldaten",
  cardTitle: "Geführte Tour",
};
```

Step titles and content are already the project's own text, so they need no dictionary.

---

## 9. Theme

The card follows the project's theme with no setup. To tune the tour on its own, set any of
these in the project's CSS. Each falls back to a normal theme token.

| Variable | Falls back to | Controls |
| --- | --- | --- |
| `--tour-accent` | `--primary` | Counter chip and the ring around the highlighted element |
| `--tour-backdrop` | `rgb(0 0 0 / 0.5)` | The dimmed area |
| `--tour-card-width` | `22rem` | Card width |

```css
:root {
  --tour-accent: var(--brand-dark);
  --tour-card-width: 26rem;
}
```

---

## 10. Testing a tour

The kit remembers finished tours in the browser under `hub-kit.tour.seen`. To watch the
first-visit behaviour again:

```ts
import { resetSeenTours } from "@wt/hub-kit/tour";

resetSeenTours();
```

Then reload the page.

Keyboard: `Esc` closes the tour, the right arrow goes forward, the left arrow goes back to
the previous step.

---

## 11. Checklist for a new page

1. Add `data-tour` attributes, or pick names from the table in section 3.
2. Write one `TourDefinition` with a stable `id`.
3. Add one line to the `tours` map with the page's route path.
4. Reload and check every step points at something.
