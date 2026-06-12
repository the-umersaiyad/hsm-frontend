import type { ExtendedDriveStep } from "../TourRunner";

const steps: ExtendedDriveStep[] = [
  {
    popover: {
      title: "💳 Payment Methods",
      description:
        "Set up how you receive payouts from customer bookings.",
      align: "center",
    },
  },
  {
    element: "[data-tour-provider-payments-status-alert]",
    popover: {
      title: "⚠️ Payment Status",
      description:
        "Shows whether your payment setup is complete or missing details.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-add-upi-btn]",
    popover: {
      title: "📱 Add UPI",
      description:
        "Add a UPI ID for instant payouts directly to your wallet.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-add-bank-btn]",
    popover: {
      title: "🏦 Add Bank Account",
      description:
        "Add bank account details for direct bank transfers.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-payments-list]",
    popover: {
      title: "💰 Saved Methods",
      description:
        "Your saved UPI and bank payment methods.",
      side: "top",
      align: "start",
    },
  },
];

export const providerPaymentsSteps = steps;