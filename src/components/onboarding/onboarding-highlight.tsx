import { useCallback, useEffect, useRef, useState } from "react";

import { Popover, PopoverAnchor, PopoverArrow, PopoverContent } from "../../ui/popover";
import {
  SPOTLIGHT_CARD_GAP,
  SPOTLIGHT_CARD_HEIGHT_FALLBACK,
  SPOTLIGHT_MOVE_DURATION,
  SPOTLIGHT_SCREEN_EDGE,
  makeRoomForSpotlightCard,
  pickSpotlightPlacement,
  spotlightBandLeftForTarget,
  spotlightBox,
  spotlightDockedCardStyle,
  spotlightObstructionInside,
  stickyBarBottomAboveSpotlight,
} from "../../lib/spotlight-placement";
import { findTourTarget } from "../tour/find-target";
import { OnboardingLearningCard } from "./onboarding-learning-card";
import {
  englishOnboardingHighlightLabels,
  type OnboardingHighlightLabels,
} from "./onboarding-highlight-labels";
import { useOnboardingTargetTracking } from "./use-onboarding-target-tracking";
import type { OnboardingTaskRunner } from "./use-onboarding-task-runner";

export interface OnboardingHighlightProps {
  runner: OnboardingTaskRunner;
  pathname: string;
  labels?: OnboardingHighlightLabels;
}

export function OnboardingHighlight({
  runner,
  pathname,
  labels = englishOnboardingHighlightLabels,
}: OnboardingHighlightProps) {
  const { currentStep, currentStepIndex, task, isFinished, completeInfoStep } = runner;
  const target = isFinished ? null : currentStep.target;
  const stepPath = isFinished ? null : (currentStep.path ?? null);
  const { rect, visibleArea, onWrongPage, targetOffScreen } = useOnboardingTargetTracking(
    target,
    stepPath,
    pathname,
  );
  const [topObstruction, setTopObstruction] = useState(0);
  const [cardElement, setCardElement] = useState<HTMLDivElement | null>(null);
  const [cardHeight, setCardHeight] = useState(0);
  const overlayRoot = useRef<HTMLDivElement>(null);

  const showSpotlight = Boolean(target && rect && !onWrongPage && !targetOffScreen);

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
    if (!showSpotlight || !target) {
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
  }, [showSpotlight, target, cardHeight, topObstruction]);

  useEffect(() => {
    if (!showSpotlight) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      setTopObstruction(stickyBarBottomAboveSpotlight(overlayRoot.current));
    });
    return () => cancelAnimationFrame(frame);
  }, [showSpotlight]);

  const attachCard = useCallback((node: HTMLDivElement | null) => {
    setCardElement(node);
    const wrapper = node?.closest<HTMLElement>("[data-radix-popper-content-wrapper]");
    if (wrapper) {
      wrapper.style.zIndex = "60";
      wrapper.style.transition = `transform ${SPOTLIGHT_MOVE_DURATION} ease`;
    }
  }, []);

  if (!showSpotlight || !rect) {
    return null;
  }

  const measuredCardHeight = cardHeight || SPOTLIGHT_CARD_HEIGHT_FALLBACK;
  const placement = pickSpotlightPlacement(
    currentStep.placement,
    rect,
    visibleArea,
    measuredCardHeight,
    topObstruction,
  );
  const freeBand = spotlightBandLeftForTarget(placement, visibleArea, measuredCardHeight, topObstruction);
  const spotlight = spotlightBox(rect, freeBand);
  const card = (
    <OnboardingLearningCard
      step={currentStep}
      stepIndex={currentStepIndex}
      stepCount={task.steps.length}
      labels={labels}
      showHelp={runner.showHelp}
      onCompleteInfoStep={completeInfoStep}
    />
  );

  return (
    <div ref={overlayRoot} className="pointer-events-none fixed inset-0 z-50" role="presentation">
      <div
        className="pointer-events-none absolute"
        style={{
          top: spotlight.top,
          left: spotlight.left,
          width: spotlight.width,
          height: spotlight.height,
          borderRadius: "var(--tour-spotlight-radius, calc(var(--radius) + 4px))",
          transition: `top ${SPOTLIGHT_MOVE_DURATION} ease, left ${SPOTLIGHT_MOVE_DURATION} ease, width ${SPOTLIGHT_MOVE_DURATION} ease, height ${SPOTLIGHT_MOVE_DURATION} ease`,
          boxShadow: [
            "0 0 0 3px var(--tour-ring-gap, var(--background))",
            "0 0 0 5px var(--tour-accent, var(--primary))",
            "0 0 0 9999px var(--onboarding-dim, rgb(0 0 0 / 0.5))",
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
          >
            {card}
          </div>
        </div>
      ) : (
        <Popover open>
          <PopoverAnchor asChild>
            <div
              className="pointer-events-none absolute"
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
            className="pointer-events-auto z-[60] w-[min(var(--tour-card-width,22rem),calc(100vw-2rem))] rounded-2xl border-2 border-[var(--tour-accent,var(--primary))] px-4 pt-4 pb-2.5 shadow-2xl ring-4 ring-[var(--tour-accent,var(--primary))]/20 sm:px-5 sm:pt-5 sm:pb-3.5"
            onOpenAutoFocus={(event) => event.preventDefault()}
            onEscapeKeyDown={(event) => event.preventDefault()}
          >
            {card}
            <PopoverArrow width={18} height={9} style={{ fill: "var(--popover)" }} />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
