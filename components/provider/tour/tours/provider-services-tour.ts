import type { ExtendedDriveStep } from "../TourRunner";

const steps: ExtendedDriveStep[] = [
  {
    popover: {
      title: "🛠️ Services Management",
      description:
        "Your service catalog. Let's learn how to add and manage your offerings.",
      align: "center",
    },
  },
  {
    element: "[data-tour-provider-add-service-btn]",
    popover: {
      title: "➕ Add Service",
      description:
        "Create a new service with name, description, price, and optional image.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-service-list]",
    popover: {
      title: "📋 Your Services",
      description:
        "View all your services in grid or list view. See which are active or inactive.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-service-card-actions]",
    popover: {
      title: "⚙️ Service Actions",
      description:
        "Edit, toggle active status, or delete each service from this menu.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "[data-tour-provider-service-filters]",
    popover: {
      title: "🔍 Filters & Search",
      description:
        "Search services by name, filter by status, and sort by name or price.",
      side: "bottom",
      align: "start",
    },
  },
];

export const providerServicesSteps = steps;