import type { LucideIcon } from "lucide-react";

export type ShellNavLink = {
  key: string;
  label: string;
  to: string;
  icon: LucideIcon;
};

export type ShellNavGroup = {
  key: string;
  label: string;
  icon: LucideIcon;
  items: ShellNavLink[];
};

export type ShellNavEntry = ShellNavLink | ShellNavGroup;

export function isShellGroup(entry: ShellNavEntry): entry is ShellNavGroup {
  return "items" in entry;
}

export type ShellBadge = { count: number; title?: string };

export type Crumb = { label: string; to?: string };
