import type { DriveStep } from "driver.js";
import { renderToString } from "react-dom/server";
import { ClipboardList, Circle, Download } from "lucide-react";
import React from "react";

const getTitle = (icon: React.ReactNode, text: string) => {
  const iconHtml = renderToString(icon);
  return `<div style="display: flex; align-items: center; gap: 8px;">${iconHtml} <span>${text}</span></div>`;
};


export const invoiceSteps: DriveStep[] = [
  {
    element: "[data-tour-booking-table]",
    popover: {
      title: getTitle(<ClipboardList className="h-5 w-5 text-primary" />, "Select a Booking"),
      description:
        "Click any booking row to expand it. Invoice options appear in the action buttons below.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "[data-tour-view-invoice-btn]",
    popover: {
      title: getTitle(<Circle className="h-5 w-5 text-primary" />, "View Invoice"),
      description:
        "Preview your invoice in a modal with full booking details and payment breakdown.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "[data-tour-download-invoice-btn]",
    popover: {
      title: getTitle(<Download className="h-5 w-5 text-primary" />, "Download Invoice"),
      description:
        "Download your invoice as a PDF for your records or reimbursement purposes.",
      side: "top",
      align: "start",
    },
  },
];
