import type { ExtendedDriveStep } from "../TourRunner";

const steps: ExtendedDriveStep[] = [
  {
    popover: {
      title: "📅 Staff Leave Management",
      description:
        "Review and manage leave requests from your staff members.",
      align: "center",
    },
  },
  {
    element: "[data-tour-provider-leave-summary-cards]",
    popover: {
      title: "📊 Leave Summary",
      description:
        "Overview: Pending, Approved, Rejected, and Total leave requests.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-leave-filters]",
    popover: {
      title: "🔍 Filters & Search",
      description:
        "Filter by status or search by staff name.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-leave-table]",
    popover: {
      title: "📋 Leave Requests",
      description:
        "All leave requests with staff name, dates, reason, and status.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-leave-approve-btn]",
    popover: {
      title: "✅ Approve Leave",
      description:
        "Approve a pending leave request.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "[data-tour-provider-leave-reject-btn]",
    popover: {
      title: "❌ Reject Leave",
      description:
        "Reject a pending leave request.",
      side: "right",
      align: "center",
    },
  },
];

export const providerLeaveSteps = steps;