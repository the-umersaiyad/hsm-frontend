import type { ExtendedDriveStep } from "../TourRunner";

const steps: ExtendedDriveStep[] = [
  {
    popover: {
      title: "👥 Staff Management",
      description:
        "Manage your team members who will handle service bookings.",
      align: "center",
    },
  },
  {
    element: "[data-tour-provider-staff-stats]",
    popover: {
      title: "📊 Staff Statistics",
      description:
        "Overview of your team: Total, Active, On Leave, and Inactive staff counts.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-staff-filters]",
    popover: {
      title: "🔍 Filters & Search",
      description:
        "Search by name or filter staff by status.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-add-staff-btn]",
    popover: {
      title: "➕ Add Staff",
      description:
        "Add a new team member with name, phone, and role.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-staff-table]",
    popover: {
      title: "👤 Staff List",
      description:
        "View all your staff members with their details and status.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-staff-actions]",
    popover: {
      title: "⚙️ Staff Actions",
      description:
        "Edit details, activate/deactivate, or remove a staff member.",
      side: "right",
      align: "center",
    },
  },
];

export const providerStaffSteps = steps;