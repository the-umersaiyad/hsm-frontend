import type { ExtendedDriveStep } from "../TourRunner";

const steps: ExtendedDriveStep[] = [
  {
    popover: {
      title: "🏢 Your Business Profile",
      description:
        "Your public-facing business card. Let's see how to manage it.",
      align: "center",
    },
  },
  {
    element: "[data-tour-provider-edit-profile-btn]",
    popover: {
      title: "✏️ Edit Profile",
      description:
        "Click here to update your business name, description, logo, and contact details.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "[data-tour-provider-business-cover]",
    popover: {
      title: "🎨 Hero Card",
      description:
        "Your business cover image, logo, name, rating, and category badges all appear here.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "[data-tour-provider-business-contact]",
    popover: {
      title: "📞 Contact Information",
      description:
        "Phone, email, location, and website — customers see these to contact you.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-business-performance]",
    popover: {
      title: "📈 Performance Overview",
      description:
        "Total revenue, average job value, and jobs completed — all your key metrics.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "[data-tour-provider-business-status]",
    popover: {
      title: "✅ Account Status",
      description:
        "Whether your business is verified by admin or still pending approval.",
      side: "left",
      align: "center",
    },
  },
  {
    element: "[data-tour-provider-business-quick-actions]",
    popover: {
      title: "⚡ Quick Actions",
      description:
        "Quick links to manage services, set availability, and view bookings.",
      side: "left",
      align: "center",
    },
  },
];

export const providerBusinessSteps = steps;