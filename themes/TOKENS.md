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
   `@import "@wt/hub-kit/themes/staey.css";`
2. Tell Tailwind v4 to scan the kit for class names, in your `styles.css`:
   `@source "../node_modules/@wt/hub-kit/dist";`
