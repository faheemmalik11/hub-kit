# Tour targets

Every element a tour can point at carries a `data-tour` attribute. Use the name in the
`target` field of a tour step. Projects can add their own attributes on their own pages.

## Overview page

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

## Adding a target on your own page

```tsx
<Button data-tour="export-button">Export</Button>
```

Then use `target: "export-button"` in a step.
