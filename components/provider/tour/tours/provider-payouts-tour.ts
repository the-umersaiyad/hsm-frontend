import type { ExtendedDriveStep } from "../TourRunner";

const steps: ExtendedDriveStep[] = [
  {
    popover: {
      title: "💸 Staff Payouts",
      description:
        "Track and manage payouts for your staff members.",
      align: "center",
    },
  },
  {
    element: "[data-tour-provider-payout-summary]",
    popover: {
      title: "💰 Payout Summary",
      description:
        "Pending amount, total paid, and staff with pending payouts.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-payout-table]",
    popover: {
      title: "📋 Pending Payouts",
      description:
        "List of staff members awaiting payout with amounts and due dates.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-payout-mark-paid-btn]",
    popover: {
      title: "✓ Mark as Paid",
      description:
        "Mark a staff member's payout as completed after payment.",
      side: "right",
      align: "center",
    },
  },
];

export const providerPayoutsSteps = steps;