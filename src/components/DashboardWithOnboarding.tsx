"use client";

import { OnboardingWizard } from "./OnboardingWizard";

interface DashboardWithOnboardingProps {
  children: React.ReactNode;
  showOnboarding: boolean;
  userName?: string;
  companyName: string;
}

export function DashboardWithOnboarding({
  children,
  showOnboarding,
  userName,
  companyName,
}: DashboardWithOnboardingProps) {
  return (
    <>
      {children}
      {showOnboarding && (
        <OnboardingWizard userName={userName} companyName={companyName} />
      )}
    </>
  );
}

