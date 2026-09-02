import { useEffect, useRef, useState } from "react";

import { Popover, PopoverAnchor, PopoverArrow, PopoverContent } from "../../ui/popover";
import { findTourTarget } from "./find-target";
import { TourCard } from "./tour-card";
import type { TourStep } from "./types";
import { useTour } from "./use-tour";

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const SPOTLIGHT_PADDING = 6;
const MOVE_DURATION = "220ms";
const TALL_TARGET_GAP = 0.45;
const MAX_CARD_WIDTH = 352;
const SCREEN_MARGIN = 32;
const ESTIMATED_CARD_HEIGHT = 240;
const CARD_GAP = 12;

export function TourOverlay() {
  const tour = useTour();
  const step = tour?.step ?? null;
  const target = step?.target ?? null;
  const [rect, setRect] = useState<TargetRect | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const readViewport = () =>
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    readViewport();
    window.addEventListener("resize", readViewport);
    return () => window.removeEventListener("resize", readViewport);
  }, []);

  const cardRef = useRef<HTMLDivElement>(null);
  const skipMissingStep = useRef(() => {});
  skipMissingStep.current = tour ? tour.next : () => {};

  useEffect(() => {
    if (!target) {
      setRect(null);
      return;
    }

    let stopMeasuring: (() => void) | undefined;

    const watch = (element: HTMLElement) => {
      if (element.getBoundingClientRect().height > window.innerHeight * 0.6) {
        revealTallTarget(element);
      } else {
        element.scrollIntoView({ block: "center", behavior: "smooth" });
      }

      let frame = 0;
      const measure = () => {
        const box = element.getBoundingClientRect();
        setRect((current) =>
          current &&
          current.top === box.top &&
          current.left === box.left &&
          current.width === box.width &&
          current.height === box.height
            ? current
            : { top: box.top, left: box.left, width: box.width, height: box.height },
        );
        frame = requestAnimationFrame(measure);
      };
      measure();
      stopMeasuring = () => cancelAnimationFrame(frame);
    };

    const element = findTourTarget(target);
    if (element) {
      watch(element);
      return () => stopMeasuring?.();
    }

    setRect(null);
    const frame = requestAnimationFrame(() => {
      const lateElement = findTourTarget(target);
      if (lateElement) {
        watch(lateElement);
      } else {
        skipMissingStep.current();
      }
    });
    return () => {
      cancelAnimationFrame(frame);
      stopMeasuring?.();
    };
  }, [target]);

  useEffect(() => {
    const wrapper = cardRef.current?.closest<HTMLElement>("[data-radix-popper-content-wrapper]");
    if (wrapper) {
      wrapper.style.transition = `transform ${MOVE_DURATION} ease`;
    }
  }, [target]);

  useEffect(() => {
    if (!tour?.isOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        tour.skip();
      } else if (event.key === "ArrowRight") {
        tour.next();
      } else if (event.key === "ArrowLeft") {
        tour.back();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [tour]);

  if (!tour || !tour.isOpen || !step || !rect) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <div
        className="absolute inset-0"
        style={{ background: "var(--tour-backdrop, rgb(0 0 0 / 0.5))" }}
      />
      <div
        className="absolute"
        style={{
          top: rect.top - SPOTLIGHT_PADDING,
          left: rect.left - SPOTLIGHT_PADDING,
          width: rect.width + SPOTLIGHT_PADDING * 2,
          height: rect.height + SPOTLIGHT_PADDING * 2,
          borderRadius: "var(--tour-spotlight-radius, calc(var(--radius) + 4px))",
          transition: `top ${MOVE_DURATION} ease, left ${MOVE_DURATION} ease, width ${MOVE_DURATION} ease, height ${MOVE_DURATION} ease`,
          boxShadow: [
            "0 0 0 3px var(--tour-ring-gap, var(--background))",
            "0 0 0 5px var(--tour-accent, var(--primary))",
          ].join(", "),
        }}
      />
      <Popover open>
        <PopoverAnchor asChild>
          <div
            className="absolute"
            style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
          />
        </PopoverAnchor>
        <PopoverContent
          ref={cardRef}
          side={sideForScreen(step.placement, rect, viewport)}
          align="center"
          sideOffset={12}
          arrowPadding={16}
          collisionPadding={16}
          className="w-[min(var(--tour-card-width,22rem),calc(100vw-2rem))] rounded-2xl border-0 px-4 pt-4 pb-2.5 shadow-xl sm:px-5 sm:pt-5 sm:pb-3.5"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          aria-label={tour.labels.cardTitle}
        >
          <TourCard
            step={step}
            stepIndex={tour.stepIndex}
            stepCount={tour.stepCount}
            labels={tour.labels}
            onNext={tour.next}
            onSkip={tour.skip}
          />
          <PopoverArrow width={18} height={9} style={{ fill: "var(--popover)" }} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function sideForScreen(
  placement: TourStep["placement"],
  rect: TargetRect,
  viewport: { width: number; height: number },
): "top" | "bottom" | "left" | "right" {
  if (viewport.width === 0) {
    return placement ?? "bottom";
  }

  const cardWidth = Math.min(MAX_CARD_WIDTH, viewport.width - SCREEN_MARGIN);
  const space = {
    top: rect.top,
    bottom: viewport.height - (rect.top + rect.height),
    left: rect.left,
    right: viewport.width - (rect.left + rect.width),
  };
  const fits = {
    top: space.top >= ESTIMATED_CARD_HEIGHT + CARD_GAP,
    bottom: space.bottom >= ESTIMATED_CARD_HEIGHT + CARD_GAP,
    left: space.left >= cardWidth + CARD_GAP,
    right: space.right >= cardWidth + CARD_GAP,
  };

  if (placement && fits[placement]) {
    return placement;
  }
  if (fits.bottom) return "bottom";
  if (fits.top) return "top";
  if (fits.right) return "right";
  if (fits.left) return "left";
  return space.bottom >= space.top ? "bottom" : "top";
}

function scrollingAncestor(element: HTMLElement): HTMLElement {
  let node = element.parentElement;
  while (node) {
    const overflowY = getComputedStyle(node).overflowY;
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
}

function revealTallTarget(element: HTMLElement) {
  const container = scrollingAncestor(element);
  const isPageScroll = container === document.scrollingElement || container === document.documentElement;
  const containerTop = isPageScroll ? 0 : container.getBoundingClientRect().top;
  const gapAbove = window.innerHeight * TALL_TARGET_GAP;
  const delta = element.getBoundingClientRect().top - containerTop - gapAbove;
  container.scrollBy({ top: delta, behavior: "smooth" });
}
