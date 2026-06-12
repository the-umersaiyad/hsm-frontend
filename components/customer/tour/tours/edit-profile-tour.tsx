import type { DriveStep } from "driver.js";
import { renderToString } from "react-dom/server";
import { Circle, ClipboardList, Pencil } from "lucide-react";
import React from "react";

const getTitle = (icon: React.ReactNode, text: string) => {
  const iconHtml = renderToString(icon);
  return `<div style="display: flex; align-items: center; gap: 8px;">${iconHtml} <span>${text}</span></div>`;
};


export const editProfileSteps: DriveStep[] = [
  {
    element: "[data-tour-overview-tab]",
    popover: {
      title: getTitle(<Circle className="h-5 w-5 text-primary" />, "Profile Overview Tab"),
      description:
        "This tab shows your personal account information — name, email, phone, and role.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "[data-tour-profile-info]",
    popover: {
      title: getTitle(<ClipboardList className="h-5 w-5 text-primary" />, "Your Account Details"),
      description: "Your current name, email, phone, and role are shown here.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "[data-tour-edit-profile-btn]",
    popover: {
      title: getTitle(<Pencil className="h-5 w-5 text-primary" />, "Edit Your Profile"),
      description:
        "Click this button to open the edit modal where you can update your name, phone number, and profile photo.",
      side: "top",
      align: "center",
    },
  },
];
