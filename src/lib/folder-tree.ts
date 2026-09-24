import { useCallback, useMemo, useRef, useState } from "react";

import type { FieldOption } from "../adapters/document-sources";

export interface FolderLevelItem {
  id: string;
  name: string;
  path?: string;
  hasChildren?: boolean;
}

export interface FolderTree {
  options: FieldOption[];
  loading: boolean;
  error: boolean | string;
  onExpandOption: (value: string) => void;
  refresh: () => Promise<void>;
  loaded: Set<string>;
}

export function useFolderTree(read: {
  level: (parentId: string | null) => Promise<FolderLevelItem[]>;
  enabled?: boolean;
}): FolderTree {
  const { level, enabled = true } = read;
  const [levels, setLevels] = useState<Record<string, FolderLevelItem[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<boolean | string>(false);
  const [opening, setOpening] = useState<Set<string>>(new Set());
  const asked = useRef(new Set<string>());
  const started = useRef(false);

  const readLevel = useCallback(
    async (parentId: string | null) => {
      const key = parentId ?? "";
      if (asked.current.has(key)) return;
      asked.current.add(key);
      if (parentId === null) setLoading(true);
      else setOpening((held) => new Set(held).add(parentId));
      try {
        const found = await level(parentId);
        setLevels((held) => ({ ...held, [key]: found }));
        if (parentId === null) setError(false);
      } catch (cause) {
        if (parentId === null) {
          setError(cause instanceof Error ? cause.message : true);
        }
        asked.current.delete(key);
      } finally {
        if (parentId === null) setLoading(false);
        else {
          setOpening((held) => {
            const rest = new Set(held);
            rest.delete(parentId);
            return rest;
          });
        }
      }
    },
    [level],
  );

  if (enabled && !started.current) {
    started.current = true;
    void readLevel(null);
  }

  const options = useMemo(() => {
    const build = (parentId: string | null): FieldOption[] =>
      (levels[parentId ?? ""] ?? []).map((one) => {
        const children = build(one.id);
        const read = Object.prototype.hasOwnProperty.call(levels, one.id);
        return {
          value: one.id,
          label: one.name,
          ...(one.path && one.path !== one.name ? { chipLabel: one.path } : {}),
          children,
          hasChildren: one.hasChildren ?? (read ? children.length > 0 : true),
          loadingChildren: opening.has(one.id),
        };
      });
    return build(null);
  }, [levels, opening]);

  const onExpandOption = useCallback(
    (value: string) => void readLevel(value),
    [readLevel],
  );

  const refresh = useCallback(async () => {
    asked.current = new Set();
    setLevels({});
    await readLevel(null);
  }, [readLevel]);

  return {
    options,
    loading,
    error,
    onExpandOption,
    refresh,
    loaded: new Set(Object.keys(levels).filter((key) => key !== "")),
  };
}
