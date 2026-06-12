import type { ExtendedDriveStep } from "../TourRunner";

const steps: ExtendedDriveStep[] = [
  {
    popover: {
      title: "🏠 Welcome to Your Provider Dashboard!",
      description:
        "This is your business command center. Let's explore what you can do here.",
      align: "center",
    },
  },
  {
    element: "[data-tour-provider-stat-total-bookings]",
    popover: {
      title: "📊 Total Bookings",
      description:
        "Your complete booking count — includes completed, confirmed, and cancelled jobs.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-stat-today]",
    popover: {
      title: "📅 Bookings Today",
      description:
        "Your scheduled appointments for today. Tap to see your daily schedule.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-stat-earnings]",
    popover: {
      title: "💰 Total Earnings",
      description:
        "Your net earnings from all completed services, including reschedule fees.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-stat-rating]",
    popover: {
      title: "⭐ Average Rating",
      description:
        "Your customer satisfaction score based on all reviews received.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-earnings-card]",
    popover: {
      title: "💵 Earnings Breakdown",
      description:
        "View your total earned, pending payouts, and total after payout — all in one place.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-refresh-btn]",
    popover: {
      title: "🔄 Refresh Data",
      description:
        "Click to refresh all your dashboard statistics and recent data.",
      side: "bottom",
      align: "end",
    },
  },
];

export const providerDashboardSteps = steps;