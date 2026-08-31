import { isShellGroup, type Crumb, type ShellNavEntry, type ShellNavLink } from "./types";

export function buildCrumbs({
  nav,
  pathname,
  homeLabel,
  staticLeafLabels = {},
}: {
  nav: ShellNavEntry[];
  pathname: string;
  homeLabel: string;
  staticLeafLabels?: Record<string, string>;
}): Crumb[] {
  if (pathname === "/") return [{ label: homeLabel }];

  const segments = pathname.split("/").filter(Boolean);
  const base = `/${segments[0]}`;
  const crumbs: Crumb[] = [{ label: homeLabel, to: "/" }];

  let page: ShellNavLink | undefined;
  for (const entry of nav) {
    if (isShellGroup(entry)) {
      const child = entry.items.find((c) => c.to === base);
      if (child) {
        crumbs.push({ label: entry.label, to: entry.items[0]?.to });
        page = child;
        break;
      }
    } else if (entry.to === base && entry.to !== "/") {
      page = entry;
      break;
    }
  }

  const isLeafPage = segments.length === 1;
  if (page) {
    crumbs.push({ label: page.label, to: isLeafPage ? undefined : page.to });
  } else {
    crumbs.push({
      label: staticLeafLabels[segments[0]] ?? segments[0],
      to: isLeafPage ? undefined : base,
    });
  }

  if (!isLeafPage) {
    const leaf = segments[segments.length - 1];
    crumbs.push({ label: staticLeafLabels[leaf] ?? decodeURIComponent(leaf) });
  }

  return crumbs;
}
