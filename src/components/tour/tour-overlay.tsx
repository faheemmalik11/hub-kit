import { useCallback, useEffect, useRef, useState } from "react";

import { Popover, PopoverAnchor, PopoverArrow, PopoverContent } from "../../ui/popover";
import {
  SPOTLIGHT_CARD_GAP,
  SPOTLIGHT_CARD_HEIGHT_FALLBACK,
  SPOTLIGHT_SCREEN_EDGE,
  initialSpotlightVisibleArea,
  isInsideSpotlightCard,
  makeRoomForSpotlightCard,
  pickSpotlightPlacement,
  readSpotlightVisibleArea,
  spotlightBandLeftForTarget,
  spotlightBox,
  spotlightCardCanScroll,
  spotlightDockedCardStyle,
  spotlightObstructionInside,
  stickyBarBottomAboveSpotlight,
  type SpotlightTargetRect,
  type SpotlightVisibleArea,
} from "../../lib/spotlight-placement";
import { findTourTarget } from "./find-target";
import { TourCard } from "./tour-card";
import { useTour } from "./use-tour";

const MOVE_DURATION = "220ms";

export function TourOverlay() {
  const tour = useTour();
  const step = tour?.step ?? null;
  const target = step?.target ?? null;
  const [rect, setRect] = useState<SpotlightTargetRect | null>(null);
  const [visibleArea, setVisibleArea] = useState<SpotlightVisibleArea>(initialSpotlightVisibleArea);
  const [topObstruction, setTopObstruction] = useState(0);
  const [cardElement, setCardElement] = useState<HTMLDivElement | null>(null);
  const [cardHeight, setCardHeight] = useState(0);
  const overlayRoot = useRef<HTMLDivElement>(null);
  const skipMissingStep = useRef(() => {});
  skipMissingStep.current = tour ? tour.next : () => {};

  useEffect(() => {
    const updateVisibleArea = () => setVisibleArea(readSpotlightVisibleArea());
    updateVisibleArea();
    window.addEventListener("resize", updateVisibleArea);
    window.visualViewport?.addEventListener("resize", updateVisibleArea);
    window.visualViewport?.addEventListener("scroll", updateVisibleArea);
    return () => {
      window.removeEventListener("resize", updateVisibleArea);
      window.visualViewport?.removeEventListener("resize", updateVisibleArea);
      window.visualViewport?.removeEventListener("scroll", updateVisibleArea);
    };
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
      const element = findTourTarget(target);
      if (element) {
        const box = element.getBoundingClientRect();
        const area = readSpotlightVisibleArea();
        const offScreenVertically = box.top < area.top || box.bottom > area.top + area.height;
        const offScreenSideways = box.left < area.left - 1 || box.right > area.left + area.width + 1;
        if (offScreenVertically || offScreenSideways) {
          element.scrollIntoView({
            behavior: "smooth",
            block: offScreenVertically ? "center" : "nearest",
            inline: offScreenSideways ? "start" : "nearest",
          });
        }
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
    const observer = new ResizeObserver(() => {
      const height = cardElement.offsetHeight;
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
    const neededRoom = (cardHeight || SPOTLIGHT_CARD_HEIGHT_FALLBACK) + SPOTLIGHT_CARD_GAP * 2;
    const key = `${target}:${neededRoom}:${topObstruction}`;
    if (roomMadeFor.current === key) {
      return;
    }
    const element = findTourTarget(target);
    if (!element) {
      return;
    }
    roomMadeFor.current = key;
    makeRoomForSpotlightCard(element, neededRoom, topObstruction);
  }, [target, cardHeight, topObstruction]);

  useEffect(() => {
    if (!tour?.isOpen) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      setTopObstruction(stickyBarBottomAboveSpotlight(overlayRoot.current));
    });
    return () => cancelAnimationFrame(frame);
  }, [tour?.isOpen, target]);

  useEffect(() => {
    if (!tour?.isOpen) {
      return;
    }
    let lastTouchY = 0;
    const rememberTouch = (event: TouchEvent) => {
      lastTouchY = event.touches[0]?.clientY ?? 0;
    };
    const blockWheel = (event: WheelEvent) => {
      if (!spotlightCardCanScroll(event.target, event.deltaY)) {
        event.preventDefault();
      }
    };
    const blockTouchMove = (event: TouchEvent) => {
      const touchY = event.touches[0]?.clientY ?? lastTouchY;
      const deltaY = lastTouchY - touchY;
      lastTouchY = touchY;
      if (!spotlightCardCanScroll(event.target, deltaY)) {
        event.preventDefault();
      }
    };
    const scrollKeys = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);
    const blockScrollKeys = (event: KeyboardEvent) => {
      if (scrollKeys.has(event.key) && !isInsideSpotlightCard(event.target)) {
        event.preventDefault();
      }
    };

    window.addEventListener("wheel", blockWheel, { passive: false, capture: true });
    window.addEventListener("touchstart", rememberTouch, { passive: true, capture: true });
    window.addEventListener("touchmove", blockTouchMove, { passive: false, capture: true });
    window.addEventListener("keydown", blockScrollKeys, { capture: true });
    return () => {
      window.removeEventListener("wheel", blockWheel, { capture: true });
      window.removeEventListener("touchstart", rememberTouch, { capture: true });
      window.removeEventListener("touchmove", blockTouchMove, { capture: true });
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

  const measuredCardHeight = cardHeight || SPOTLIGHT_CARD_HEIGHT_FALLBACK;
  const placement = pickSpotlightPlacement(
    step.placement,
    rect,
    visibleArea,
    measuredCardHeight,
    topObstruction,
  );
  const freeBand = spotlightBandLeftForTarget(placement, visibleArea, measuredCardHeight, topObstruction);
  const spotlight = spotlightBox(rect, freeBand);
  const card = (
    <TourCard
      step={step}
      stepIndex={tour.stepIndex}
      stepCount={tour.stepCount}
      labels={tour.labels}
      onNext={tour.next}
      onSkip={tour.skip}
    />
  );

  return (
    <div ref={overlayRoot} className="fixed inset-0 z-50" role="presentation">
      <div
        className="absolute inset-0"
        style={{ background: "var(--tour-backdrop, rgb(0 0 0 / 0.5))" }}
      />
      <div
        className="absolute"
        style={{
          top: spotlight.top,
          left: spotlight.left,
          width: spotlight.width,
          height: spotlight.height,
          borderRadius: "var(--tour-spotlight-radius, calc(var(--radius) + 4px))",
          transition: `top ${MOVE_DURATION} ease, left ${MOVE_DURATION} ease, width ${MOVE_DURATION} ease, height ${MOVE_DURATION} ease`,
          boxShadow: [
            "0 0 0 3px var(--tour-ring-gap, var(--background))",
            "0 0 0 5px var(--tour-accent, var(--primary))",
          ].join(", "),
        }}
      />
      {placement === "dockTop" || placement === "dockBottom" ? (
        <div
          className="pointer-events-none absolute flex justify-center"
          style={{
            top: visibleArea.top,
            left: visibleArea.left,
            width: visibleArea.width,
            height: visibleArea.height,
            alignItems: placement === "dockTop" ? "flex-start" : "flex-end",
            paddingTop: spotlightObstructionInside(visibleArea, topObstruction) + SPOTLIGHT_SCREEN_EDGE,
            paddingBottom: SPOTLIGHT_SCREEN_EDGE,
          }}
        >
          <div
            ref={attachCard}
            data-tour-card=""
            className="pointer-events-auto rounded-2xl bg-popover px-4 pt-4 pb-2.5 text-popover-foreground shadow-xl sm:px-5 sm:pt-5 sm:pb-3.5"
            style={spotlightDockedCardStyle(visibleArea, topObstruction)}
            aria-label={tour.labels.cardTitle}
          >
            {card}
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
            data-tour-card=""
            side={placement}
            align="center"
            sideOffset={SPOTLIGHT_CARD_GAP}
            arrowPadding={16}
            collisionPadding={{
              top: Math.max(SPOTLIGHT_SCREEN_EDGE, topObstruction + SPOTLIGHT_CARD_GAP),
              right: SPOTLIGHT_SCREEN_EDGE,
              bottom: SPOTLIGHT_SCREEN_EDGE,
              left: SPOTLIGHT_SCREEN_EDGE,
            }}
            className="z-[60] w-[min(var(--tour-card-width,22rem),calc(100vw-2rem))] rounded-2xl border-0 px-4 pt-4 pb-2.5 shadow-xl sm:px-5 sm:pt-5 sm:pb-3.5"
            onOpenAutoFocus={(event) => event.preventDefault()}
            onEscapeKeyDown={(event) => event.preventDefault()}
            onPointerDownOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
            aria-label={tour.labels.cardTitle}
          >
            {card}
            <PopoverArrow width={18} height={9} style={{ fill: "var(--popover)" }} />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
