import { type ReactNode, useRef } from "react";

import { createOnboardingEventBus, type OnboardingEventBus } from "../../lib/onboarding";
import { OnboardingEventsContext } from "./onboarding-events-context";

export interface OnboardingEventsProviderProps {
  children: ReactNode;
}

export function OnboardingEventsProvider({ children }: OnboardingEventsProviderProps) {
  const busRef = useRef<OnboardingEventBus | null>(null);
  if (busRef.current === null) {
    busRef.current = createOnboardingEventBus();
  }

  return (
    <OnboardingEventsContext.Provider value={busRef.current}>
      {children}
    </OnboardingEventsContext.Provider>
  );
}
