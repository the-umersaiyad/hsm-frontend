import type { ExtendedDriveStep } from "../TourRunner";

const steps: ExtendedDriveStep[] = [
  {
    popover: {
      title: "⭐ Customer Reviews",
      description:
        "See what your customers are saying and respond to their feedback.",
      align: "center",
    },
  },
  {
    element: "[data-tour-provider-reviews-header]",
    popover: {
      title: "📋 Reviews Overview",
      description:
        "Page heading and refresh button to load latest reviews.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-reviews-list]",
    popover: {
      title: "💬 All Reviews",
      description:
        "Customer reviews with ratings, comments, service name, and date.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-reviews-respond-btn]",
    popover: {
      title: "💬 Respond to Review",
      description:
        "Reply to a customer's review to show you value their feedback.",
      side: "right",
      align: "center",
    },
  },
];

export const providerReviewsSteps = steps;