"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import {
  BarChart3,
  Download,
  Calendar,
  MapPin,
  TrendingUp,
  AlertTriangle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
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

interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
}

interface CoverageData {
  heatmapPoints: HeatmapPoint[];
  demandGaps: { lat: number; lng: number; label: string }[];
  stats: {
    totalBookings: number;
    coveredAreas: number;
    uncoveredRequests: number;
    avgDistance: number;
  };
}

function HeatmapLayer({ points }: { points: HeatmapPoint[] }) {
  const map = useMap();
  const visualizationLib = useMapsLibrary("visualization");
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);

  useEffect(() => {
    if (!map || !visualizationLib || !points.length) return;

    // Clean up previous heatmap
    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
    }

    const heatmapData = points.map(
      (p) => ({
        location: new google.maps.LatLng(p.lat, p.lng),
        weight: p.weight,
      })
    );

    const heatmap = new visualizationLib.HeatmapLayer({
      data: heatmapData,
      map,
      radius: 30,
      opacity: 0.7,
    });

    heatmapRef.current = heatmap;

    return () => {
      heatmap.setMap(null);
    };
  }, [map, visualizationLib, points]);

  return null;
}

function DemandGapMarkers({ gaps }: { gaps: { lat: number; lng: number; label: string }[] }) {
  const map = useMap();
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  useEffect(() => {
    if (!map || !gaps.length) return;

    // Clear existing markers
    markersRef.current.forEach((m) => (m.map = null));
    markersRef.current = [];

    gaps.forEach((gap) => {
      const content = document.createElement("div");
      content.className = "bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg font-medium";
      content.textContent = gap.label;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: gap.lat, lng: gap.lng },
        content,
        title: gap.label,
      });
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => (m.map = null));
    };
  }, [map, gaps]);

  return null;
}

export default function AdminCoverageAnalyticsPage() {
  const { isReady, isLoading: mapsLoading } = useGoogleMaps();

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState<string>("all");
  const [city, setCity] = useState<string>("all");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin_coverage_analytics", dateFrom, dateTo, category, city],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("dateFrom", dateFrom);
      params.set("dateTo", dateTo);
      if (category !== "all") params.set("category", category);
      if (city !== "all") params.set("city", city);
      return api.get<CoverageData>(`/admin/coverage-analytics?${params.toString()}`);
    },
  });

  const heatmapPoints = data?.heatmapPoints || [];
  const demandGaps = data?.demandGaps || [];
  const stats = data?.stats || { totalBookings: 0, coveredAreas: 0, uncoveredRequests: 0, avgDistance: 0 };

  const handleExportCSV = useCallback(() => {
    if (!heatmapPoints.length) {
      return;
    }
    const headers = "Latitude,Longitude,Weight\n";
    const rows = heatmapPoints.map((p) => `${p.lat},${p.lng},${p.weight}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `coverage-analytics-${dateFrom}-to-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [heatmapPoints, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Coverage Analytics"
        description="Analyze service demand, identify coverage gaps, and optimize service areas."
        onRefresh={() => refetch()}
        actions={
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!heatmapPoints.length}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        }
      />

      {/* Summary Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings.toLocaleString()}
          icon={BarChart3}
          variant="blue"
        />
        <StatCard
          title="Covered Areas"
          value={stats.coveredAreas.toLocaleString()}
          icon={MapPin}
          variant="emerald"
        />
        <StatCard
          title="Uncovered Requests"
          value={stats.uncoveredRequests.toLocaleString()}
          icon={AlertTriangle}
          variant={stats.uncoveredRequests > 0 ? "orange" : "default"}
        />
        <StatCard
          title="Avg Distance"
          value={`${stats.avgDistance.toFixed(1)} km`}
          icon={TrendingUp}
          variant="purple"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="cleaning">Cleaning</SelectItem>
                <SelectItem value="painting">Painting</SelectItem>
              </SelectContent>
            </Select>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                <SelectItem value="mumbai">Mumbai</SelectItem>
                <SelectItem value="delhi">Delhi</SelectItem>
                <SelectItem value="bangalore">Bangalore</SelectItem>
                <SelectItem value="hyderabad">Hyderabad</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Heatmap */}
      <Card className="overflow-hidden pb-0 ">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Coverage Heatmap
            {demandGaps.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {demandGaps.length} demand gaps
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
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
                mapId="admin-coverage-heatmap"
                gestureHandling="greedy"
                disableDefaultUI={false}
              >
                <HeatmapLayer points={heatmapPoints} />
                <DemandGapMarkers gaps={demandGaps} />
              </Map>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
