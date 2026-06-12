import type { DriveStep } from "driver.js";
import { renderToString } from "react-dom/server";
import { Lock, Circle } from "lucide-react";
import React from "react";

const getTitle = (icon: React.ReactNode, text: string) => {
  const iconHtml = renderToString(icon);
  return `<div style="display: flex; align-items: center; gap: 8px;">${iconHtml} <span>${text}</span></div>`;
};


export const changePasswordSteps: DriveStep[] = [
  {
    element: "[data-tour-security-tab]",
    popover: {
      title: getTitle(<Lock className="h-5 w-5 text-primary" />, "Security Tab"),
      description:
        "Click the 'Security' tab to access password management.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour-password-form]",
    popover: {
      title: getTitle(<Circle className="h-5 w-5 text-primary" />, "Change Your Password"),
      description:
        "Enter your current password, then set a new one. Your new password must be at least 8 characters with uppercase, lowercase, numbers, and symbols.",
      side: "right",
      align: "start",
    },
  },
];
