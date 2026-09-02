import { Info, TriangleAlert } from "lucide-react";

import type { TourContentBlock } from "./types";

export function TourBlock({ block }: { block: TourContentBlock }) {
  switch (block.kind) {
    case "paragraph":
      return <p className="text-sm text-muted-foreground">{block.text}</p>;
    case "list":
      return (
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "image":
      return (
        <img
          src={block.src}
          alt={block.alt}
          className="max-h-40 w-full rounded-md border object-cover"
        />
      );
    case "video":
      return (
        <figure className="space-y-1">
          <video src={block.src} controls className="w-full rounded-md border" />
          {block.caption && (
            <figcaption className="text-xs text-muted-foreground">{block.caption}</figcaption>
          )}
        </figure>
      );
    case "link":
      return (
        <a
          href={block.href}
          target={block.newTab ? "_blank" : undefined}
          rel={block.newTab ? "noreferrer" : undefined}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {block.label}
        </a>
      );
    case "keyValueList":
      return (
        <dl className="space-y-1 text-sm">
          {block.pairs.map((pair) => (
            <div key={pair.label} className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{pair.label}</dt>
              <dd className="font-medium">{pair.value}</dd>
            </div>
          ))}
        </dl>
      );
    case "callout":
      return <TourCallout tone={block.tone} text={block.text} />;
  }
}

function TourCallout({ tone, text }: { tone: "info" | "warning"; text: string }) {
  const isWarning = tone === "warning";
  const Icon = isWarning ? TriangleAlert : Info;
  return (
    <div
      className={
        isWarning
          ? "flex gap-2 rounded-md bg-[var(--warning-soft)] p-2 text-sm text-[var(--warning)]"
          : "flex gap-2 rounded-md bg-accent p-2 text-sm text-accent-foreground"
      }
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}
