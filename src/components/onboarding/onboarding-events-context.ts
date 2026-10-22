import { createContext } from "react";

import type { OnboardingEventBus } from "../../lib/onboarding";

export const OnboardingEventsContext = createContext<OnboardingEventBus | null>(null);
