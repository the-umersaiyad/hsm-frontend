"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Map, useMap } from "@vis.gl/react-google-maps";
import * as turf from "@turf/turf";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { getH3CellAtPoint, getH3CellBoundary } from "@/lib/h3Utils";
import {
  Circle,
  Hexagon,
  Pentagon,
  Pencil,
  Trash2,
  Plus,
  MousePointer2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ServiceZone {
  id: number;
  name: string;
  zoneType: "circle" | "polygon" | "freehand" | "hexagon";
  geometry: GeoJSON.Geometry;
  centerLat?: number;
  centerLng?: number;
  radiusKm?: number;
  h3Cells?: string[];
  pricingMultiplier: number;
  color: string;
  isActive: boolean;
}

export interface CreateZonePayload {
  name: string;
  zoneType: string;
  geometry: GeoJSON.Geometry;
  centerLat?: number;
  centerLng?: number;
  radiusKm?: number;
  h3Cells?: string[];
  pricingMultiplier: number;
  color: string;
}

export interface ServiceAreaDrawerProps {
  businessId: number;
  existingZones: ServiceZone[];
  onZoneSave: (zone: CreateZonePayload) => Promise<void>;
  onZoneUpdate: (zoneId: number, updates: Partial<ServiceZone>) => Promise<void>;
  onZoneDelete: (zoneId: number) => Promise<void>;
  maxZoneRadiusKm?: number;
  isAtZoneLimit?: boolean;
}

type DrawingMode = "select" | "circle" | "polygon" | "freehand" | "hexagon";

interface PendingZone {
  zoneType: "circle" | "polygon" | "freehand" | "hexagon";
  geometry: GeoJSON.Geometry;
  centerLat?: number;
  centerLng?: number;
  radiusKm?: number;
  h3Cells?: string[];
}

const DEFAULT_COLORS = [
  "#4285F4", "#EA4335", "#FBBC04", "#34A853",
  "#FF6D01", "#46BDC6", "#7B1FA2", "#C2185B",
  "#00897B", "#6D4C41",
];

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };
const DEFAULT_ZOOM = 5;

// ─── Douglas-Peucker Simplification ─────────────────────────────────────────

function perpendicularDistance(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): number {
  const [x, y] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) {
    return Math.sqrt((x - x1) ** 2 + (y - y1) ** 2);
  }
  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  const clampedT = Math.max(0, Math.min(1, t));
  const projX = x1 + clampedT * dx;
  const projY = y1 + clampedT * dy;
  return Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
}

function douglasPeucker(
  points: [number, number][],
  epsilon: number
): [number, number][] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIdx = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = douglasPeucker(points.slice(0, maxIdx + 1), epsilon);
    const right = douglasPeucker(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [start, end];
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ServiceAreaDrawer({
  existingZones,
  onZoneSave,
  onZoneUpdate,
  onZoneDelete,
  maxZoneRadiusKm = 200,
  isAtZoneLimit = false,
}: ServiceAreaDrawerProps) {
  const map = useMap();
  const { isReady, isLoading, isError } = useGoogleMaps();

  const [drawingMode, setDrawingMode] = useState<DrawingMode>("select");
  const [pendingZone, setPendingZone] = useState<PendingZone | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [zoneName, setZoneName] = useState("");
  const [pricingMultiplier, setPricingMultiplier] = useState(1.0);
  const [saving, setSaving] = useState(false);
  const [radiusWarning, setRadiusWarning] = useState<string | null>(null);

  // Auto-assign color based on existing zones count
  const nextColor = DEFAULT_COLORS[existingZones.length % DEFAULT_COLORS.length];
  const zoneColor = nextColor;

  // Drawing state refs
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const freehandPathRef = useRef<[number, number][]>([]);
  const freehandPolylineRef = useRef<google.maps.Polyline | null>(null);
  const isDrawingFreehandRef = useRef(false);
  const hexCellsRef = useRef<string[]>([]);
  const hexPolygonsRef = useRef<google.maps.Polygon[]>([]);
  const isHexDrawingRef = useRef(false);
  const zoneOverlaysRef = useRef<(google.maps.Circle | google.maps.Polygon)[]>([]);
  const circleOverlayRef = useRef<google.maps.Circle | null>(null);

  // ─── Zone Overlay Rendering ──────────────────────────────────────────────

  const renderExistingZones = useCallback(() => {
    // Clear previous overlays
    zoneOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
    zoneOverlaysRef.current = [];

    if (!map) return;

    existingZones
      .filter((zone) => zone.isActive)
      .forEach((zone) => {
        if (zone.zoneType === "circle" && zone.centerLat && zone.centerLng && zone.radiusKm) {
          const circle = new google.maps.Circle({
            map,
            center: { lat: zone.centerLat, lng: zone.centerLng },
            radius: zone.radiusKm * 1000,
            fillColor: zone.color,
            fillOpacity: 0.2,
            strokeColor: zone.color,
            strokeWeight: 2,
            clickable: false,
          });
          zoneOverlaysRef.current.push(circle);
        } else if (
          zone.geometry.type === "Polygon" ||
          zone.geometry.type === "MultiPolygon"
        ) {
          const coords =
            zone.geometry.type === "Polygon"
              ? zone.geometry.coordinates[0]
              : zone.geometry.coordinates[0][0];

          const path = coords.map(([lng, lat]) => ({ lat, lng }));
          const polygon = new google.maps.Polygon({
            map,
            paths: path,
            fillColor: zone.color,
            fillOpacity: 0.2,
            strokeColor: zone.color,
            strokeWeight: 2,
            clickable: false,
          });
          zoneOverlaysRef.current.push(polygon);
        }
      });
  }, [map, existingZones]);

  useEffect(() => {
    if (map && isReady) {
      renderExistingZones();
    }
  }, [map, isReady, renderExistingZones]);

  // ─── Drawing Manager Setup (Circle & Polygon modes) ────────────────────────

  useEffect(() => {
    if (!map || !isReady) return;

    const dm = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      circleOptions: {
        editable: true,
        draggable: true,
        fillOpacity: 0.25,
        strokeWeight: 2,
      },
      polygonOptions: {
        editable: true,
        draggable: true,
        fillOpacity: 0.25,
        strokeWeight: 2,
      },
    });

    dm.setMap(map);
    drawingManagerRef.current = dm;

    // Circle complete handler
    const circleListener = google.maps.event.addListener(
      dm,
      "circlecomplete",
      (circle: google.maps.Circle) => {
        const center = circle.getCenter();
        const radiusMeters = circle.getRadius();
        if (!center) return;

        const radiusKm = radiusMeters / 1000;

        // Validate radius
        if (radiusKm < 0.5 || radiusKm > 200) {
          toast.error("Radius must be between 0.5 km and 200 km");
          circle.setMap(null);
          return;
        }

        // Check against plan limit
        if (radiusKm > maxZoneRadiusKm) {
          setRadiusWarning(`Zone exceeds your plan limit of ${maxZoneRadiusKm} km radius`);
        } else {
          setRadiusWarning(null);
        }

        // Store reference for cleanup
        circleOverlayRef.current = circle;

        // Listen for radius changes
        google.maps.event.addListener(circle, "radius_changed", () => {
          const newRadius = circle.getRadius() / 1000;
          if (newRadius < 0.5 || newRadius > 200) {
            toast.error("Radius must be between 0.5 km and 200 km");
            return;
          }
          // Real-time radius validation against plan limit
          if (newRadius > maxZoneRadiusKm) {
            setRadiusWarning(`Zone exceeds your plan limit of ${maxZoneRadiusKm} km radius`);
          } else {
            setRadiusWarning(null);
          }
        });

        // Create GeoJSON circle geometry (approximation as polygon)
        const centerPoint = turf.point([center.lng(), center.lat()]);
        const buffered = turf.buffer(centerPoint, radiusKm, { units: "kilometers" });

        setPendingZone({
          zoneType: "circle",
          geometry: buffered!.geometry,
          centerLat: center.lat(),
          centerLng: center.lng(),
          radiusKm,
        });
        setShowSaveDialog(true);
        dm.setDrawingMode(null);
        setDrawingMode("select");
      }
    );

    // Polygon complete handler
    const polygonListener = google.maps.event.addListener(
      dm,
      "polygoncomplete",
      (polygon: google.maps.Polygon) => {
        const path = polygon.getPath();
        const coords: [number, number][] = [];

        for (let i = 0; i < path.getLength(); i++) {
          const point = path.getAt(i);
          coords.push([point.lng(), point.lat()]);
        }
        // Close the polygon
        coords.push(coords[0]);

        // Validate self-intersection using Turf.js
        const turfPolygon = turf.polygon([coords]);
        const kinked = turf.kinks(turfPolygon);

        if (kinked.features.length > 0) {
          toast.error("Polygon has self-intersections. Please redraw.");
          polygon.setMap(null);
          return;
        }

        // Check bounding radius against plan limit
        const centroid = turf.centroid(turfPolygon);
        const bbox = turf.bbox(turfPolygon);
        const bboxCorner = turf.point([bbox[2], bbox[3]]);
        const boundingRadiusKm = turf.distance(centroid, bboxCorner, { units: "kilometers" });

        if (boundingRadiusKm > maxZoneRadiusKm) {
          setRadiusWarning(`Zone exceeds your plan limit of ${maxZoneRadiusKm} km radius (bounding radius: ${boundingRadiusKm.toFixed(1)} km)`);
        } else {
          setRadiusWarning(null);
        }

        const geometry: GeoJSON.Polygon = {
          type: "Polygon",
          coordinates: [coords],
        };

        setPendingZone({
          zoneType: "polygon",
          geometry,
        });
        setShowSaveDialog(true);
        polygon.setMap(null);
        dm.setDrawingMode(null);
        setDrawingMode("select");
      }
    );

    return () => {
      google.maps.event.removeListener(circleListener);
      google.maps.event.removeListener(polygonListener);
      dm.setMap(null);
    };
  }, [map, isReady, maxZoneRadiusKm]);

  // ─── Update Drawing Manager mode ──────────────────────────────────────────

  useEffect(() => {
    if (!drawingManagerRef.current) return;

    if (drawingMode === "circle") {
      drawingManagerRef.current.setDrawingMode(
        google.maps.drawing.OverlayType.CIRCLE
      );
    } else if (drawingMode === "polygon") {
      drawingManagerRef.current.setDrawingMode(
        google.maps.drawing.OverlayType.POLYGON
      );
    } else {
      drawingManagerRef.current.setDrawingMode(null);
    }
  }, [drawingMode]);

  // ─── Freehand Drawing Mode ─────────────────────────────────────────────────

  useEffect(() => {
    if (!map || drawingMode !== "freehand") return;

    // Disable map dragging during freehand
    map.setOptions({ draggable: false });

    const handleMouseDown = (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      isDrawingFreehandRef.current = true;
      freehandPathRef.current = [[e.latLng.lat(), e.latLng.lng()]];

      const polyline = new google.maps.Polyline({
        map,
        path: [e.latLng],
        strokeColor: zoneColor,
        strokeWeight: 3,
      });
      freehandPolylineRef.current = polyline;
    };

    const handleMouseMove = (e: google.maps.MapMouseEvent) => {
      if (!isDrawingFreehandRef.current || !e.latLng) return;
      freehandPathRef.current.push([e.latLng.lat(), e.latLng.lng()]);
      freehandPolylineRef.current?.getPath().push(e.latLng);
    };

    const handleMouseUp = () => {
      if (!isDrawingFreehandRef.current) return;
      isDrawingFreehandRef.current = false;

      // Clean up polyline
      freehandPolylineRef.current?.setMap(null);
      freehandPolylineRef.current = null;

      const rawPath = freehandPathRef.current;
      if (rawPath.length < 4) {
        toast.error("Draw a larger shape");
        return;
      }

      // Simplify with Douglas-Peucker (epsilon in degrees, ~0.001 ≈ 100m)
      const simplified = douglasPeucker(rawPath, 0.001);

      if (simplified.length < 4) {
        toast.error("Shape too simple after simplification. Draw a larger area.");
        return;
      }

      // Convert to [lng, lat] for GeoJSON and close the polygon
      const coords: [number, number][] = simplified.map(([lat, lng]) => [lng, lat]);
      coords.push(coords[0]);

      // Validate with Turf.js
      const turfPolygon = turf.polygon([coords]);
      const kinked = turf.kinks(turfPolygon);

      if (kinked.features.length > 0) {
        toast.error("Freehand shape has self-intersections. Please redraw.");
        return;
      }

      // Check minimum area (0.1 sq km)
      const area = turf.area(turfPolygon) / 1_000_000; // sq km
      if (area < 0.1) {
        toast.error("Area must be at least 0.1 sq km. Draw a larger shape.");
        return;
      }

      // Check bounding radius against plan limit
      const centroid = turf.centroid(turfPolygon);
      const bbox = turf.bbox(turfPolygon);
      const bboxCorner = turf.point([bbox[2], bbox[3]]);
      const boundingRadiusKm = turf.distance(centroid, bboxCorner, { units: "kilometers" });

      if (boundingRadiusKm > maxZoneRadiusKm) {
        setRadiusWarning(`Zone exceeds your plan limit of ${maxZoneRadiusKm} km radius (bounding radius: ${boundingRadiusKm.toFixed(1)} km)`);
      } else {
        setRadiusWarning(null);
      }

      const geometry: GeoJSON.Polygon = {
        type: "Polygon",
        coordinates: [coords],
      };

      setPendingZone({
        zoneType: "freehand",
        geometry,
      });
      setShowSaveDialog(true);
      setDrawingMode("select");
    };

    const mouseDownListener = map.addListener("mousedown", handleMouseDown);
    const mouseMoveListener = map.addListener("mousemove", handleMouseMove);
    // Use document mouseup to catch the event even when mouse leaves the map
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      map.setOptions({ draggable: true });
      google.maps.event.removeListener(mouseDownListener);
      google.maps.event.removeListener(mouseMoveListener);
      document.removeEventListener("mouseup", handleMouseUp);
      freehandPolylineRef.current?.setMap(null);
    };
  }, [map, drawingMode, zoneColor, maxZoneRadiusKm]);

  // ─── Hexagon Stamp Mode (CTRL+Click+Drag) ─────────────────────────────────

  const addHexCell = useCallback(
    (lat: number, lng: number) => {
      if (!map) return;
      const cellId = getH3CellAtPoint(lat, lng);

      // Toggle: if already selected, remove it
      const existingIndex = hexCellsRef.current.indexOf(cellId);
      if (existingIndex !== -1) {
        hexCellsRef.current.splice(existingIndex, 1);
        const polygon = hexPolygonsRef.current[existingIndex];
        if (polygon) {
          polygon.setMap(null);
          hexPolygonsRef.current.splice(existingIndex, 1);
        }
        return;
      }

      // Add new cell
      hexCellsRef.current.push(cellId);
      const boundary = getH3CellBoundary(cellId);
      const path = boundary.map(([bLat, bLng]) => ({ lat: bLat, lng: bLng }));

      const polygon = new google.maps.Polygon({
        map,
        paths: path,
        fillColor: zoneColor,
        fillOpacity: 0.4,
        strokeColor: zoneColor,
        strokeWeight: 1,
        clickable: true,
      });

      // Click on existing polygon to remove it
      google.maps.event.addListener(polygon, "click", () => {
        const idx = hexCellsRef.current.indexOf(cellId);
        if (idx !== -1) {
          hexCellsRef.current.splice(idx, 1);
          hexPolygonsRef.current.splice(idx, 1);
          polygon.setMap(null);
        }
      });

      hexPolygonsRef.current.push(polygon);
    },
    [map, zoneColor]
  );

  useEffect(() => {
    if (!map || drawingMode !== "hexagon") return;

    // Simple click-to-add/remove hex cells
    const handleClick = (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      addHexCell(e.latLng.lat(), e.latLng.lng());
    };

    const clickListener = map.addListener("click", handleClick);

    return () => {
      google.maps.event.removeListener(clickListener);
    };
  }, [map, drawingMode, addHexCell]);

  // ─── Hexagon "Done Stamping" handler ───────────────────────────────────────

  const handleDoneHexStamping = () => {
    if (hexCellsRef.current.length === 0) {
      toast.error("Stamp at least one hexagon cell");
      return;
    }

    const cells = hexCellsRef.current;
    const allCoords: [number, number][][] = cells.map((cellId) => {
      const boundary = getH3CellBoundary(cellId);
      const ring: [number, number][] = boundary.map(([lat, lng]) => [lng, lat]);
      ring.push(ring[0]);
      return ring;
    });

    const geometry: GeoJSON.MultiPolygon = {
      type: "MultiPolygon",
      coordinates: allCoords.map((ring) => [ring]),
    };

    setPendingZone({
      zoneType: "hexagon",
      geometry,
      h3Cells: cells,
    });
    setShowSaveDialog(true);
    setDrawingMode("select");
  };

  // ─── Save Zone Handler ─────────────────────────────────────────────────────

  const handleSaveZone = async () => {
    if (!pendingZone || !zoneName.trim()) return;

    setSaving(true);

    // Check for intersection with existing zones using Turf.js
    if (pendingZone.geometry && existingZones.length > 0) {
      try {
        const newZoneFeature = pendingZone.geometry.type === "MultiPolygon"
          ? turf.multiPolygon(pendingZone.geometry.coordinates)
          : turf.polygon((pendingZone.geometry as GeoJSON.Polygon).coordinates);

        for (const existing of existingZones.filter(z => z.isActive)) {
          if (!existing.geometry) continue;
          try {
            const existingFeature = existing.geometry.type === "MultiPolygon"
              ? turf.multiPolygon(existing.geometry.coordinates)
              : turf.polygon((existing.geometry as GeoJSON.Polygon).coordinates);

            const intersection = turf.intersect(
              turf.featureCollection([newZoneFeature, existingFeature])
            );
            if (intersection) {
              toast.error(`Zone intersects with existing zone "${existing.name}". Zones cannot overlap.`);
              setSaving(false);
              return;
            }
          } catch {
            // Skip invalid geometries during intersection check
          }
        }
      } catch {
        // If intersection check fails, allow save (server will validate)
      }
    }

    try {
      await onZoneSave({
        name: zoneName.trim(),
        zoneType: pendingZone.zoneType,
        geometry: pendingZone.geometry,
        centerLat: pendingZone.centerLat,
        centerLng: pendingZone.centerLng,
        radiusKm: pendingZone.radiusKm,
        h3Cells: pendingZone.h3Cells,
        pricingMultiplier,
        color: zoneColor,
      });

      // Clean up
      setShowSaveDialog(false);
      setPendingZone(null);
      setZoneName("");
      setPricingMultiplier(1.0);
      circleOverlayRef.current?.setMap(null);
      circleOverlayRef.current = null;
      hexPolygonsRef.current.forEach((p) => p.setMap(null));
      hexPolygonsRef.current = [];
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save zone");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelDraw = () => {
    setShowSaveDialog(false);
    setPendingZone(null);
    setRadiusWarning(null);
    circleOverlayRef.current?.setMap(null);
    circleOverlayRef.current = null;
    hexPolygonsRef.current.forEach((p) => p.setMap(null));
    hexPolygonsRef.current = [];
  };

  const handleCancelDrawing = () => {
    setDrawingMode("select");
    // Clean up freehand
    freehandPolylineRef.current?.setMap(null);
    freehandPolylineRef.current = null;
    isDrawingFreehandRef.current = false;
    freehandPathRef.current = [];
    // Clean up hexagon
    hexPolygonsRef.current.forEach((p) => p.setMap(null));
    hexPolygonsRef.current = [];
    hexCellsRef.current = [];
    isHexDrawingRef.current = false;
    // Clean up circle overlay
    circleOverlayRef.current?.setMap(null);
    circleOverlayRef.current = null;
  };

  // ─── Mode Selection ────────────────────────────────────────────────────────

  const handleModeChange = (mode: DrawingMode) => {
    if (mode !== "select" && isAtZoneLimit) {
      toast.error("Zone limit reached. Upgrade your plan to create more zones.");
      return;
    }
    setDrawingMode(mode);
  };

  // ─── Loading / Error States ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-lg border bg-muted/50">
        <div className="text-center">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-lg border bg-muted/50">
        <div className="text-center">
          <p className="text-sm text-destructive">
            Failed to load Google Maps. Check your API key configuration.
          </p>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[600px] gap-4">
      {/* Map Area */}
      <div className="relative flex-1 overflow-hidden rounded-lg border">
        {/* Toolbar */}
        <div className="absolute top-3 left-3 z-10 flex gap-1 rounded-lg bg-background/95 p-1 shadow-md backdrop-blur">
          <Button
            variant={drawingMode === "select" ? "default" : "ghost"}
            size="icon-sm"
            onClick={() => handleModeChange("select")}
            title="Select"
          >
            <MousePointer2 className="size-4" />
          </Button>
          <Button
            variant={drawingMode === "circle" ? "default" : "ghost"}
            size="icon-sm"
            onClick={() => handleModeChange("circle")}
            title="Draw Circle"
          >
            <Circle className="size-4" />
          </Button>
          <Button
            variant={drawingMode === "polygon" ? "default" : "ghost"}
            size="icon-sm"
            onClick={() => handleModeChange("polygon")}
            title="Draw Polygon"
          >
            <Pentagon className="size-4" />
          </Button>
          <Button
            variant={drawingMode === "freehand" ? "default" : "ghost"}
            size="icon-sm"
            onClick={() => handleModeChange("freehand")}
            title="Freehand Draw"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant={drawingMode === "hexagon" ? "default" : "ghost"}
            size="icon-sm"
            onClick={() => handleModeChange("hexagon")}
            title="Hexagon Stamp (CTRL+Click+Drag)"
          >
            <Hexagon className="size-4" />
          </Button>
        </div>

        {/* Mode hint */}
        {drawingMode !== "select" && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2 rounded-md bg-background/95 px-3 py-1.5 text-xs text-muted-foreground shadow-md backdrop-blur">
            {drawingMode === "circle" && <span>Click and drag to draw a circle</span>}
            {drawingMode === "polygon" && <span>Click points to draw polygon, double-click to close</span>}
            {drawingMode === "freehand" && <span>Hold mouse and drag to draw, release to finish</span>}
            {drawingMode === "hexagon" && (
              <>
                <span>Click to add/remove hex cells</span>
                <Button
                  size="sm"
                  variant="default"
                  className="h-6 px-2 text-[10px]"
                  onClick={handleDoneHexStamping}
                >
                  Done
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="destructive"
              className="h-6 px-2 text-[10px]"
              onClick={handleCancelDrawing}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Google Map */}
        <Map
          defaultCenter={DEFAULT_CENTER}
          defaultZoom={DEFAULT_ZOOM}
          mapId="service-area-drawer"
          gestureHandling="greedy"
          disableDefaultUI={false}
          className="h-full w-full"
        />
      </div>

      {/* Zone List Panel */}
      <div className="w-80 overflow-y-auto rounded-lg border bg-background p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Service Zones</h3>
          <Badge variant="secondary" className="text-xs">
            {existingZones.filter((z) => z.isActive).length} / {maxZoneRadiusKm < 200 ? "plan limit" : "20"}
          </Badge>
        </div>

        {existingZones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Plus className="mb-2 size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No service zones yet. Use the drawing tools to create one.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {existingZones.map((zone) => (
              <ZoneListItem
                key={zone.id}
                zone={zone}
                onToggle={(active) =>
                  onZoneUpdate(zone.id, { isActive: active })
                }
                onDelete={() => onZoneDelete(zone.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Save Zone Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Service Zone</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Zone Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Zone Name</label>
              <Input
                placeholder="e.g. Downtown Area"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                maxLength={50}
              />
            </div>

            {/* Auto-assigned Color Preview */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Color:</span>
              <div
                className="size-5 rounded-full border"
                style={{ backgroundColor: zoneColor }}
              />
              <span className="text-xs text-muted-foreground">Auto-assigned</span>
            </div>

            {/* Pricing Multiplier */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Pricing Multiplier:{" "}
                <span className="font-normal text-muted-foreground">
                  {pricingMultiplier.toFixed(1)}x
                </span>
              </label>
              <Slider
                min={0.5}
                max={3.0}
                step={0.1}
                value={[pricingMultiplier]}
                onValueChange={([val]) => setPricingMultiplier(val)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.5x</span>
                <span>1.0x (default)</span>
                <span>3.0x</span>
              </div>
            </div>

            {/* Zone Type Badge */}
            {pendingZone && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Type:</span>
                <Badge variant="outline" className="capitalize">
                  {pendingZone.zoneType}
                </Badge>
                {pendingZone.radiusKm && (
                  <Badge variant="secondary">
                    {pendingZone.radiusKm.toFixed(1)} km radius
                  </Badge>
                )}
                {pendingZone.h3Cells && (
                  <Badge variant="secondary">
                    {pendingZone.h3Cells.length} cells
                  </Badge>
                )}
              </div>
            )}

            {/* Radius Warning */}
            {radiusWarning && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                ⚠️ {radiusWarning}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDraw}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveZone}
              disabled={!zoneName.trim() || saving || !!radiusWarning}
            >
              {saving ? "Saving..." : "Save Zone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Zone List Item Component ────────────────────────────────────────────────

interface ZoneListItemProps {
  zone: ServiceZone;
  onToggle: (active: boolean) => void;
  onDelete: () => void;
}

function ZoneListItem({ zone, onToggle, onDelete }: ZoneListItemProps) {
  return (
    <Card className="p-3">
      <div className="flex items-start gap-3">
        {/* Color indicator */}
        <div
          className="mt-0.5 size-4 shrink-0 rounded-full"
          style={{ backgroundColor: zone.color }}
        />

        <div className="min-w-0 flex-1">
          {/* Name and type */}
          <div className="flex items-center gap-2">
            <span
              className={`truncate text-sm font-medium ${
                !zone.isActive ? "text-muted-foreground line-through" : ""
              }`}
            >
              {zone.name}
            </span>
            <Badge variant="outline" className="shrink-0 text-[10px] capitalize">
              {zone.zoneType}
            </Badge>
          </div>

          {/* Pricing */}
          <p className="mt-0.5 text-xs text-muted-foreground">
            Pricing: {Number(zone.pricingMultiplier || 1).toFixed(1)}x
          </p>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <Switch
            size="sm"
            checked={zone.isActive}
            onCheckedChange={onToggle}
          />
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
