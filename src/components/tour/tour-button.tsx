import { RotateCcw } from "lucide-react";

import { Button } from "../../ui/button";
import { cn } from "../../lib/class-names";
import { useTour } from "./use-tour";

export interface TourButtonProps {
  className?: string;
}

export function TourButton({ className }: TourButtonProps) {
  const tour = useTour();

  if (!tour || !tour.tour || tour.stepCount === 0) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("rounded-full", className)}
      onClick={tour.start}
    >
      <RotateCcw aria-hidden="true" />
      {tour.labels.openTour}
    </Button>
  );
}
