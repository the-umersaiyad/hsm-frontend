import type { DriveStep } from "driver.js";
import { renderToString } from "react-dom/server";
import { Search, MapPin, Tags, CreditCard } from "lucide-react";
import React from "react";

const getTitle = (icon: React.ReactNode, text: string) => {
  const iconHtml = renderToString(icon);
  return `<div style="display: flex; align-items: center; gap: 8px;">${iconHtml} <span>${text}</span></div>`;
};


export const browseServicesSteps: DriveStep[] = [
  {
    element: "[data-tour-search-bar]",
    popover: {
      title: getTitle(<Search className="h-5 w-5 text-primary" />, "Search for Services"),
      description:
        "Type a service name to quickly find what you need. Results update as you type.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-state-filter]",
    popover: {
      title: getTitle(<MapPin className="h-5 w-5 text-primary" />, "Filter by State"),
      description: "Narrow down services to providers in your state.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "[data-tour-category-filter]",
    popover: {
      title: getTitle(<Tags className="h-5 w-5 text-primary" />, "Browse by Category"),
      description:
        "Filter services by category — plumbing, cleaning, electrical, and more.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "[data-tour-services-grid]",
    popover: {
      title: getTitle(<CreditCard className="h-5 w-5 text-primary" />, "Service Cards"),
      description:
        "Click any service card to view details, check available slots, and book. Each card shows ratings, location, and price.",
      side: "top",
      align: "start",
    },
  },
];
