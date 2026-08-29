# Hub Kit rules

These rules apply to every file in this package. No exceptions.

## Language

1. Everything is written in pure English: file names, folder names, variables, functions,
   types, CSS classes, commit messages, docs.
2. No German words anywhere in the code. Not `beleg`, not `lieferant`, not `gesellschaft`.
   The kit says `invoice`, `supplier`, `company`.
3. German only exists in the projects that use this kit, inside their own translation
   dictionaries and URL paths. Never here.

## Naming

4. Names must explain themselves. A reader should know what a thing is without opening it.
   Good: `unpaidInvoiceCount`, `formatMoney`, `InvoiceListPage`. Bad: `cnt`, `fmt`, `data2`.
5. No abbreviations unless the whole world uses them (`id`, `url`, `html`).

## Simplicity

6. Write code a grade 6 reader could follow: small functions, one job each, plain steps,
   no clever one-liners.
7. Comments are at most one line, and only when the code cannot say it itself.
8. No dead code, no commented-out code, no "just in case" options.

## Git

12. Commit messages are one line, plain English, no body. Never mention Claude, AI, bots,
    or add any co-author trailer.
13. This kit is read-only toward the other projects: copy code in from them, never write
    into them from here.

## Boundaries

9. The kit never talks to a database. Pages and components receive data through adapter
   interfaces that each project implements.
10. The kit never hard-codes a color, a brand name, or a logo. Everything visual comes
    from theme tokens and a brand config the project supplies.
11. The kit never contains a rendered text string. It defines translation keys with
    English defaults; projects supply their own dictionaries.
