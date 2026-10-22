export interface SpotlightTargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface SpotlightVisibleArea {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface SpotlightVerticalBand {
  top: number;
  bottom: number;
}

export type SpotlightSide = "top" | "bottom" | "left" | "right";
export type SpotlightCardPlacement = SpotlightSide | "dockTop" | "dockBottom";

export const SPOTLIGHT_PADDING = 6;
export const SPOTLIGHT_RING_WIDTH = 5;
export const SPOTLIGHT_MOVE_DURATION = "220ms";
export const SPOTLIGHT_CARD_GAP = 12;
export const SPOTLIGHT_CARD_HEIGHT_FALLBACK = 240;
export const SPOTLIGHT_MAX_CARD_WIDTH = 352;
export const SPOTLIGHT_SCREEN_MARGIN = 32;
export const SPOTLIGHT_SCREEN_EDGE = 16;
export const SPOTLIGHT_DOCKED_CARD_SHARE = 0.6;
export const SPOTLIGHT_CARD_SELECTOR = "[data-tour-card]";

export function initialSpotlightVisibleArea(): SpotlightVisibleArea {
  if (typeof window === "undefined") {
    return { top: 0, left: 0, width: 0, height: 0 };
  }
  return readSpotlightVisibleArea();
}

export function readSpotlightVisibleArea(): SpotlightVisibleArea {
  const visual = window.visualViewport;
  if (!visual) {
    return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
  }
  return { top: visual.offsetTop, left: visual.offsetLeft, width: visual.width, height: visual.height };
}

export function spotlightObstructionInside(area: SpotlightVisibleArea, topObstruction: number): number {
  return Math.max(0, topObstruction - area.top);
}

export function spotlightScreenBand(
  area: SpotlightVisibleArea,
  topObstruction: number,
): SpotlightVerticalBand {
  return { top: Math.max(area.top, topObstruction), bottom: area.top + area.height };
}

export function pickSpotlightPlacement(
  preferred: SpotlightSide | undefined,
  rect: SpotlightTargetRect,
  area: SpotlightVisibleArea,
  cardHeight: number,
  topObstruction: number,
): SpotlightCardPlacement {
  if (area.width === 0) {
    return preferred ?? "bottom";
  }
  const band = spotlightScreenBand(area, topObstruction);
  const targetBottom = rect.top + rect.height;
  const targetOnScreen = rect.top < band.bottom && targetBottom > band.top;
  const cardWidth = Math.min(SPOTLIGHT_MAX_CARD_WIDTH, area.width - SPOTLIGHT_SCREEN_MARGIN);
  const need = cardHeight + SPOTLIGHT_CARD_GAP * 2;
  const fits = {
    top: targetOnScreen && rect.top - band.top >= need,
    bottom: targetOnScreen && band.bottom - targetBottom >= need,
    left: targetOnScreen && rect.left - area.left >= cardWidth + SPOTLIGHT_CARD_GAP,
    right: targetOnScreen && area.left + area.width - (rect.left + rect.width) >= cardWidth + SPOTLIGHT_CARD_GAP,
  };
  if (preferred && fits[preferred]) {
    return preferred;
  }
  if (fits.bottom) return "bottom";
  if (fits.top) return "top";
  if (fits.right) return "right";
  if (fits.left) return "left";
  return pickSpotlightDockEdge(rect, area, cardHeight, topObstruction);
}

function pickSpotlightDockEdge(
  rect: SpotlightTargetRect,
  area: SpotlightVisibleArea,
  cardHeight: number,
  topObstruction: number,
): "dockTop" | "dockBottom" {
  const shownBelowTopCard = spotlightVisibleHeight(
    rect,
    spotlightBandLeftForTarget("dockTop", area, cardHeight, topObstruction),
  );
  const shownAboveBottomCard = spotlightVisibleHeight(
    rect,
    spotlightBandLeftForTarget("dockBottom", area, cardHeight, topObstruction),
  );
  return shownBelowTopCard > shownAboveBottomCard ? "dockTop" : "dockBottom";
}

export function spotlightBandLeftForTarget(
  placement: SpotlightCardPlacement,
  area: SpotlightVisibleArea,
  cardHeight: number,
  topObstruction: number,
): SpotlightVerticalBand {
  const band = spotlightScreenBand(area, topObstruction);
  const cardRoom = cardHeight + SPOTLIGHT_SCREEN_EDGE + SPOTLIGHT_CARD_GAP;
  if (placement === "dockTop") {
    return { top: band.top + cardRoom, bottom: band.bottom };
  }
  if (placement === "dockBottom") {
    return { top: band.top, bottom: band.bottom - cardRoom };
  }
  return band;
}

function spotlightVisibleHeight(rect: SpotlightTargetRect, band: SpotlightVerticalBand): number {
  return Math.max(0, Math.min(rect.top + rect.height, band.bottom) - Math.max(rect.top, band.top));
}

export function spotlightBox(
  rect: SpotlightTargetRect,
  band: SpotlightVerticalBand,
): SpotlightTargetRect {
  const top = Math.max(rect.top - SPOTLIGHT_PADDING, band.top + SPOTLIGHT_RING_WIDTH);
  const bottom = Math.min(rect.top + rect.height + SPOTLIGHT_PADDING, band.bottom - SPOTLIGHT_RING_WIDTH);
  return {
    top,
    left: rect.left - SPOTLIGHT_PADDING,
    width: rect.width + SPOTLIGHT_PADDING * 2,
    height: Math.max(0, bottom - top),
  };
}

export function spotlightDockedCardStyle(
  area: SpotlightVisibleArea,
  topObstruction: number,
): Record<string, string> {
  const usableHeight = area.height - spotlightObstructionInside(area, topObstruction);
  return {
    width: `min(var(--tour-card-width, 22rem), ${area.width - SPOTLIGHT_SCREEN_MARGIN}px)`,
    "--radix-popover-content-available-height": `${Math.round(usableHeight * SPOTLIGHT_DOCKED_CARD_SHARE)}px`,
  };
}

export function isInsideSpotlightCard(eventTarget: EventTarget | null): boolean {
  return eventTarget instanceof Element && eventTarget.closest(SPOTLIGHT_CARD_SELECTOR) !== null;
}

export function spotlightCardCanScroll(eventTarget: EventTarget | null, deltaY: number): boolean {
  if (!(eventTarget instanceof Element)) {
    return false;
  }
  const card = eventTarget.closest(SPOTLIGHT_CARD_SELECTOR);
  let node: Element | null = eventTarget;
  while (card && node && card.contains(node)) {
    if (canScrollSpotlightCardInDirection(node, deltaY)) {
      return true;
    }
    node = node.parentElement;
  }
  return false;
}

function canScrollSpotlightCardInDirection(element: Element, deltaY: number): boolean {
  const overflowY = getComputedStyle(element).overflowY;
  if (overflowY !== "auto" && overflowY !== "scroll") {
    return false;
  }
  if (deltaY > 0) {
    return element.scrollTop + element.clientHeight < element.scrollHeight - 1;
  }
  if (deltaY < 0) {
    return element.scrollTop > 0;
  }
  return false;
}

export function makeRoomForSpotlightCard(
  element: HTMLElement,
  neededRoom: number,
  topObstruction: number,
) {
  const box = element.getBoundingClientRect();
  const band = spotlightScreenBand(readSpotlightVisibleArea(), topObstruction);
  const fitsAbove = box.top - band.top >= neededRoom && box.bottom <= band.bottom;
  const fitsBelow = band.bottom - box.bottom >= neededRoom && box.top >= band.top;
  if (fitsAbove || fitsBelow) {
    return;
  }

  const container = scrollingAncestorOfSpotlightTarget(element);
  const fitsWithRoomBelow = box.height + neededRoom <= band.bottom - band.top;
  const desiredTop = fitsWithRoomBelow
    ? band.bottom - neededRoom - box.height
    : band.top + SPOTLIGHT_PADDING + SPOTLIGHT_RING_WIDTH;
  container.scrollBy({ top: box.top - desiredTop, behavior: "smooth" });
}

function scrollingAncestorOfSpotlightTarget(element: HTMLElement): HTMLElement {
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

export function stickyBarBottomAboveSpotlight(overlayRoot: HTMLElement | null): number {
  const area = readSpotlightVisibleArea();
  const probes = document.elementsFromPoint(area.left + area.width / 2, area.top + 4);
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
