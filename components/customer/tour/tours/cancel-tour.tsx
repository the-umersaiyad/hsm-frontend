import type { DriveStep } from "driver.js";
import { renderToString } from "react-dom/server";
import { CheckCircle, Circle } from "lucide-react";
import React from "react";

const getTitle = (icon: React.ReactNode, text: string) => {
  const iconHtml = renderToString(icon);
  return `<div style="display: flex; align-items: center; gap: 8px;">${iconHtml} <span>${text}</span></div>`;
};


export const cancelSteps: DriveStep[] = [
  {
    element: "[data-tour-confirmed-tab]",
    popover: {
      title: getTitle(<CheckCircle className="h-5 w-5 text-primary" />, "Switch to Confirmed"),
      description:
        "Click the 'Confirmed' tab to see your upcoming bookings.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour-booking-table]",
    popover: {
      title: getTitle(<Circle className="h-5 w-5 text-primary" />, "Expand a Booking"),
      description:
        "Click any row to expand it and see all available actions including Cancel.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "[data-tour-cancel-btn]",
    popover: {
      title: getTitle(<Circle className="h-5 w-5 text-primary" />, "Cancel Booking"),
      description:
        "Click Cancel to cancel this booking. A refund will be processed according to the cancellation policy shown.",
      side: "top",
      align: "start",
    },
  },
];
