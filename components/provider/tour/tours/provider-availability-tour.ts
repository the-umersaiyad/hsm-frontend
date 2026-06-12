import type { ExtendedDriveStep } from "../TourRunner";

const steps: ExtendedDriveStep[] = [
  {
    popover: {
      title: "🕐 Availability Management",
      description:
        "Set the time slots when customers can book your services.",
      align: "center",
    },
  },
  {
    element: "[data-tour-provider-add-slot-btn]",
    popover: {
      title: "➕ Add Time Slot",
      description:
        "Create a new available time slot for bookings (e.g., 9:00 AM - 10:00 AM).",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-slot-grid]",
    popover: {
      title: "⏰ Your Time Slots",
      description:
        "All your available time slots. Click any slot to see details or delete it.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-slot-card]",
    popover: {
      title: "🗑️ Delete Slot",
      description:
        "Remove a time slot if you're no longer available at that time.",
      side: "right",
      align: "center",
    },
  },
];

export const providerAvailabilitySteps = steps;