"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { useStaffLocationSocket } from "@/hooks/useStaffLocationSocket";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { haversineDistance } from "@/lib/haversine";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StaffLiveMapProps {
  bookingId: number;
  customerLat: number;
  customerLng: number;
  customerAddress: string;
  role: "customer" | "admin" | "provider";
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MAP_HEIGHT = 300;
const AVERAGE_SPEED_KMH = 30;

// ─── Helper: format seconds ago ──────────────────────────────────────────────

function formatSecondsAgo(seconds: number): string {
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

// ─── Map Bounds Fitter ───────────────────────────────────────────────────────

function MapBoundsFitter({
  staffLat,
  staffLng,
  customerLat,
  customerLng,
}: {
  staffLat: number;
  staffLng: number;
  customerLat: number;
  customerLng: number;
}) {
  const map = useMap();
  const hasFittedRef = useRef(false);

  useEffect(() => {
    if (!map || hasFittedRef.current) return;

    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: staffLat, lng: staffLng });
    bounds.extend({ lat: customerLat, lng: customerLng });
    map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
    hasFittedRef.current = true;
  }, [map, staffLat, staffLng, customerLat, customerLng]);

  return null;
}

// ─── Staff Pin (animated with CSS transitions) ──────────────────────────────

function StaffPin() {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1 rounded-full bg-blue-600 px-2 py-1 text-[10px] font-medium text-white shadow-md">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="size-3"
        >
          <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
        </svg>
        Staff
      </div>
      <div className="size-0 border-x-4 border-t-4 border-x-transparent border-t-blue-600" />
    </div>
  );
}

// ─── Customer Pin ────────────────────────────────────────────────────────────

function CustomerPin({ label = "You" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1 rounded-full bg-green-600 px-2 py-1 text-[10px] font-medium text-white shadow-md">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="size-3"
        >
          <path
            fillRule="evenodd"
            d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
            clipRule="evenodd"
          />
        </svg>
        {label}
      </div>
      <div className="size-0 border-x-4 border-t-4 border-x-transparent border-t-green-600" />
    </div>
  );
}

// ─── Connection Status Dot ───────────────────────────────────────────────────

function ConnectionDot({ isConnected }: { isConnected: boolean }) {
  if (isConnected) {
    return (
      <span className="relative flex size-2.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex size-2.5 rounded-full bg-green-500" />
      </span>
    );
  }
  // Polling/disconnected state — show yellow for polling fallback
  return (
    <span className="relative flex size-2.5">
      <span className="relative inline-flex size-2.5 rounded-full bg-yellow-500" />
    </span>
  );
}

// ─── Fallback State ──────────────────────────────────────────────────────────

function LocationNotSharedFallback() {
  return (
    <Card className="py-4">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-6">
        <div className="relative flex items-center justify-center">
          <span className="absolute inline-flex size-10 animate-ping rounded-full bg-blue-200 opacity-50" />
          <span className="relative inline-flex size-6 items-center justify-center rounded-full bg-blue-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-4 text-blue-600"
            >
              <path
                fillRule="evenodd"
                d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Staff location not yet shared
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            The map will update once the staff member starts sharing their location.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function StaffLiveMap({
  bookingId,
  customerLat,
  customerLng,
  customerAddress,
  role,
}: StaffLiveMapProps) {
  const { isReady, isLoading, isError } = useGoogleMaps();

  const { latestLocation, isConnected } = useStaffLocationSocket({
    bookingId,
    role: role === "admin" ? "admin" : "customer", // provider views as customer
    enabled: true,
  });

  // "Last updated X seconds ago" timer
  const [secondsAgo, setSecondsAgo] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!latestLocation) {
      setSecondsAgo(0);
      return;
    }

    // Calculate initial seconds ago
    const calcSeconds = () => {
      const elapsed = Math.floor((Date.now() - latestLocation.timestamp) / 1000);
      setSecondsAgo(Math.max(0, elapsed));
    };

    calcSeconds();
    intervalRef.current = setInterval(calcSeconds, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [latestLocation]);

  // Compute distance and ETA
  const { distanceKm, etaMinutes } = useMemo(() => {
    if (!latestLocation) return { distanceKm: 0, etaMinutes: 0 };

    const dist = haversineDistance(
      latestLocation.lat,
      latestLocation.lng,
      customerLat,
      customerLng
    );
    const eta = Math.round((dist / AVERAGE_SPEED_KMH) * 60);

    return { distanceKm: dist, etaMinutes: eta };
  }, [latestLocation, customerLat, customerLng]);

  // Smooth position for staff pin (CSS transition handles animation)
  const staffPosition = useMemo(() => {
    if (!latestLocation) return null;
    return { lat: latestLocation.lat, lng: latestLocation.lng };
  }, [latestLocation]);

  // Default map center (customer location)
  const defaultCenter = useMemo(
    () => ({ lat: customerLat, lng: customerLng }),
    [customerLat, customerLng]
  );

  // ─── Loading / Error States ──────────────────────────────────────────────

  if (isLoading) {
    return (
      <Card className="py-4">
        <CardContent>
          <div
            className="flex items-center justify-center rounded-lg bg-muted/50"
            style={{ height: MAP_HEIGHT }}
          >
            <div className="text-center">
              <div className="mx-auto mb-2 size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-xs text-muted-foreground">Loading map...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="py-4">
        <CardContent>
          <div
            className="flex items-center justify-center rounded-lg bg-muted/50"
            style={{ height: MAP_HEIGHT }}
          >
            <p className="text-xs text-destructive">
              Failed to load map. Check API key configuration.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Fallback: No location yet ────────────────────────────────────────────

  if (!latestLocation) {
    return <LocationNotSharedFallback />;
  }

  // ─── Main Render ──────────────────────────────────────────────────────────

  return (
    <Card className="overflow-hidden py-0">
      {/* Map */}
      <div className="relative" style={{ height: MAP_HEIGHT }}>
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={13}
          mapId="staff-live-map"
          gestureHandling="cooperative"
          disableDefaultUI
          className="size-full"
        >
          {/* Staff Pin — CSS transition for smooth movement */}
          {staffPosition && (
            <AdvancedMarker
              position={staffPosition}
              title="Staff location"
            >
              <div
                className="transition-transform duration-1000 ease-in-out"
              >
                <StaffPin />
              </div>
            </AdvancedMarker>
          )}

          {/* Customer Pin */}
          <AdvancedMarker
            position={{ lat: customerLat, lng: customerLng }}
            title={customerAddress}
          >
            <CustomerPin label={role === "customer" ? "You" : "Customer"} />
          </AdvancedMarker>

          {/* Auto-fit bounds */}
          {staffPosition && (
            <MapBoundsFitter
              staffLat={staffPosition.lat}
              staffLng={staffPosition.lng}
              customerLat={customerLat}
              customerLng={customerLng}
            />
          )}
        </Map>
      </div>

      {/* Info Bar */}
      <CardContent className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {/* Distance */}
          <div className="flex items-center gap-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-4 text-muted-foreground"
            >
              <path
                fillRule="evenodd"
                d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">{distanceKm.toFixed(1)} km away</span>
          </div>

          {/* ETA */}
          <Badge variant="secondary" className="text-xs">
            ~{etaMinutes} min
          </Badge>

          {/* Last Updated */}
          <span className="text-xs text-muted-foreground">
            Updated {formatSecondsAgo(secondsAgo)}
          </span>

          {/* Connection Status */}
          <div className="ml-auto flex items-center gap-1.5">
            <ConnectionDot isConnected={isConnected} />
            <span className="text-[10px] text-muted-foreground">
              {isConnected ? "Live" : "Polling"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
