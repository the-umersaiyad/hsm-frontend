import type { DriveStep } from "driver.js";
import { renderToString } from "react-dom/server";
import { CheckCircle, Circle, RefreshCw } from "lucide-react";
import React from "react";

const getTitle = (icon: React.ReactNode, text: string) => {
  const iconHtml = renderToString(icon);
  return `<div style="display: flex; align-items: center; gap: 8px;">${iconHtml} <span>${text}</span></div>`;
};


export const rescheduleSteps: DriveStep[] = [
  {
    element: "[data-tour-confirmed-tab]",
    popover: {
      title: getTitle(<CheckCircle className="h-5 w-5 text-primary" />, "Switch to Confirmed"),
      description:
        "Click the 'Confirmed' tab to see your upcoming bookings that can be rescheduled.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour-booking-table]",
    popover: {
      title: getTitle(<Circle className="h-5 w-5 text-primary" />, "Expand a Booking"),
      description:
        "Click any row to expand it. You'll find the Reschedule button in the expanded details.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "[data-tour-reschedule-btn]",
    popover: {
      title: getTitle(<RefreshCw className="h-5 w-5 text-primary" />, "Reschedule"),
      description:
        "Click Reschedule to pick a new date and time slot. Your provider will be notified of the change.",
      side: "top",
      align: "start",
    },
  },
];
