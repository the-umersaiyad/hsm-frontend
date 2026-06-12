"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { haversineDistance, isWithinGeoFence } from "@/lib/haversine";
import { getApiBaseUrl } from "@/lib/api";

interface UseGeoFenceArrivalOptions {
  bookingId: number;
  customerLat: number;
  customerLng: number;
  arrivalRadiusMeters: number; // default 50
  enabled: boolean; // only when location sharing active AND arrived_at is null
  currentStaffLat?: number;
  currentStaffLng?: number;
}

interface UseGeoFenceArrivalReturn {
  isWithinFence: boolean;
  distanceMeters: number;
  showPrompt: boolean;
  confirmArrival: () => void;
  dismissPrompt: () => void;
}

const DISMISS_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

export function useGeoFenceArrival(options: UseGeoFenceArrivalOptions): UseGeoFenceArrivalReturn {
  const {
    bookingId,
    customerLat,
    customerLng,
    arrivalRadiusMeters = 50,
    enabled,
    currentStaffLat,
    currentStaffLng,
  } = options;

  const [isWithinFence, setIsWithinFence] = useState(false);
  const [distanceMeters, setDistanceMeters] = useState(Infinity);
  const [showPrompt, setShowPrompt] = useState(false);

  const dismissedAtRef = useRef<number | null>(null);
  const wasOutsideFenceRef = useRef(true);

  // Compute distance and fence status on each staff location update
  useEffect(() => {
    if (!enabled || currentStaffLat == null || currentStaffLng == null) {
      setIsWithinFence(false);
      setDistanceMeters(Infinity);
      setShowPrompt(false);
      return;
    }

    const distKm = haversineDistance(
      currentStaffLat,
      currentStaffLng,
      customerLat,
      customerLng
    );
    const distM = distKm * 1000;
    setDistanceMeters(distM);

    const withinFence = isWithinGeoFence(
      currentStaffLat,
      currentStaffLng,
      customerLat,
      customerLng,
      arrivalRadiusMeters
    );
    setIsWithinFence(withinFence);

    if (withinFence) {
      // Check if we just entered the fence (was outside before)
      if (wasOutsideFenceRef.current) {
        // Check dismiss cooldown
        const now = Date.now();
        if (
          dismissedAtRef.current == null ||
          now - dismissedAtRef.current >= DISMISS_COOLDOWN_MS
        ) {
          setShowPrompt(true);
        }
      }
      wasOutsideFenceRef.current = false;
    } else {
      wasOutsideFenceRef.current = true;
      setShowPrompt(false);
    }
  }, [
    enabled,
    currentStaffLat,
    currentStaffLng,
    customerLat,
    customerLng,
    arrivalRadiusMeters,
  ]);

  // Confirm arrival — calls POST /api/bookings/:id/staff-arrived
  const confirmArrival = useCallback(() => {
    setShowPrompt(false);

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token") || sessionStorage.getItem("token")
        : null;

    const apiBase = getApiBaseUrl();

    fetch(`${apiBase}/bookings/${bookingId}/staff-arrived`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }).catch(() => {
      // Silently fail — UI can handle error separately
    });
  }, [bookingId]);

  // Dismiss prompt — suppress for 5 minutes
  const dismissPrompt = useCallback(() => {
    setShowPrompt(false);
    dismissedAtRef.current = Date.now();
  }, []);

  return {
    isWithinFence,
    distanceMeters,
    showPrompt,
    confirmArrival,
    dismissPrompt,
  };
}
