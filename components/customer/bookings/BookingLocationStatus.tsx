"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StaffLiveMap } from "@/components/maps/StaffLiveMap";
import { Clock, CheckCircle, AlertTriangle, Phone } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BookingLocationStatusProps {
  booking: {
    id: number;
    status: string;
    bookingDate: string;
    customerLat?: number;
    customerLng?: number;
    customerAddress?: string;
    arrivedAt?: string | null;
    travelingAt?: string | null;
    customerAbsentAt?: string | null;
    gracePeriodEndsAt?: string | null;
    noShowRefundAmount?: number | null;
    assignedStaffId?: number | null;
  };
  /** Role of the viewer — determines socket room. Defaults to "customer". */
  viewerRole?: "customer" | "admin" | "provider";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isToday(dateStr: string): boolean {
  const bookingDate = new Date(dateStr);
  const today = new Date();
  return (
    bookingDate.getFullYear() === today.getFullYear() &&
    bookingDate.getMonth() === today.getMonth() &&
    bookingDate.getDate() === today.getDate()
  );
}

function formatTime(isoStr: string): string {
  const date = new Date(isoStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function BookingLocationStatus({ booking, viewerRole = "customer" }: BookingLocationStatusProps) {
  const {
    id,
    status,
    bookingDate,
    customerLat,
    customerLng,
    customerAddress,
    arrivedAt,
    travelingAt,
    customerAbsentAt,
    gracePeriodEndsAt,
    noShowRefundAmount,
  } = booking;

  // Grace period countdown timer
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!gracePeriodEndsAt) return;

    const interval = setInterval(() => {
      const remaining =
        new Date(gracePeriodEndsAt).getTime() - Date.now();
      if (remaining <= 0) {
        setTimeLeft("Expired");
        clearInterval(interval);
        return;
      }
      const min = Math.floor(remaining / 60000);
      const sec = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${min}m ${sec}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [gracePeriodEndsAt]);

  const isTodayBooking = isToday(bookingDate);
  const isConfirmed = status === "confirmed";
  const isMissed = status === "missed";
  const isCustomerAbsent = status === "customer_absent";
  // Show live map for today's confirmed bookings OR any missed/delayed bookings
  // The StaffLiveMap component itself handles the "not yet shared" fallback
  const showLiveMap =
    ((isTodayBooking && isConfirmed) || isMissed) &&
    customerLat != null &&
    customerLng != null &&
    booking.assignedStaffId != null;

  // Grace period is active when customerAbsentAt is set and gracePeriodEndsAt is in the future
  const isGracePeriodActive =
    customerAbsentAt &&
    gracePeriodEndsAt &&
    new Date(gracePeriodEndsAt).getTime() > Date.now();

  // Nothing to show if no location-related state is active
  if (
    !showLiveMap &&
    !arrivedAt &&
    !isGracePeriodActive &&
    !isCustomerAbsent
  ) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* 18.1: StaffLiveMap for today's confirmed bookings with active location */}
      {showLiveMap && customerLat != null && customerLng != null && (
        <StaffLiveMap
          bookingId={id}
          customerLat={customerLat}
          customerLng={customerLng}
          customerAddress={customerAddress || "Customer location"}
          role={viewerRole}
        />
      )}

      {/* 18.2: "Technician arrived at [time]" display */}
      {arrivedAt && (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 px-3 py-1"
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
            Technician arrived at {formatTime(arrivedAt)}
          </Badge>
        </div>
      )}

      {/* 18.3: Grace period countdown banner */}
      {isGracePeriodActive && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Your technician is waiting
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  You have{" "}
                  <span className="font-bold tabular-nums">{timeLeft}</span>{" "}
                  to respond before the booking is marked as no-show.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
                onClick={() => {
                  // Open phone dialer or contact modal
                  window.open("tel:", "_self");
                }}
              >
                <Phone className="h-3.5 w-3.5 mr-1.5" />
                Contact provider
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 18.4: "No-show — partial refund processing" badge */}
      {isCustomerAbsent && (
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 px-3 py-1"
          >
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            No-show — partial refund processing
          </Badge>

          {/* 18.5: Refund amount display */}
          {noShowRefundAmount != null && noShowRefundAmount > 0 && (
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 px-3 py-1"
            >
              Refund: ₹{Math.round(noShowRefundAmount / 100)}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
