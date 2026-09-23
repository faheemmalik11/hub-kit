import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Search,
} from "lucide-react";

import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "../lib/class-names";

export interface TreePickerNode {
  value: string;
  label: string;
  children?: TreePickerNode[];
  /**
   * Whether this node can be opened, when that is not the same as "children are already here".
   *
   * A tree read one level at a time knows a folder HAS children long before it has fetched them,
   * and a folder with none must not offer a chevron that opens onto nothing. Left undefined the
   * answer is the old one: a node opens when children are loaded, which is what every host that
   * hands over a whole tree still means.
   */
  hasChildren?: boolean;
  /** Children are on their way. Shows a quiet note under the row rather than an empty branch. */
  loadingChildren?: boolean;
}

export interface TreePickerProps {
  nodes: TreePickerNode[];
  values: string[];
  onChange: (values: string[]) => void;
  multi: boolean;
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** The row that clears a single selection, offered at the top of the list. */
  noneText?: string;
  selectedCountText?: (count: number) => string;
  disabled?: boolean;
  className?: string;
  /**
   * Called the first time a node is opened, for a host that fetches children on demand.
   *
   * Optional, and absent for every host that passes a finished tree: without it the picker behaves
   * exactly as before. A host that supplies it is expected to answer by handing back `nodes` with
   * that node's `children` filled in.
   */
  onExpand?: (value: string) => void;
  /** Said under a branch whose children are still loading. */
  loadingText?: string;
}

export function TreePicker({
  nodes,
  values,
  onChange,
  multi,
  placeholder,
  searchPlaceholder,
  emptyText,
  noneText,
  selectedCountText = (count) => `${count} selected`,
  disabled,
  className,
  onExpand,
  loadingText,
}: TreePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() =>
    expandedForSelection(nodes, values),
  );

  const labelByValue = useMemo(() => {
    const labels = new Map<string, string>();
    const walk = (list: TreePickerNode[]) => {
      for (const node of list) {
        labels.set(node.value, node.label);
        walk(node.children ?? []);
      }
    };
    walk(nodes);
    return labels;
  }, [nodes]);

  const triggerLabel =
    values.length === 0
      ? placeholder
      : values.length === 1
        ? (labelByValue.get(values[0]) ?? values[0])
        : selectedCountText(values.length);

  const searching = query.trim().length > 0;
  const visibleRows = useMemo(
    () =>
      searching
        ? searchRows(nodes, query.trim().toLowerCase())
        : treeRows(nodes, expanded),
    [nodes, expanded, searching, query],
  );

  const toggleExpand = (row: TreeRow) => {
    const { value } = row.node;
    // Asked only on the way OPEN, and only while nothing is there yet: a branch already fetched
    // must not be re-read every time somebody folds and unfolds it.
    if (
      !expanded.has(value) &&
      onExpand &&
      (row.node.children ?? []).length === 0
    ) {
      onExpand(value);
    }
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const toggleSelect = (value: string) => {
    if (multi) {
      onChange(
        values.includes(value)
          ? values.filter((id) => id !== value)
          : [...values, value],
      );
      return;
    }
    onChange(values.includes(value) ? [] : [value]);
    setOpen(false);
  };

  return (
    <Popover
      modal
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setQuery("");
          setExpanded(expandedForSelection(nodes, values));
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-auto min-h-9 w-full cursor-pointer justify-between whitespace-normal px-3 py-2 text-left font-normal",
            values.length === 0 && "text-muted-foreground",
            className,
          )}
        >
          <span className="min-w-0 truncate">{triggerLabel}</span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder ?? "Search …"}
            className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {/* Always offered, not only once something is picked: "no folder" is a choice somebody
              can see and take, rather than a state reached by clicking the chosen row again. */}
          {!multi && noneText && (
            <button
              type="button"
              onClick={() => {
                onChange([]);
                setOpen(false);
              }}
              className="mb-0.5 w-full cursor-pointer rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent"
            >
              {noneText}
            </button>
          )}
          {visibleRows.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              {emptyText ?? "No match found."}
            </p>
          )}
          {visibleRows.map((row) => {
            const isSelected = values.includes(row.node.value);
            // An opened branch with nothing under it yet says so, rather than reading as a folder
            // that turned out to be empty.
            const waiting =
              row.isExpanded &&
              row.node.loadingChildren === true &&
              (row.node.children ?? []).length === 0;
            return (
              <div key={row.node.value}>
                <div
                  className="flex cursor-pointer items-center rounded-md text-sm hover:bg-accent"
                  onClick={() => toggleSelect(row.node.value)}
                >
                  {row.depth > 0 && (
                    <span
                      aria-hidden="true"
                      className="self-stretch shrink-0"
                      style={{
                        width: row.depth * 16,
                        backgroundImage:
                          "repeating-linear-gradient(to right, transparent 0, transparent 7px, var(--border) 7px, var(--border) 8px, transparent 8px, transparent 16px)",
                      }}
                    />
                  )}
                  {row.hasChildren && !searching ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleExpand(row);
                      }}
                      className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {row.isExpanded ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                    </button>
                  ) : (
                    <span className="size-6 shrink-0" />
                  )}
                  <span
                    className={cn(
                      "mr-2 flex size-4 shrink-0 items-center justify-center rounded-[4px] border",
                      isSelected
                        ? "border-brand bg-brand text-primary-foreground"
                        : "border-input bg-background",
                    )}
                  >
                    {isSelected && <Check className="size-3" />}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate py-1.5 pr-2",
                      isSelected && "font-medium",
                    )}
                  >
                    {row.node.label}
                  </span>
                </div>
                {waiting && (
                  <p
                    className="py-1 text-sm text-muted-foreground"
                    style={{ paddingLeft: (row.depth + 1) * 16 + 24 }}
                  >
                    {loadingText ?? "Loading …"}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface TreeRow {
  node: TreePickerNode;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
}

function treeRows(
  nodes: TreePickerNode[],
  expanded: Set<string>,
  depth = 0,
): TreeRow[] {
  return nodes.flatMap((node) => {
    const children = node.children ?? [];
    const isExpanded = expanded.has(node.value);
    const row: TreeRow = {
      node,
      depth,
      // `hasChildren` when the host said so, otherwise the old rule. A lazily read tree knows a
      // folder opens before its children exist, and would otherwise show no chevron to open it.
      hasChildren: node.hasChildren ?? children.length > 0,
      isExpanded,
    };
    return isExpanded
      ? [row, ...treeRows(children, expanded, depth + 1)]
      : [row];
  });
}

function searchRows(
  nodes: TreePickerNode[],
  query: string,
  depth = 0,
): TreeRow[] {
  return nodes.flatMap((node) => {
    const children = searchRows(node.children ?? [], query, depth + 1);
    const matches = node.label.toLowerCase().includes(query);
    if (!matches && children.length === 0) {
      return [];
    }
    const row: TreeRow = { node, depth, hasChildren: false, isExpanded: true };
    return matches || children.length > 0 ? [row, ...children] : children;
  });
}

function expandedForSelection(
  nodes: TreePickerNode[],
  values: string[],
): Set<string> {
  const expanded = new Set<string>();
  const walk = (list: TreePickerNode[], ancestors: string[]): void => {
    for (const node of list) {
      if (values.includes(node.value)) {
        for (const ancestor of ancestors) {
          expanded.add(ancestor);
        }
      }
      walk(node.children ?? [], [...ancestors, node.value]);
    }
  };
  walk(nodes, []);
  return expanded;
}
