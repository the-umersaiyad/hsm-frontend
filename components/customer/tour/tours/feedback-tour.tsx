import type { DriveStep } from "driver.js";
import { renderToString } from "react-dom/server";
import { CheckCircle, Circle, Star } from "lucide-react";
import React from "react";

const getTitle = (icon: React.ReactNode, text: string) => {
  const iconHtml = renderToString(icon);
  return `<div style="display: flex; align-items: center; gap: 8px;">${iconHtml} <span>${text}</span></div>`;
};


export const feedbackSteps: DriveStep[] = [
  {
    element: "[data-tour-completed-tab]",
    popover: {
      title: getTitle(<CheckCircle className="h-5 w-5 text-primary" />, "Switch to Completed"),
      description:
        "Click the 'Completed' tab to see services you've already received.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour-booking-table]",
    popover: {
      title: getTitle(<Circle className="h-5 w-5 text-primary" />, "Expand a Completed Booking"),
      description:
        "Click any completed booking row to expand it and see the review option.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "[data-tour-review-btn]",
    popover: {
      title: getTitle(<Star className="h-5 w-5 text-primary" />, "Leave a Review"),
      description:
        "Share your experience! Rate the service and leave a comment to help other customers.",
      side: "top",
      align: "start",
    },
  },
];
