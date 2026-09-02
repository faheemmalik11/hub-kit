import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

import { englishTourLabels, type TourLabels } from "./labels";
import { findTourTarget } from "./find-target";
import { hasSeenTour, markTourSeen } from "./seen-store";
import { TourContext, type TourState } from "./tour-context";
import { TourOverlay } from "./tour-overlay";
import type { TourMap } from "./types";

export interface TourProviderProps {
  tours: TourMap;
  labels?: TourLabels;
  children: ReactNode;
}

export function TourProvider({ tours, labels = englishTourLabels, children }: TourProviderProps) {
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
  const autoStartAllowed = tour?.autoStart !== false;
  const firstTarget = tour?.steps[0]?.target ?? null;

  useEffect(() => {
    if (!tourId || !firstTarget || !autoStartAllowed || hasSeenTour(tourId)) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      if (findTourTarget(firstTarget)) {
        setStepIndex(0);
        setOpenTourId(tourId);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [tourId, firstTarget, autoStartAllowed]);

  const start = useCallback(() => {
    if (!tour || tour.steps.length === 0) {
      return;
    }
    setStepIndex(0);
    setOpenTourId(tour.id);
  }, [tour]);

  const finish = useCallback(() => {
    if (tour) {
      markTourSeen(tour.id);
    }
    close();
  }, [tour, close]);

  const next = useCallback(() => {
    if (!tour) {
      return;
    }
    if (stepIndex + 1 >= tour.steps.length) {
      finish();
      return;
    }
    setStepIndex(stepIndex + 1);
  }, [tour, stepIndex, finish]);

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
      skip: finish,
    };
  }, [tour, stepIndex, isOpen, labels, start, next, back, finish]);

  return (
    <TourContext.Provider value={value}>
      {children}
      <TourOverlay />
    </TourContext.Provider>
  );
}
