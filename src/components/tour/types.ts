export type TourContentBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "image"; src: string; alt: string }
  | { kind: "video"; src: string; caption?: string }
  | { kind: "link"; href: string; label: string; newTab?: boolean }
  | { kind: "keyValueList"; pairs: { label: string; value: string }[] }
  | { kind: "callout"; tone: "info" | "warning"; text: string };

export type TourPlacement = "top" | "bottom" | "left" | "right";

export interface TourStep {
  target: string;
  title: string;
  content: TourContentBlock[];
  placement?: TourPlacement;
  showPlaceholderData?: boolean;
}

export interface TourDefinition {
  id: string;
  steps: TourStep[];
  autoStart?: boolean;
}

export type TourMap = Record<string, TourDefinition>;
