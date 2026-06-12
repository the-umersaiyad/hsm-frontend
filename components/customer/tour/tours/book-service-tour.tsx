import type { DriveStep } from "driver.js";
import { renderToString } from "react-dom/server";
import { CalendarDays, Clock, MapPin, CheckCircle2 } from "lucide-react";
import React from "react";

const getTitle = (icon: React.ReactNode, text: string) => {
  const iconHtml = renderToString(icon);
  return `<div style="display: flex; align-items: center; gap: 8px;">${iconHtml} <span>${text}</span></div>`;
};

export const bookServiceSteps: DriveStep[] = [
  {
    element: "[data-tour-date-picker]",
    popover: {
      title: getTitle(<CalendarDays className="h-5 w-5 text-primary" />, "Pick Your Date"),
      description:
        "Select your preferred date for the service. Dates in the past and fully-booked dates are disabled.",
      side: "left",
      align: "start",
    },
  },
  {
    element: "[data-tour-slots-section]",
    popover: {
      title: getTitle(<Clock className="h-5 w-5 text-primary" />, "Choose a Time Slot"),
      description:
        "Available slots are shown in green. Booked slots are greyed out. Select your preferred time.",
      side: "left",
      align: "center",
    },
  },
  {
    element: "[data-tour-address-selector]",
    popover: {
      title: getTitle(<MapPin className="h-5 w-5 text-primary" />, "Select Your Address"),
      description:
        "Pick one of your saved addresses for the service visit. Add a new address from your Profile if needed.",
      side: "left",
      align: "center",
    },
  },
  {
    element: "[data-tour-book-now]",
    popover: {
      title: getTitle(<CheckCircle2 className="h-5 w-5 text-primary" />, "Book Now!"),
      description:
        "Once you've selected a date, slot, and address — tap Book Now to confirm and proceed to payment.",
      side: "left",
      align: "end",
    },
  },
];
