import type { ExtendedDriveStep } from "../TourRunner";

const steps: ExtendedDriveStep[] = [
  {
    popover: {
      title: "👑 Subscription Plans",
      description:
        "Manage your subscription and upgrade to unlock more features.",
      align: "center",
    },
  },
  {
    element: "[data-tour-provider-sub-current-banner]",
    popover: {
      title: "📢 Current Plan",
      description:
        "Shows your active plan, billing cycle, and renewal status.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-billing-tabs]",
    popover: {
      title: "📅 Billing Toggle",
      description:
        "Switch between Monthly and Yearly billing to see pricing for each.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-plan-cards]",
    popover: {
      title: "💎 Plan Options",
      description:
        "Compare features across Basic, Standard, and Premium plans.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-plan-cta]",
    popover: {
      title: "🚀 Upgrade Now",
      description:
        "Buy or upgrade to unlock more services, staff, and features.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "[data-tour-provider-plan-manage]",
    popover: {
      title: "⚙️ Manage Plan",
      description:
        "Cancel your plan or toggle auto-renewal on your current plan.",
      side: "right",
      align: "center",
    },
  },
];

export const providerSubscriptionSteps = steps;