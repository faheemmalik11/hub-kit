import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

import { englishTourLabels, type TourLabels } from "./labels";
import { findTourTarget } from "./find-target";
import { localTourSeenStore } from "./seen-store";
import { TourContext, type TourState } from "./tour-context";
import { TourOverlay } from "./tour-overlay";
import type { TourMap, TourSeenStore } from "./types";

const STABLE_FRAMES = 10;
const MAX_WAIT_FRAMES = 600;

export interface TourProviderProps {
  tours: TourMap;
  labels?: TourLabels;
  seenStore?: TourSeenStore;
  children: ReactNode;
}

export function TourProvider({
  tours,
  labels = englishTourLabels,
  seenStore = localTourSeenStore,
  children,
}: TourProviderProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const tour = tours[pathname] ?? null;
  const [openTourId, setOpenTourId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  const isOpen = tour !== null && openTourId === tour.id;

  const close = useCallback(() => {
    setOpenTourId(null);
    setStepIndex(0);
  }, []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  const tourId = tour?.id ?? null;
  const tourVersion = tour?.version ?? 1;
  const autoStartAllowed = tour?.autoStart !== false;
  const firstTarget = tour?.steps[0]?.target ?? null;
  const storeIsReady = seenStore.isReady;
  const alreadySeen = tourId !== null && storeIsReady && seenStore.hasSeen(tourId, tourVersion);

  useEffect(() => {
    if (!tourId || !firstTarget || !autoStartAllowed || !storeIsReady || alreadySeen) {
      return;
    }

    let frame = 0;
    let attempts = 0;
    let lastHeight = -1;
    let stableFrames = 0;

    const waitForSettledPage = () => {
      attempts += 1;
      if (attempts > MAX_WAIT_FRAMES) {
        return;
      }
      const element = findTourTarget(firstTarget);
      if (element) {
        const height = element.getBoundingClientRect().height;
        if (height > 0 && height === lastHeight) {
          stableFrames += 1;
          if (stableFrames >= STABLE_FRAMES) {
            setStepIndex(0);
            setOpenTourId(tourId);
            return;
          }
        } else {
          stableFrames = 0;
        }
        lastHeight = height;
      }
      frame = requestAnimationFrame(waitForSettledPage);
    };

    frame = requestAnimationFrame(waitForSettledPage);
    return () => cancelAnimationFrame(frame);
  }, [tourId, firstTarget, autoStartAllowed, storeIsReady, alreadySeen]);

  const start = useCallback(() => {
    if (!tour || tour.steps.length === 0) {
      return;
    }
    setStepIndex(0);
    setOpenTourId(tour.id);
  }, [tour]);

  const finish = useCallback(
    (status: "skipped" | "completed") => {
      if (tour) {
        seenStore.markSeen(tour.id, tour.version ?? 1, { status, lastStep: stepIndex });
      }
      close();
    },
    [tour, seenStore, stepIndex, close],
  );

  const next = useCallback(() => {
    if (!tour) {
      return;
    }
    if (stepIndex + 1 >= tour.steps.length) {
      finish("completed");
      return;
    }
    setStepIndex(stepIndex + 1);
  }, [tour, stepIndex, finish]);

  const skip = useCallback(() => finish("skipped"), [finish]);

  const back = useCallback(() => {
    setStepIndex((index) => (index > 0 ? index - 1 : index));
  }, []);

  const value = useMemo<TourState>(() => {
    const step = isOpen && tour ? (tour.steps[stepIndex] ?? null) : null;
    return {
      tour,
      step,
      stepIndex,
      stepCount: tour ? tour.steps.length : 0,
      isOpen,
      showsPlaceholderData: step?.showPlaceholderData === true,
      labels,
      start,
      next,
      back,
      skip: skip,
    };
  }, [tour, stepIndex, isOpen, labels, start, next, back, skip]);

  return (
    <TourContext.Provider value={value}>
      {children}
      <TourOverlay />
    </TourContext.Provider>
  );
}
