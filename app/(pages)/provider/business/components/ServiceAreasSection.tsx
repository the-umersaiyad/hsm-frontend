"use client";

import { MapPin, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ServiceAreaDrawer } from "@/components/maps/ServiceAreaDrawer";
import {
  useServiceZones,
  useCreateServiceZone,
  useUpdateServiceZone,
  useDeleteServiceZone,
} from "@/lib/queries/use-service-zones";
import { useCurrentSubscription } from "@/lib/queries/use-provider-subscription";
import { ZoneUsageBanner } from "@/components/provider/zones/ZoneUsageBanner";
import { toast } from "sonner";
import type {
  ServiceZone,
  CreateZonePayload,
} from "@/components/maps/ServiceAreaDrawer";

interface ServiceAreasSectionProps {
  businessId: number;
}

export function ServiceAreasSection({ businessId }: ServiceAreasSectionProps) {
  const { data: zones = [], isLoading } = useServiceZones(businessId);
  const { data: subscription } = useCurrentSubscription();
  const createZone = useCreateServiceZone(businessId);
  const updateZone = useUpdateServiceZone(businessId);
  const deleteZone = useDeleteServiceZone(businessId);

  const maxZones = subscription?.planMaxZones || 1;
  const maxZoneRadiusKm = parseFloat(subscription?.planMaxZoneRadiusKm || "2.0");
  const activeZoneCount = zones.filter((z) => z.isActive).length;
  const isAtLimit = activeZoneCount >= maxZones;

  const handleZoneSave = async (zone: CreateZonePayload) => {
    try {
      await createZone.mutateAsync(zone);
      toast.success("Service zone created", {
        description: `"${zone.name}" has been added to your service areas.`,
      });
    } catch (error: any) {
      const message =
        error?.message || "Failed to create service zone. Please try again.";
      if (message.includes("limit reached") || message.includes("Upgrade your plan") || message.includes("exceeds your plan limit")) {
        toast.warning("Limit Reached", { description: message });
      } else {
        toast.error("Failed to create zone", { description: message });
      }
    }
  };

  const handleZoneUpdate = async (
    zoneId: number,
    updates: Partial<ServiceZone>
  ) => {
    try {
      await updateZone.mutateAsync({ zoneId, updates });
      toast.success("Service zone updated");
    } catch (error: any) {
      const message =
        error?.message || "Failed to update service zone. Please try again.";
      if (message.includes("limit reached") || message.includes("Upgrade your plan")) {
        toast.warning("Limit Reached", { description: message });
      } else {
        toast.error("Failed to update zone", { description: message });
      }
    }
  };

  const handleZoneDelete = async (zoneId: number) => {
    try {
      await deleteZone.mutateAsync(zoneId);
      toast.success("Service zone deleted");
    } catch (error: any) {
      const message =
        error?.message || "Failed to delete service zone. Please try again.";
      toast.error("Failed to delete zone", { description: message });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Service Areas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              Loading service areas...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Service Areas
          </CardTitle>
          <Badge variant="outline">
            {activeZoneCount} / {maxZones} zone{maxZones !== 1 ? "s" : ""}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Define the geographic areas where you offer services. Draw circles,
          polygons, freehand shapes, or stamp hexagonal cells on the map.
        </p>
      </CardHeader>
      <CardContent>
        <ZoneUsageBanner
          activeZoneCount={activeZoneCount}
          maxZones={maxZones}
          maxZoneRadiusKm={maxZoneRadiusKm}
        />
        <ServiceAreaDrawer
          businessId={businessId}
          existingZones={zones}
          onZoneSave={handleZoneSave}
          onZoneUpdate={handleZoneUpdate}
          onZoneDelete={handleZoneDelete}
          maxZoneRadiusKm={maxZoneRadiusKm}
          isAtZoneLimit={isAtLimit}
        />
      </CardContent>
    </Card>
  );
}
