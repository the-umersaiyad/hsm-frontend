"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Map, useMap, AdvancedMarker } from "@vis.gl/react-google-maps";
import {
  Search,
  EyeOff,
  AlertCircle,
  Loader2,
  Radio,
  MapPin,
  Clock,
  AlertTriangle,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { useStaffLocationSocket } from "@/hooks/useStaffLocationSocket";
import { AdminPageHeader, StatCard } from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AdminServiceAreasSkeleton, AdminLiveTrackingSkeleton } from "@/components/admin/skeletons";

// ─── Service Areas Types & Components ────────────────────────────────────────

interface ServiceZone {
  id: number;
  businessId: number;
  businessName?: string;
  name: string;
  zoneType: "circle" | "polygon" | "freehand" | "hexagon";
  geometry: GeoJSON.Geometry;
  centerLat?: number;
  centerLng?: number;
  radiusKm?: number;
  pricingMultiplier: number;
  color: string;
  isActive: boolean;
  createdAt: string;
}

const BUSINESS_COLORS = [
  "#4285F4", "#EA4335", "#FBBC04", "#34A853",
  "#FF6D01", "#46BDC6", "#7B1FA2", "#C2185B",
];

function ServiceAreaMapContent({
  zones,
  selectedZone,
  onZoneClick,
}: {
  zones: ServiceZone[];
  selectedZone: ServiceZone | null;
  onZoneClick: (zone: ServiceZone) => void;
}) {
  const map = useMap();
  const polygonsRef = useRef<google.maps.Polygon[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);

  useEffect(() => {
    if (!map || !zones.length) return;

    // Clear existing overlays
    polygonsRef.current.forEach((p) => p.setMap(null));
    circlesRef.current.forEach((c) => c.setMap(null));
    polygonsRef.current = [];
    circlesRef.current = [];

    zones.forEach((zone) => {
      const color = zone.color || BUSINESS_COLORS[zone.businessId % BUSINESS_COLORS.length];
      const isSelected = selectedZone?.id === zone.id;

      if (zone.zoneType === "circle" && zone.centerLat && zone.centerLng && zone.radiusKm) {
        const circle = new google.maps.Circle({
          map,
          center: { lat: Number(zone.centerLat), lng: Number(zone.centerLng) },
          radius: Number(zone.radiusKm) * 1000,
          fillColor: color,
          fillOpacity: isSelected ? 0.4 : 0.2,
          strokeColor: color,
          strokeWeight: isSelected ? 3 : 1.5,
          strokeOpacity: zone.isActive ? 1 : 0.4,
          clickable: true,
        });
        circle.addListener("click", () => onZoneClick(zone));
        circlesRef.current.push(circle);
      } else if (zone.geometry && (zone.geometry.type === "Polygon" || zone.geometry.type === "MultiPolygon")) {
        let paths: google.maps.LatLngLiteral[][] = [];

        if (zone.geometry.type === "Polygon") {
          paths = [(zone.geometry as GeoJSON.Polygon).coordinates[0].map(
            ([lng, lat]) => ({ lat: Number(lat), lng: Number(lng) })
          )];
        } else if (zone.geometry.type === "MultiPolygon") {
          paths = (zone.geometry as GeoJSON.MultiPolygon).coordinates.map(
            poly => poly[0].map(([lng, lat]) => ({ lat: Number(lat), lng: Number(lng) }))
          );
        }

        const polygon = new google.maps.Polygon({
          map,
          paths: paths,
          fillColor: color,
          fillOpacity: isSelected ? 0.4 : 0.2,
          strokeColor: color,
          strokeWeight: isSelected ? 3 : 1.5,
          strokeOpacity: zone.isActive ? 1 : 0.4,
          clickable: true,
        });
        polygon.addListener("click", () => onZoneClick(zone));
        polygonsRef.current.push(polygon);
      }
    });

    return () => {
      polygonsRef.current.forEach((p) => p.setMap(null));
      circlesRef.current.forEach((c) => c.setMap(null));
    };
  }, [map, zones, selectedZone, onZoneClick]);

  return null;
}

// ─── Live Tracking Types & Components ────────────────────────────────────────

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

// ─── Live Tracking Section ───────────────────────────────────────────────────

function LiveTrackingSection() {
  const { isReady, isLoading: mapsLoading } = useGoogleMaps();
  const [selectedBooking, setSelectedBooking] = useState<number | null>(null);
  const [locationUpdates, setLocationUpdates] = useState<Record<number, { lat: number; lng: number; timestamp: number }>>({});
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Update current time every 30s to re-evaluate staleness
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const { data: sessions = [], isLoading, refetch } = useQuery({
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

  const isStale = useCallback((session: ActiveSession) => {
    const update = locationUpdates[session.bookingId];
    if (!update) return !session.lastUpdate;
    const elapsed = currentTime - update.timestamp;
    return elapsed > 2 * 60 * 1000; // 2 minutes
  }, [locationUpdates, currentTime]);

  const getDefaultCenter = () => {
    if (selectedBooking) {
      const update = locationUpdates[selectedBooking];
      const session = sessions.find((s) => s.bookingId === selectedBooking);
      if (update) return { lat: Number(update.lat), lng: Number(update.lng) };
      if (session?.staffLat && session?.staffLng) return { lat: Number(session.staffLat), lng: Number(session.staffLng) };
      if (session) return { lat: Number(session.customerLat), lng: Number(session.customerLng) };
    }
    return { lat: 20.5937, lng: 78.9629 };
  };

  const getDefaultZoom = () => (selectedBooking ? 14 : 5);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  if (isLoading) {
    return <AdminLiveTrackingSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Radio className="h-5 w-5 text-green-500" />
          Live Staff Tracking
        </h2>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

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
          <Card className="overflow-hidden p-0">
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
                    defaultCenter={getDefaultCenter()}
                    defaultZoom={getDefaultZoom()}
                    mapId="admin-live-tracking"
                    gestureHandling="greedy"
                    disableDefaultUI={false}
                  >
                    {sessions.map((session) => {
                      const update = locationUpdates[session.bookingId];
                      const staffPos = update
                        ? { lat: Number(update.lat), lng: Number(update.lng) }
                        : session.staffLat && session.staffLng
                          ? { lat: Number(session.staffLat), lng: Number(session.staffLng) }
                          : null;

                      const customerPos = {
                        lat: Number(session.customerLat),
                        lng: Number(session.customerLng),
                      };

                      // Skip if customer coordinates are invalid
                      if (isNaN(customerPos.lat) || isNaN(customerPos.lng)) return null;

                      return (
                        <div key={session.bookingId}>
                          {/* Customer marker */}
                          <AdvancedMarker
                            position={customerPos}
                            title={`Customer: ${session.customerName}`}
                          >
                            <div className="bg-blue-500 text-white rounded-full p-1.5 shadow-lg">
                              <User className="h-4 w-4" />
                            </div>
                          </AdvancedMarker>
                          {/* Staff marker */}
                          {staffPos && !isNaN(staffPos.lat) && !isNaN(staffPos.lng) && (
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
            <CardContent className="space-y-3 min-h-[500px] lg:min-h-[600px] h-[calc(100vh-300px)] overflow-y-auto">
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No active tracking sessions
                </p>
              ) : (
                sessions.map((session) => {
                  const update = locationUpdates[session.bookingId];
                  const stale = isStale(session);
                  const staffPos = update
                    ? { lat: Number(update.lat), lng: Number(update.lng) }
                    : session.staffLat && session.staffLng
                      ? { lat: Number(session.staffLat), lng: Number(session.staffLng) }
                      : null;

                  const distance = staffPos
                    ? calculateDistance(
                      Number(staffPos.lat),
                      Number(staffPos.lng),
                      Number(session.customerLat),
                      Number(session.customerLng)
                    )
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

// ─── Service Areas Section ───────────────────────────────────────────────────

function ServiceAreasSection() {
  const queryClient = useQueryClient();
  const { isReady, isLoading: mapsLoading } = useGoogleMaps();

  const [searchTerm, setSearchTerm] = useState("");
  const [zoneTypeFilter, setZoneTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedZone, setSelectedZone] = useState<ServiceZone | null>(null);

  const { data: zones = [], isLoading } = useQuery({
    queryKey: ["admin_service_zones", searchTerm, zoneTypeFilter, statusFilter],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.set("search", searchTerm);
        if (zoneTypeFilter !== "all") params.set("zoneType", zoneTypeFilter);
        if (statusFilter !== "all") params.set("isActive", statusFilter === "active" ? "true" : "false");
        const query = params.toString();
        const response = await api.get<Record<string, unknown>>(`/admin/service-zones${query ? `?${query}` : ""}`);
        const zonesData = (response as Record<string, unknown>).zones || response || [];
        return Array.isArray(zonesData) ? zonesData.map((z: Record<string, unknown>) => ({
          ...z,
          zoneType: z.zone_type || z.zoneType,
          businessId: z.business_id || z.businessId,
          businessName: z.business_name || z.businessName,
          centerLat: z.center_lat ? Number(z.center_lat) : undefined,
          centerLng: z.center_lng ? Number(z.center_lng) : undefined,
          radiusKm: z.radius_km ? Number(z.radius_km) : undefined,
          pricingMultiplier: Number((z.pricing_multiplier as string) || "1"),
          isActive: z.is_active ?? z.isActive ?? true,
          createdAt: z.created_at || z.createdAt,
          geometry: z.geometry_geojson ? JSON.parse(z.geometry_geojson as string) : z.geometry,
        })) as ServiceZone[] : [];
      } catch {
        return [];
      }
    },
  });

  const disableMutation = useMutation({
    mutationFn: async (zoneId: number) => {
      return api.put(`/admin/service-zones/${zoneId}/disable`, {});
    },
    onSuccess: () => {
      toast.success("Zone disabled successfully");
      queryClient.invalidateQueries({ queryKey: ["admin_service_zones"] });
      setSelectedZone(null);
    },
    onError: () => toast.error("Failed to disable zone"),
  });

  const handleZoneClick = useCallback((zone: ServiceZone) => {
    setSelectedZone(zone);
  }, []);

  if (isLoading) {
    return <AdminServiceAreasSkeleton />;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <MapPin className="h-5 w-5 text-blue-500" />
        Service Areas
      </h2>

      {/* Summary Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 mb-6">
        <StatCard
          title="Total Zones"
          value={zones.length}
          icon={MapPin}
          variant="blue"
        />
        <StatCard
          title="Active Zones"
          value={zones.filter((z) => z.isActive).length}
          icon={Radio}
          variant="emerald"
        />
        <StatCard
          title="Inactive Zones"
          value={zones.filter((z) => !z.isActive).length}
          icon={EyeOff}
          variant="default"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by business name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={zoneTypeFilter} onValueChange={setZoneTypeFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Zone Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="circle">Circle</SelectItem>
                <SelectItem value="polygon">Polygon</SelectItem>
                <SelectItem value="freehand">Freehand</SelectItem>
                <SelectItem value="hexagon">Hexagon</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden p-0">
            <CardContent className="p-0">
              {mapsLoading ? (
                <div className="min-h-[500px] lg:min-h-[600px] h-[calc(100vh-300px)] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !isReady ? (
                <div className="min-h-[500px] lg:min-h-[600px] h-[calc(100vh-300px)] flex items-center justify-center text-muted-foreground">
                  <AlertCircle className="h-6 w-6 mr-2" />
                  Google Maps unavailable
                </div>
              ) : (
                <div className="relative min-h-[500px] lg:min-h-[600px] h-[calc(100vh-300px)] w-full">
                  <Map
                    defaultCenter={{ lat: 20.5937, lng: 78.9629 }}
                    defaultZoom={5}
                    mapId="admin-service-areas"
                    gestureHandling="greedy"
                    disableDefaultUI={false}
                  >
                    <ServiceAreaMapContent
                      zones={zones}
                      selectedZone={selectedZone}
                      onZoneClick={handleZoneClick}
                    />
                  </Map>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Zone Details Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedZone ? "Zone Details" : "Select a Zone"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedZone ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Business</p>
                    <p className="font-medium">{selectedZone.businessName || `Business #${selectedZone.businessId}`}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Zone Name</p>
                    <p className="font-medium">{selectedZone.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedZone.isActive ? "default" : "secondary"}>
                      {selectedZone.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">{selectedZone.zoneType}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pricing Multiplier</p>
                    <p className="font-medium">{selectedZone.pricingMultiplier}x</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">Color</p>
                    <div
                      className="w-5 h-5 rounded border"
                      style={{ backgroundColor: selectedZone.color }}
                    />
                  </div>
                  <div className="pt-4 border-t space-y-2">
                    {selectedZone.isActive && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => disableMutation.mutate(selectedZone.id)}
                        disabled={disableMutation.isPending}
                      >
                        <EyeOff className="h-4 w-4 mr-2" />
                        {disableMutation.isPending ? "Disabling..." : "Disable Zone"}
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Click on a zone on the map to view its details and manage it.
                </p>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ServiceAreasAndLiveTrackingPage() {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Service Areas & Live Tracking"
        description="Monitor active staff sessions and manage business service zones."
        showRefresh={false}
      />

      {/* Section 1: Service Areas */}
      <ServiceAreasSection />

      {/* Section 2: Live Staff Tracking */}
      <LiveTrackingSection />
    </div>
  );
}
