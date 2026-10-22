import { useContext } from "react";

import type { OnboardingEventBus } from "../../lib/onboarding";
import { OnboardingEventsContext } from "./onboarding-events-context";

export function useOnboardingEvents(): OnboardingEventBus | null {
  return useContext(OnboardingEventsContext);
}
