import type { ExtendedDriveStep } from "../TourRunner";

const steps: ExtendedDriveStep[] = [
  {
    popover: {
      title: "📋 Bookings Management",
      description:
        "Track and manage all customer bookings for your services.",
      align: "center",
    },
  },
  {
    element: "[data-tour-provider-booking-header]",
    popover: {
      title: "📋 Bookings Overview",
      description:
        "Your booking count and summary at a glance.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-booking-filters]",
    popover: {
      title: "🔍 Status Filters",
      description:
        "Filter bookings by status: All, Pending, Confirmed, Completed, or Cancelled.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-booking-list]",
    popover: {
      title: "📝 Booking List",
      description:
        "All bookings with customer details, service, date, time, and status.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-booking-reschedule-btn]",
    popover: {
      title: "🔄 Reschedule",
      description:
        "Change the date or time of a confirmed booking. Customer will be notified.",
      side: "right",
      align: "center",
    },
    __clickToAdvance: true,
  },
  {
    element: "[data-tour-provider-booking-staff-assign]",
    popover: {
      title: "👤 Assign Staff",
      description:
        "Assign a staff member to handle this booking.",
      side: "right",
      align: "center",
    },
    __clickToAdvance: true,
  },
];

export const providerBookingsSteps = steps;