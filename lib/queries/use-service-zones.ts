"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { QUERY_KEYS } from "./query-keys";
import type {
  ServiceZone,
  CreateZonePayload,
} from "@/components/maps/ServiceAreaDrawer";

interface ServiceZonesResponse {
  zones: ServiceZone[];
}

/**
 * Hook to fetch all service zones for a business
 */
export function useServiceZones(businessId: number | undefined) {
  return useQuery<ServiceZone[]>({
    queryKey: [QUERY_KEYS.PROVIDER_SERVICE_ZONES, businessId],
    queryFn: async () => {
      const response = await api.get<ServiceZonesResponse>(
        `/service-zones/business/${businessId}`
      );
      // Map snake_case API response to camelCase frontend types
      return (response.zones ?? []).map((zone: any) => ({
        id: zone.id,
        name: zone.name,
        zoneType: zone.zone_type || zone.zoneType,
        geometry: zone.geometry || null,
        centerLat: zone.center_lat != null ? Number(zone.center_lat) : undefined,
        centerLng: zone.center_lng != null ? Number(zone.center_lng) : undefined,
        radiusKm: zone.radius_km != null ? Number(zone.radius_km) : undefined,
        h3Cells: zone.h3_cells || undefined,
        pricingMultiplier: Number(zone.pricing_multiplier || zone.pricingMultiplier || 1),
        color: zone.color,
        isActive: zone.is_active ?? zone.isActive ?? true,
      }));
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Hook to create a new service zone
 */
export function useCreateServiceZone(businessId: number | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (zone: CreateZonePayload) => {
      return api.post("/service-zones", {
        businessId,
        ...zone,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROVIDER_SERVICE_ZONES, businessId],
      });
    },
  });
}

/**
 * Hook to update an existing service zone
 */
export function useUpdateServiceZone(businessId: number | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      zoneId,
      updates,
    }: {
      zoneId: number;
      updates: Partial<ServiceZone>;
    }) => {
      return api.put(`/service-zones/${zoneId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROVIDER_SERVICE_ZONES, businessId],
      });
    },
  });
}

/**
 * Hook to delete (soft-delete) a service zone
 */
export function useDeleteServiceZone(businessId: number | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (zoneId: number) => {
      return api.delete(`/service-zones/${zoneId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.PROVIDER_SERVICE_ZONES, businessId],
      });
    },
  });
}
