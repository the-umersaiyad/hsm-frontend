"use client";

import { useApiLoadingStatus } from "@vis.gl/react-google-maps";

type MapsStatus = "loading" | "ready" | "error";

/**
 * Hook that returns the current Google Maps SDK load status.
 * Must be used within an APIProvider context.
 */
export function useGoogleMaps() {
  const status = useApiLoadingStatus();

  const mappedStatus: MapsStatus =
    status === "LOADED" ? "ready" : status === "LOADING" ? "loading" : "error";

  return {
    status: mappedStatus,
    isReady: mappedStatus === "ready",
    isLoading: mappedStatus === "loading",
    isError: mappedStatus === "error",
  };
}
