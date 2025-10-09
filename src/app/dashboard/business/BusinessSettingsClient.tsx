"use client";

import { BusinessSettingsForm } from "@/components/BusinessSettingsForm";

interface Company {
  id: number;
  name: string;
  slug: string | null;
  businessType: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  postcode: string | null;
  country: string;
  logoUrl: string | null;
  isProfilePublic: boolean;
  profileBio: string | null;
  showTeam: boolean;
  showContact: boolean;
}

export function BusinessSettingsClient({ company }: { company: Company }) {
  return <BusinessSettingsForm company={company} />;
}

