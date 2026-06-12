"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import {
  Radio,
  MapPin,
  Clock,
  AlertTriangle,
  User,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { useStaffLocationSocket } from "@/hooks/useStaffLocationSocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ActiveSession {
  bookingId: number;
  staffName: string;
  customerName: string;
  staffLat?: number;
  staffLng?: number;
  customerLat: number;
  customerLng: number;
  distanceKm?: number;
  etaMinutes?: number;
  status: string;
  lastUpdate?: string;
}

function SessionTracker({
  session,
  onLocationUpdate,
}: {
  session: ActiveSession;
  onLocationUpdate: (bookingId: number, lat: number, lng: number, timestamp: number) => void;
}) {
  const { latestLocation } = useStaffLocationSocket({
    bookingId: session.bookingId,
    role: "admin",
    enabled: true,
  });

  useEffect(() => {
    if (latestLocation) {
      onLocationUpdate(session.bookingId, latestLocation.lat, latestLocation.lng, latestLocation.timestamp);
    }
  }, [latestLocation, session.bookingId, onLocationUpdate]);

  return null;
}

export function LiveTrackingContent() {
  const { isReady, isLoading: mapsLoading } = useGoogleMaps();
  const [selectedBooking, setSelectedBooking] = useState<number | null>(null);
  const [locationUpdates, setLocationUpdates] = useState<Record<number, { lat: number; lng: number; timestamp: number }>>({});

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["admin_live_tracking"],
    queryFn: () => api.get<ActiveSession[]>("/admin/live-tracking"),
    refetchInterval: 30_000,
  });

  const handleLocationUpdate = useCallback(
    (bookingId: number, lat: number, lng: number, timestamp: number) => {
      setLocationUpdates((prev) => ({
        ...prev,
        [bookingId]: { lat, lng, timestamp },
      }));
    },
    []
  );

  const isStale = (session: ActiveSession) => {
    const update = locationUpdates[session.bookingId];
    if (!update) return !session.lastUpdate;
    const elapsed = Date.now() - update.timestamp;
    return elapsed > 2 * 60 * 1000;
  };

  const getMapCenter = () => {
    if (selectedBooking) {
      const update = locationUpdates[selectedBooking];
      const session = sessions.find((s) => s.bookingId === selectedBooking);
      if (update) return { lat: update.lat, lng: update.lng };
      if (session?.staffLat && session?.staffLng) return { lat: session.staffLat, lng: session.staffLng };
      if (session) return { lat: session.customerLat, lng: session.customerLng };
    }
    return { lat: 20.5937, lng: 78.9629 };
  };

  const getMapZoom = () => (selectedBooking ? 14 : 5);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  return (
    <div className="space-y-6">
      {/* Socket trackers (invisible) */}
      {sessions.map((session) => (
        <SessionTracker
          key={session.bookingId}
          session={session}
          onLocationUpdate={handleLocationUpdate}
        />
      ))}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {mapsLoading ? (
                <div className="h-[500px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !isReady ? (
                <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                  <AlertCircle className="h-6 w-6 mr-2" />
                  Google Maps unavailable
                </div>
              ) : (
                <div className="h-[500px]">
                  <Map
                    center={getMapCenter()}
                    zoom={getMapZoom()}
                    mapId="admin-live-tracking"
                    gestureHandling="greedy"
                    disableDefaultUI={false}
                  >
                    {sessions.map((session) => {
                      const update = locationUpdates[session.bookingId];
                      const staffPos = update
                        ? { lat: update.lat, lng: update.lng }
                        : session.staffLat && session.staffLng
                        ? { lat: session.staffLat, lng: session.staffLng }
                        : null;

                      return (
                        <div key={session.bookingId}>
                          {/* Customer marker */}
                          <AdvancedMarker
                            position={{ lat: session.customerLat, lng: session.customerLng }}
                            title={`Customer: ${session.customerName}`}
                          >
                            <div className="bg-blue-500 text-white rounded-full p-1.5 shadow-lg">
                              <User className="h-4 w-4" />
                            </div>
                          </AdvancedMarker>
                          {/* Staff marker */}
                          {staffPos && (
                            <AdvancedMarker
                              position={staffPos}
                              title={`Staff: ${session.staffName}`}
                            >
                              <div className={cn(
                                "rounded-full p-1.5 shadow-lg",
                                isStale(session) ? "bg-amber-500 text-white" : "bg-green-500 text-white"
                              )}>
                                <MapPin className="h-4 w-4" />
                              </div>
                            </AdvancedMarker>
                          )}
                        </div>
                      );
                    })}
                  </Map>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Sessions Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Radio className="h-4 w-4 text-green-500" />
                Active Sessions ({sessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[450px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No active tracking sessions
                </p>
              ) : (
                sessions.map((session) => {
                  const update = locationUpdates[session.bookingId];
                  const stale = isStale(session);
                  const staffPos = update
                    ? { lat: update.lat, lng: update.lng }
                    : session.staffLat && session.staffLng
                    ? { lat: session.staffLat, lng: session.staffLng }
                    : null;

                  const distance = staffPos
                    ? calculateDistance(staffPos.lat, staffPos.lng, session.customerLat, session.customerLng)
                    : null;
                  const eta = distance ? Math.round((distance / 30) * 60) : null;

                  return (
                    <div
                      key={session.bookingId}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedBooking === session.bookingId
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50",
                        stale && "border-amber-300 bg-amber-50 dark:bg-amber-950/20"
                      )}
                      onClick={() => setSelectedBooking(session.bookingId)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">#{session.bookingId}</span>
                        {stale && (
                          <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Stale
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Staff:</span> {session.staffName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Customer:</span> {session.customerName}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        {distance !== null && (
                          <span className="text-blue-600 font-medium">
                            {distance.toFixed(1)} km
                          </span>
                        )}
                        {eta !== null && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            ~{eta} min
                          </span>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {session.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
