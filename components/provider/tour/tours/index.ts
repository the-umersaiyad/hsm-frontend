import type { LucideIcon } from "lucide-react";
import type { ExtendedDriveStep } from "../TourRunner";
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  Clock,
  Users,
  CalendarClock,
  Wallet,
  Star,
  CreditCard,
  Crown,
} from "lucide-react";

import { providerDashboardSteps } from "./provider-dashboard-tour";
import { providerBusinessSteps } from "./provider-business-tour";
import { providerServicesSteps } from "./provider-services-tour";
import { providerAvailabilitySteps } from "./provider-availability-tour";
import { providerBookingsSteps } from "./provider-bookings-tour";
import { providerStaffSteps } from "./provider-staff-tour";
import { providerLeaveSteps } from "./provider-leave-tour";
import { providerPayoutsSteps } from "./provider-payouts-tour";
import { providerReviewsSteps } from "./provider-reviews-tour";
import { providerPaymentsSteps } from "./provider-payments-tour";
import { providerSubscriptionSteps } from "./provider-subscription-tour";

// ---------------------------------------------------------------------------
// TourDefinition type
// ---------------------------------------------------------------------------

export interface TourDefinition {
  id: string;
  title: string;
  description: string;
  /** Lucide icon component rendered in the help menu */
  icon: LucideIcon;
  /** Navigate to this path before starting the tour (when not already there) */
  targetPath: string;
  /** Static array of steps */
  steps: ExtendedDriveStep[];
  /** Only show this tour when the provider has confirmed bookings */
  requiresConfirmedBookings?: boolean;
  /** Only show this tour when the provider has pending leave requests */
  requiresPendingLeave?: boolean;
  /** Only show this tour when the provider has pending staff payouts */
  requiresPendingPayouts?: boolean;
  /** Only show this tour when the provider has any reviews */
  requiresReviews?: boolean;
}

// ---------------------------------------------------------------------------
// Tour registry
// ---------------------------------------------------------------------------

export const ALL_PROVIDER_TOURS: TourDefinition[] = [
  {
    id: "provider-dashboard",
    title: "Dashboard Overview",
    description: "Your business stats, earnings, and today's schedule",
    icon: LayoutDashboard,
    targetPath: "/provider/dashboard",
    steps: providerDashboardSteps,
  },
  {
    id: "provider-business",
    title: "Business Profile",
    description: "View and edit your business details and performance",
    icon: Briefcase,
    targetPath: "/provider/business",
    steps: providerBusinessSteps,
  },
  {
    id: "provider-services",
    title: "Manage Services",
    description: "Add, edit, and toggle your service offerings",
    icon: MessageSquare,
    targetPath: "/provider/services",
    steps: providerServicesSteps,
  },
  {
    id: "provider-availability",
    title: "Set Availability",
    description: "Create and manage your available time slots",
    icon: Clock,
    targetPath: "/provider/availability",
    steps: providerAvailabilitySteps,
  },
  {
    id: "provider-bookings",
    title: "Bookings Overview",
    description: "View and manage customer bookings",
    icon: CalendarClock,
    targetPath: "/provider/bookings",
    steps: providerBookingsSteps,
    requiresConfirmedBookings: true,
  },
  {
    id: "provider-staff",
    title: "Staff Management",
    description: "Add, edit, and manage your team members",
    icon: Users,
    targetPath: "/provider/staff",
    steps: providerStaffSteps,
  },
  {
    id: "provider-leave",
    title: "Leave Management",
    description: "Review and approve staff leave requests",
    icon: CalendarClock,
    targetPath: "/provider/staff/leave",
    steps: providerLeaveSteps,
    requiresPendingLeave: true,
  },
  {
    id: "provider-payouts",
    title: "Staff Payouts",
    description: "Track and manage staff salary payouts",
    icon: Wallet,
    targetPath: "/provider/staff-payouts",
    steps: providerPayoutsSteps,
    requiresPendingPayouts: true,
  },
  {
    id: "provider-reviews",
    title: "Customer Reviews",
    description: "View and respond to customer feedback",
    icon: Star,
    targetPath: "/provider/reviews",
    steps: providerReviewsSteps,
    requiresReviews: true,
  },
  {
    id: "provider-payments",
    title: "Payment Setup",
    description: "Add UPI or bank details to receive payouts",
    icon: CreditCard,
    targetPath: "/provider/payments",
    steps: providerPaymentsSteps,
  },
  {
    id: "provider-subscription",
    title: "Subscription Plans",
    description: "View, upgrade, or manage your subscription",
    icon: Crown,
    targetPath: "/provider/subscription",
    steps: providerSubscriptionSteps,
  },
];

// ---------------------------------------------------------------------------
// Lookup map  (id → TourDefinition)
// ---------------------------------------------------------------------------

export const PROVIDER_TOURS_BY_ID: Record<string, TourDefinition> = Object.fromEntries(
  ALL_PROVIDER_TOURS.map((t) => [t.id, t]),
);

// ---------------------------------------------------------------------------
// Page-relevance helpers
// ---------------------------------------------------------------------------

const PROVIDER_TOUR_PATHS: Record<string, string[]> = {
  "provider-dashboard": ["/provider/dashboard"],
  "provider-business": ["/provider/business"],
  "provider-services": ["/provider/services"],
  "provider-availability": ["/provider/availability"],
  "provider-bookings": ["/provider/bookings"],
  "provider-staff": ["/provider/staff"],
  "provider-leave": ["/provider/staff/leave"],
  "provider-payouts": ["/provider/staff-payouts"],
  "provider-reviews": ["/provider/reviews"],
  "provider-payments": ["/provider/payments"],
  "provider-subscription": ["/provider/subscription"],
};

export function isRelevantForPage(tourId: string, pathname: string): boolean {
  const paths = PROVIDER_TOUR_PATHS[tourId] ?? [];
  return paths.some((p) =>
    p.endsWith("/") ? pathname.startsWith(p) : pathname === p,
  );
}

// ---------------------------------------------------------------------------
// Menu-data builder
// ---------------------------------------------------------------------------

export interface ProviderBookingData {
  hasConfirmedBookings: boolean;
  hasPendingLeave: boolean;
  hasPendingPayouts: boolean;
  hasReviews: boolean;
}

/**
 * Splits all tours into "thisPage" (relevant to current route) and
 * "otherPages" (everything else), filtering out conditional tours that
 * can't run due to missing data.
 */
export function getToursByPage(
  pathname: string,
  bookingData?: ProviderBookingData,
): { thisPage: TourDefinition[]; otherPages: TourDefinition[] } {
  const thisPage: TourDefinition[] = [];
  const otherPages: TourDefinition[] = [];

  for (const tour of ALL_PROVIDER_TOURS) {
    if (tour.requiresConfirmedBookings && !bookingData?.hasConfirmedBookings) {
      continue;
    }
    if (tour.requiresPendingLeave && !bookingData?.hasPendingLeave) {
      continue;
    }
    if (tour.requiresPendingPayouts && !bookingData?.hasPendingPayouts) {
      continue;
    }
    if (tour.requiresReviews && !bookingData?.hasReviews) {
      continue;
    }

    if (isRelevantForPage(tour.id, pathname)) {
      thisPage.push(tour);
    } else {
      otherPages.push(tour);
    }
  }

  return { thisPage, otherPages };
}