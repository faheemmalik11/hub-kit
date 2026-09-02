import { useEffect, useState } from "react";

import { Popover, PopoverAnchor, PopoverContent } from "../../ui/popover";
import { findTourTarget } from "./find-target";
import { TourCard } from "./tour-card";
import { useTour } from "./use-tour";

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const SPOTLIGHT_PADDING = 6;

export function TourOverlay() {
  const tour = useTour();
  const step = tour?.step ?? null;
  const target = step?.target ?? null;
  const [rect, setRect] = useState<TargetRect | null>(null);

  useEffect(() => {
    if (!target) {
      setRect(null);
      return;
    }
    const element = findTourTarget(target);
    if (!element) {
      setRect(null);
      return;
    }
    element.scrollIntoView({ block: "center", behavior: "smooth" });

    const measure = () => {
      const box = element.getBoundingClientRect();
      setRect({ top: box.top, left: box.left, width: box.width, height: box.height });
    };
    measure();

    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
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
        className="absolute rounded-md ring-2 ring-[var(--tour-accent,var(--primary))]"
        style={{
          top: rect.top - SPOTLIGHT_PADDING,
          left: rect.left - SPOTLIGHT_PADDING,
          width: rect.width + SPOTLIGHT_PADDING * 2,
          height: rect.height + SPOTLIGHT_PADDING * 2,
          boxShadow: "0 0 0 9999px var(--tour-backdrop, rgb(0 0 0 / 0.5))",
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
          side={step.placement ?? "bottom"}
          align="start"
          sideOffset={12}
          className="w-[var(--tour-card-width,22rem)]"
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
            onBack={tour.back}
            onSkip={tour.skip}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
