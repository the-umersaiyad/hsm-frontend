import type { DriveStep } from "driver.js";
import { renderToString } from "react-dom/server";
import { BarChart, FolderTree, ClipboardList } from "lucide-react";
import React from "react";

const getTitle = (icon: React.ReactNode, text: string) => {
  const iconHtml = renderToString(icon);
  return `<div style="display: flex; align-items: center; gap: 8px;">${iconHtml} <span>${text}</span></div>`;
};


export const bookingsOverviewSteps: DriveStep[] = [
  {
    element: "[data-tour-booking-stats]",
    popover: {
      title: getTitle(<BarChart className="h-5 w-5 text-primary" />, "Booking Summary"),
      description:
        "Your total, confirmed, completed, and cancelled booking counts — all at a glance.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-status-tabs]",
    popover: {
      title: getTitle(<FolderTree className="h-5 w-5 text-primary" />, "Filter by Status"),
      description:
        "Use these tabs to view all bookings or filter by Confirmed, Completed, Cancelled, or Delayed.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-booking-table]",
    popover: {
      title: getTitle(<ClipboardList className="h-5 w-5 text-primary" />, "Your Bookings Table"),
      description:
        "Click any row (or the chevron arrow) to expand a booking and see full details, actions, and history.",
      side: "top",
      align: "start",
    },
  },
];
