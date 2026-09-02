# Theme token contract

A theme is one CSS file that sets these variables on `:root`. Kit components only ever
use Tailwind classes backed by these tokens, never a raw color.

## Surfaces

`--background` `--foreground` `--card` `--card-foreground` `--popover`
`--popover-foreground` `--muted` `--muted-foreground` `--accent` `--accent-foreground`
`--border` `--input` `--header` `--switch-off` `--placeholder`

## Brand

`--brand` `--brand-hover` `--brand-dark` `--brand-soft` `--brand-tint` `--brand-wash`
`--brand-ink` `--primary` `--primary-foreground` `--secondary` `--secondary-foreground`
`--ring`

## Status

`--success` `--success-soft` `--warning` `--warning-soft` `--danger` `--danger-soft`
`--destructive` `--destructive-foreground`

Status color carries meaning. Green means good news, never decoration.

## Charts

`--chart-1` through `--chart-5`. Chart 1 is the brand color; 2–5 must differ in hue,
not just lightness, so neighboring series stay tellable apart.

## Sidebar

`--sidebar` `--sidebar-foreground` `--sidebar-primary` `--sidebar-primary-foreground`
`--sidebar-accent` `--sidebar-accent-foreground` `--sidebar-border` `--sidebar-ring`

## Shape and type

`--radius` `--font-sans` `--font-serif`

## How a project uses this

1. Import one preset, or write your own file setting every token above:
   `@import "@hub-kit/core/themes/default.css";`
2. Tell Tailwind v4 to scan the kit for class names, in your `styles.css`:
   `@source "../node_modules/@hub-kit/core/dist";`

## Tour tokens

The guided tour reads these variables. Each one falls back to a core token, so a project
that sets none still gets a card that matches its theme.

| Token | Falls back to | Controls |
| --- | --- | --- |
| `--tour-accent` | `--primary` | Step counter chip and the ring around the highlighted element |
| `--tour-backdrop` | `rgb(0 0 0 / 0.5)` | The dimmed area outside the highlight |
| `--tour-card-width` | `22rem` | Width of the tour card |
| `--tour-ring-gap` | `--background` | The gap between the highlighted element and its ring |
| `--tour-spotlight-radius` | `--radius` plus 4px | Corner rounding of the highlight |
