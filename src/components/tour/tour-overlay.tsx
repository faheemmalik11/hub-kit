import { useCallback, useEffect, useRef, useState } from "react";

import { Popover, PopoverAnchor, PopoverArrow, PopoverContent } from "../../ui/popover";
import { findTourTarget } from "./find-target";
import { TourCard } from "./tour-card";
import { useTour } from "./use-tour";
import type { TourStep } from "./types";

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const SPOTLIGHT_PADDING = 6;
const MOVE_DURATION = "220ms";
const CARD_GAP = 12;
const CARD_HEIGHT_FALLBACK = 240;
const MAX_CARD_WIDTH = 352;
const SCREEN_MARGIN = 32;

export function TourOverlay() {
  const tour = useTour();
  const step = tour?.step ?? null;
  const target = step?.target ?? null;
  const [rect, setRect] = useState<TargetRect | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [topObstruction, setTopObstruction] = useState(0);
  const [cardElement, setCardElement] = useState<HTMLDivElement | null>(null);
  const [cardHeight, setCardHeight] = useState(0);
  const overlayRoot = useRef<HTMLDivElement>(null);
  const skipMissingStep = useRef(() => {});
  skipMissingStep.current = tour ? tour.next : () => {};

  useEffect(() => {
    const readViewport = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    readViewport();
    window.addEventListener("resize", readViewport);
    return () => window.removeEventListener("resize", readViewport);
  }, []);

  useEffect(() => {
    if (!target) {
      setRect(null);
      return;
    }

    let frame = 0;
    const measure = () => {
      const element = findTourTarget(target);
      if (element) {
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
      }
      frame = requestAnimationFrame(measure);
    };

    let attempts = 0;
    const waitForTarget = () => {
      attempts += 1;
      if (findTourTarget(target)) {
        measure();
        return;
      }
      if (attempts > 60) {
        skipMissingStep.current();
        return;
      }
      frame = requestAnimationFrame(waitForTarget);
    };

    setRect(null);
    frame = requestAnimationFrame(waitForTarget);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  useEffect(() => {
    if (!cardElement) {
      setCardHeight(0);
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const height = Math.ceil(entries[0]?.contentRect.height ?? 0);
      setCardHeight((current) => (current === height ? current : height));
    });
    observer.observe(cardElement);
    return () => observer.disconnect();
  }, [cardElement]);

  const roomMadeFor = useRef<string | null>(null);
  useEffect(() => {
    if (!target) {
      roomMadeFor.current = null;
      return;
    }
    const neededRoom = (cardHeight || CARD_HEIGHT_FALLBACK) + CARD_GAP * 2;
    const key = `${target}:${neededRoom}:${topObstruction}`;
    if (roomMadeFor.current === key) {
      return;
    }
    const element = findTourTarget(target);
    if (!element) {
      return;
    }
    roomMadeFor.current = key;
    makeRoomForCard(element, neededRoom, topObstruction);
  }, [target, cardHeight, topObstruction]);

  useEffect(() => {
    if (!tour?.isOpen) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      setTopObstruction(stickyBarBottom(overlayRoot.current));
    });
    return () => cancelAnimationFrame(frame);
  }, [tour?.isOpen, target]);

  useEffect(() => {
    if (!tour?.isOpen) {
      return;
    }
    const insideCard = (eventTarget: EventTarget | null) =>
      eventTarget instanceof Element &&
      eventTarget.closest("[data-radix-popper-content-wrapper]") !== null;

    const blockScrollGesture = (event: Event) => {
      if (!insideCard(event.target)) {
        event.preventDefault();
      }
    };
    const scrollKeys = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);
    const blockScrollKeys = (event: KeyboardEvent) => {
      if (scrollKeys.has(event.key) && !insideCard(event.target)) {
        event.preventDefault();
      }
    };

    window.addEventListener("wheel", blockScrollGesture, { passive: false, capture: true });
    window.addEventListener("touchmove", blockScrollGesture, { passive: false, capture: true });
    window.addEventListener("keydown", blockScrollKeys, { capture: true });
    return () => {
      window.removeEventListener("wheel", blockScrollGesture, { capture: true });
      window.removeEventListener("touchmove", blockScrollGesture, { capture: true });
      window.removeEventListener("keydown", blockScrollKeys, { capture: true });
    };
  }, [tour?.isOpen]);

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

  const attachCard = useCallback((node: HTMLDivElement | null) => {
    setCardElement(node);
    const wrapper = node?.closest<HTMLElement>("[data-radix-popper-content-wrapper]");
    if (wrapper) {
      wrapper.style.zIndex = "60";
      wrapper.style.transition = `transform ${MOVE_DURATION} ease`;
    }
  }, []);

  if (!tour || !tour.isOpen || !step || !rect) {
    return null;
  }

  const side = pickSide(
    step.placement,
    rect,
    viewport,
    cardHeight || CARD_HEIGHT_FALLBACK,
    topObstruction,
  );

  return (
    <div ref={overlayRoot} className="fixed inset-0 z-50" role="presentation">
      <div
        className="absolute inset-0"
        style={{ background: "var(--tour-backdrop, rgb(0 0 0 / 0.5))" }}
        onClick={tour.skip}
      />
      <div
        className="absolute"
        onClick={tour.skip}
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
      {side === null ? (
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div
            className="pointer-events-auto w-[min(var(--tour-card-width,22rem),calc(100vw-2rem))] overflow-y-auto rounded-2xl bg-popover px-4 pt-4 pb-2.5 text-popover-foreground shadow-xl sm:px-5 sm:pt-5 sm:pb-3.5"
            style={{ maxHeight: viewport.height - topObstruction - SCREEN_MARGIN, marginTop: topObstruction }}
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
          </div>
        </div>
      ) : (
        <Popover open>
          <PopoverAnchor asChild>
            <div
              className="absolute"
              style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
            />
          </PopoverAnchor>
          <PopoverContent
            ref={attachCard}
            side={side}
            align="center"
            sideOffset={CARD_GAP}
            arrowPadding={16}
            collisionPadding={{
              top: Math.max(16, topObstruction + CARD_GAP),
              right: 16,
              bottom: 16,
              left: 16,
            }}
            className="z-[60] w-[min(var(--tour-card-width,22rem),calc(100vw-2rem))] rounded-2xl border-0 px-4 pt-4 pb-2.5 shadow-xl sm:px-5 sm:pt-5 sm:pb-3.5"
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
      )}
    </div>
  );
}

function pickSide(
  placement: TourStep["placement"],
  rect: TargetRect,
  viewport: { width: number; height: number },
  cardHeight: number,
  topObstruction: number,
): "top" | "bottom" | "left" | "right" | null {
  if (viewport.width === 0) {
    return placement ?? "bottom";
  }
  const cardWidth = Math.min(MAX_CARD_WIDTH, viewport.width - SCREEN_MARGIN);
  const need = cardHeight + CARD_GAP * 2;
  const fits = {
    top: rect.top - topObstruction >= need,
    bottom: viewport.height - (rect.top + rect.height) >= need,
    left: rect.left >= cardWidth + CARD_GAP,
    right: viewport.width - (rect.left + rect.width) >= cardWidth + CARD_GAP,
  };
  if (placement && fits[placement]) {
    return placement;
  }
  if (fits.bottom) return "bottom";
  if (fits.top) return "top";
  if (fits.right) return "right";
  if (fits.left) return "left";
  return null;
}

function makeRoomForCard(element: HTMLElement, neededRoom: number, topObstruction: number) {
  const box = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const roomAbove = box.top - topObstruction;
  const roomBelow = viewportHeight - (box.top + box.height);
  if (roomAbove >= neededRoom || roomBelow >= neededRoom) {
    return;
  }

  const container = scrollingAncestor(element);
  const fitsWithRoomBelow = box.height + neededRoom <= viewportHeight - topObstruction;
  const desiredTop = fitsWithRoomBelow
    ? viewportHeight - neededRoom - box.height
    : topObstruction + neededRoom;
  container.scrollBy({ top: box.top - desiredTop, behavior: "smooth" });
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

function stickyBarBottom(overlayRoot: HTMLElement | null): number {
  const probes = document.elementsFromPoint(window.innerWidth / 2, 4);
  for (const probe of probes) {
    if (overlayRoot && overlayRoot.contains(probe)) {
      continue;
    }
    let node: HTMLElement | null = probe as HTMLElement;
    while (node && node !== document.body) {
      const position = getComputedStyle(node).position;
      if (position === "sticky" || position === "fixed") {
        return Math.ceil(node.getBoundingClientRect().bottom);
      }
      node = node.parentElement;
    }
  }
  return 0;
}
