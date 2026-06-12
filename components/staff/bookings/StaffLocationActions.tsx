"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStaffLocationSocket } from "@/hooks/useStaffLocationSocket";
import { useGeoFenceArrival } from "@/hooks/useGeoFenceArrival";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  MapPin,
  Navigation,
  CheckCircle,
  XCircle,
  Radio,
  Square,
} from "lucide-react";

interface StaffLocationActionsProps {
  booking: {
    id: number;
    status: string;
    bookingDate: string;
    addressId: number;
    customerLat?: number;
    customerLng?: number;
    customerAddress?: string;
    arrivedAt?: string | null;
    travelingAt?: string | null;
    customerAbsentAt?: string | null;
    absentCount?: number | null;
  };
}

const ARRIVAL_RADIUS_METERS = 50;

/**
 * Checks if a given date string represents today's date.
 */
function isToday(dateStr: string): boolean {
  const bookingDate = new Date(dateStr);
  const today = new Date();
  return (
    bookingDate.getFullYear() === today.getFullYear() &&
    bookingDate.getMonth() === today.getMonth() &&
    bookingDate.getDate() === today.getDate()
  );
}

export function StaffLocationActions({ booking }: StaffLocationActionsProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [arrivedAt, setArrivedAt] = useState<string | null>(
    booking.arrivedAt ?? null
  );
  const [customerAbsentAt, setCustomerAbsentAt] = useState<string | null>(
    booking.customerAbsentAt ?? null
  );
  const [absentCount, setAbsentCount] = useState<number>(
    booking.absentCount ?? 0
  );
  const [currentLat, setCurrentLat] = useState<number | undefined>(undefined);
  const [currentLng, setCurrentLng] = useState<number | undefined>(undefined);
  const [arrivalLoading, setArrivalLoading] = useState(false);
  const [absentLoading, setAbsentLoading] = useState(false);

  const watchIdRef = useRef<number | null>(null);

  // Show for today's confirmed bookings OR any missed (delayed) bookings regardless of date
  const isTodayActive =
    (booking.status === "confirmed" && isToday(booking.bookingDate)) ||
    booking.status === "missed";

  // WebSocket hook for location sharing
  const { emitLocation, disconnect } = useStaffLocationSocket({
    bookingId: booking.id,
    role: "staff",
    enabled: isSharing,
  });

  // Geo-fence auto-arrival hook
  const {
    showPrompt: geoFenceShowPrompt,
    confirmArrival: geoFenceConfirmArrival,
    dismissPrompt: geoFenceDismissPrompt,
    distanceMeters,
  } = useGeoFenceArrival({
    bookingId: booking.id,
    customerLat: booking.customerLat ?? 0,
    customerLng: booking.customerLng ?? 0,
    arrivalRadiusMeters: ARRIVAL_RADIUS_METERS,
    enabled: isSharing && !arrivedAt && !!booking.customerLat && !!booking.customerLng,
    currentStaffLat: currentLat,
    currentStaffLng: currentLng,
  });

  // Cleanup GPS watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  /**
   * Start sharing location: request GPS, connect socket, set traveling_at
   */
  const handleStartSharing = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    // Start GPS watch
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentLat(latitude);
        setCurrentLng(longitude);
        emitLocation(latitude, longitude);
      },
      (err) => {
        console.error("GPS error:", err);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Location permission denied. Please enable GPS access.");
          handleStopSharing();
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    watchIdRef.current = watchId;
    setIsSharing(true);

    // Set traveling_at timestamp on the backend using the first available GPS position
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await api.post(`/staff-location/${booking.id}`, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        } catch {
          // Non-blocking — location sharing still works even if initial post fails
          console.error("Failed to send initial location");
        }
      },
      () => {
        // If getCurrentPosition fails, the watchPosition will handle it
        console.warn("Initial position unavailable, waiting for watch");
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );

    toast.success("Location sharing started");
  }, [booking.id, emitLocation]);

  /**
   * Stop sharing location: clear GPS watch, disconnect socket
   */
  const handleStopSharing = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    disconnect();
    setIsSharing(false);
    // Keep currentLat/currentLng — don't clear them so Navigate still works
    toast.info("Location sharing stopped");
  }, [disconnect]);

  /**
   * Mark arrival manually
   */
  const handleMarkArrived = useCallback(async () => {
    setArrivalLoading(true);
    try {
      await api.post(`/bookings/${booking.id}/staff-arrived`, {});
      const now = new Date().toISOString();
      setArrivedAt(now);
      toast.success("Arrival recorded successfully");
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      if (error.statusCode === 409) {
        toast.info("Arrival already recorded");
      } else {
        toast.error(error.message || "Failed to record arrival");
      }
    } finally {
      setArrivalLoading(false);
    }
  }, [booking.id]);

  /**
   * Handle geo-fence auto-arrival confirmation
   */
  const handleGeoFenceConfirm = useCallback(async () => {
    geoFenceConfirmArrival();
    const now = new Date().toISOString();
    setArrivedAt(now);
    toast.success("Arrival confirmed via geo-fence");
  }, [geoFenceConfirmArrival]);

  /**
   * Mark customer as not available (after 5 min wait)
   * 1st time: booking → missed, arrived_at reset
   * 2nd time: booking → cancelled with refund
   */
  const handleCustomerAbsent = useCallback(async () => {
    setAbsentLoading(true);
    try {
      const response = await api.post<{ absentCount: number; newStatus: string }>(`/bookings/${booking.id}/customer-absent`, {});
      const newCount = response.absentCount || (absentCount + 1);
      setAbsentCount(newCount);
      setCustomerAbsentAt(new Date().toISOString());

      if (newCount === 1) {
        // 1st time: reset arrived_at so staff can arrive again
        setArrivedAt(null);
        toast.success("Customer marked as not available. Booking delayed.");
      } else if (newCount === 2) {
        // 2nd time: booking cancelled
        toast.success("Booking cancelled due to customer no-show. Refund processing.");
      }
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      if (error.statusCode === 422) {
        toast.error(error.message || "Cannot mark absent yet");
      } else {
        toast.error(error.message || "Failed to mark customer absent");
      }
    } finally {
      setAbsentLoading(false);
    }
  }, [booking.id, absentCount]);

  /**
   * Open Google Maps navigation
   */
  const handleNavigate = useCallback(() => {
    let destination: string;
    if (booking.customerLat && booking.customerLng) {
      destination = `${booking.customerLat},${booking.customerLng}`;
    } else if (booking.customerAddress) {
      destination = encodeURIComponent(booking.customerAddress);
    } else {
      toast.error("No customer location available for navigation");
      return;
    }

    console.log("[Navigate] currentLat:", currentLat, "currentLng:", currentLng);

    // Always try to get fresh GPS for origin
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const url = `https://www.google.com/maps/dir/${pos.coords.latitude},${pos.coords.longitude}/${destination}`;
          console.log("[Navigate] Opening with GPS origin:", url);
          window.open(url, "_blank", "noopener,noreferrer");
        },
        (err) => {
          console.log("[Navigate] GPS failed:", err.message, "— using fallback");
          // Fallback: use stored coords or "My Location"
          if (currentLat && currentLng) {
            const url = `https://www.google.com/maps/dir/${currentLat},${currentLng}/${destination}`;
            window.open(url, "_blank", "noopener,noreferrer");
          } else {
            // Last resort: just destination, let Google Maps figure out origin
            const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
            window.open(url, "_blank", "noopener,noreferrer");
          }
        },
        { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
      );
    } else {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, [booking.customerLat, booking.customerLng, booking.customerAddress, currentLat, currentLng]);

  // Check if customer was marked absent today (prevent same-day re-arrival)
  const isSameDayAsAbsent = (() => {
    if (!customerAbsentAt) return false;
    const absentDate = new Date(customerAbsentAt);
    const today = new Date();
    return (
      absentDate.getFullYear() === today.getFullYear() &&
      absentDate.getMonth() === today.getMonth() &&
      absentDate.getDate() === today.getDate()
    );
  })();

  // Determine if "Customer Not Available" button should be enabled (5 min after arrival)
  const isAbsentButtonEnabled = (() => {
    if (!arrivedAt || absentCount >= 2 || booking.status === "cancelled") return false;
    const arrivedTime = new Date(arrivedAt).getTime();
    const now = Date.now();
    const fiveMinMs = 5 * 60 * 1000;
    return now - arrivedTime >= fiveMinMs;
  })();

  // Minutes remaining until absent button is enabled
  const minutesUntilAbsentEnabled = (() => {
    if (!arrivedAt || absentCount >= 2 || booking.status === "cancelled") return null;
    const arrivedTime = new Date(arrivedAt).getTime();
    const now = Date.now();
    const fiveMinMs = 5 * 60 * 1000;
    const remaining = fiveMinMs - (now - arrivedTime);
    if (remaining <= 0) return 0;
    return Math.ceil(remaining / 60000);
  })();

  // Don't render anything if not today's active booking
  if (!isTodayActive) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Location Actions Header */}
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>Location Actions</span>
        {isSharing && (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700"
          >
            <Radio className="h-3 w-3 mr-1 animate-pulse" />
            Sharing Live
          </Badge>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Share / Stop Sharing Location */}
        {!isSharing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartSharing}
            className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/20"
          >
            <Radio className="h-4 w-4 mr-1.5" />
            Share My Location
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleStopSharing}
            className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
          >
            <Square className="h-4 w-4 mr-1.5" />
            Stop Sharing
          </Button>
        )}

        {/* I've Arrived Button — hidden on same day after absence */}
        {!arrivedAt && !(customerAbsentAt && isSameDayAsAbsent) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkArrived}
            disabled={arrivalLoading}
            className="text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20"
          >
            <CheckCircle className="h-4 w-4 mr-1.5" />
            {arrivalLoading ? "Recording..." : "I've Arrived"}
          </Button>
        )}

        {/* Customer Not Available Button (enabled after 5 min, reusable up to 2 times) */}
        {arrivedAt && absentCount < 2 && booking.status !== "cancelled" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCustomerAbsent}
            disabled={!isAbsentButtonEnabled || absentLoading}
            className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-700 dark:hover:bg-orange-900/20 disabled:opacity-50"
            title={
              !isAbsentButtonEnabled && minutesUntilAbsentEnabled
                ? `Available in ${minutesUntilAbsentEnabled} min`
                : undefined
            }
          >
            <XCircle className="h-4 w-4 mr-1.5" />
            {absentLoading
              ? "Processing..."
              : !isAbsentButtonEnabled && minutesUntilAbsentEnabled
                ? `Customer Not Available (${minutesUntilAbsentEnabled}m)`
                : "Customer Not Available"}
          </Button>
        )}

        {/* Navigate Button */}
        {(booking.customerLat || booking.customerAddress) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleNavigate}
            className="text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-700 dark:hover:bg-purple-900/20"
          >
            <Navigation className="h-4 w-4 mr-1.5" />
            Navigate
          </Button>
        )}
      </div>

      {/* Distance indicator when sharing */}
      {isSharing && booking.customerLat && distanceMeters < Infinity && (
        <p className="text-xs text-muted-foreground">
          Distance to customer: {(distanceMeters / 1000).toFixed(1)} km
        </p>
      )}

      {/* Arrived badge */}
      {arrivedAt && (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Arrived at{" "}
          {new Date(arrivedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Badge>
      )}

      {/* Customer absent badge */}
      {absentCount > 0 && (
        <Badge
          variant="outline"
          className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700"
        >
          <XCircle className="h-3 w-3 mr-1" />
          {absentCount === 1
            ? "Customer absent (1st time) — booking delayed"
            : "Customer absent (2nd time) — booking cancelled"}
        </Badge>
      )}

      {/* Geo-fence auto-arrival AlertDialog */}
      <AlertDialog open={geoFenceShowPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>You appear to have arrived</AlertDialogTitle>
            <AlertDialogDescription>
              Your GPS shows you are within {ARRIVAL_RADIUS_METERS} meters of
              the customer&apos;s location. Would you like to mark yourself as
              arrived?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={geoFenceDismissPrompt}>
              Not yet
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleGeoFenceConfirm}>
              Yes, I&apos;ve arrived
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
