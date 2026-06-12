"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Live Tracking has been merged into the Service Areas page.
 * This page redirects to /admin/service-areas.
 */
export default function AdminLiveTrackingRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/service-areas");
  }, [router]);

  return null;
}
