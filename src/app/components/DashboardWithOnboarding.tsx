"use client";

import { OnboardingWizard } from "./OnboardingWizard";
import { useEffect, useState } from "react";

interface DashboardWithOnboardingProps {
  children: React.ReactNode;
  showOnboarding: boolean;
  userName?: string;
  companyName: string;
}

const ONBOARDING_DISMISSED_KEY = "plato_onboarding_dismissed";

export function DashboardWithOnboarding({
  children,
  showOnboarding,
  userName,
  companyName,
}: DashboardWithOnboardingProps) {
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);

  useEffect(() => {
    // Check localStorage to see if user has dismissed onboarding
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem(ONBOARDING_DISMISSED_KEY);
      // Only show onboarding if server says to AND user hasn't dismissed it
      setShouldShowOnboarding(showOnboarding && dismissed !== "true");
    } else {
      setShouldShowOnboarding(showOnboarding);
    }
  }, [showOnboarding]);

  return (
    <>
      {children}
      {shouldShowOnboarding && (
        <OnboardingWizard userName={userName} companyName={companyName} />
      )}
    </>
  );
}

