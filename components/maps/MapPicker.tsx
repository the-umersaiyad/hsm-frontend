"use client";

import { useState, useCallback } from "react";
import {
  Map,
  AdvancedMarker,
  useMapsLibrary,
  MapMouseEvent,
} from "@vis.gl/react-google-maps";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Crosshair, Loader2 } from "lucide-react";
import { reverseGeocodeFullAddress } from "@/lib/geocodeUtils";

export interface MapPickerAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
  onAddressResolve?: (address: MapPickerAddress) => void;
  className?: string;
}

// Default center: India
const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };
const DEFAULT_ZOOM = 5;

export function MapPicker({
  initialLat,
  initialLng,
  onLocationSelect,
  onAddressResolve,
  className,
}: MapPickerProps) {
  // Load geocoding library
  useMapsLibrary("geocoding");

  const [markerPosition, setMarkerPosition] = useState<{
    lat: number;
    lng: number;
  }>(
    initialLat && initialLng
      ? { lat: initialLat, lng: initialLng }
      : DEFAULT_CENTER
  );
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [mapCenter, setMapCenter] = useState(
    initialLat && initialLng
      ? { lat: initialLat, lng: initialLng }
      : DEFAULT_CENTER
  );
  const [zoom, setZoom] = useState(
    initialLat && initialLng ? 15 : DEFAULT_ZOOM
  );

  // Handle marker drag end
  const handleMarkerDragEnd = useCallback(
    async (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;

      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      setMarkerPosition({ lat, lng });
      onLocationSelect(lat, lng);

      // Reverse geocode the new position
      if (onAddressResolve) {
        setIsGeocoding(true);
        try {
          const address = await reverseGeocodeFullAddress(lat, lng);
          if (address) {
            onAddressResolve(address);
          }
        } finally {
          setIsGeocoding(false);
        }
      }
    },
    [onLocationSelect, onAddressResolve]
  );

  // Handle map click to move marker
  const handleMapClick = useCallback(
    async (event: MapMouseEvent) => {
      const detail = event.detail;
      if (!detail.latLng) return;

      const lat = detail.latLng.lat;
      const lng = detail.latLng.lng;

      setMarkerPosition({ lat, lng });
      onLocationSelect(lat, lng);

      // Reverse geocode the clicked position
      if (onAddressResolve) {
        setIsGeocoding(true);
        try {
          const address = await reverseGeocodeFullAddress(lat, lng);
          if (address) {
            onAddressResolve(address);
          }
        } finally {
          setIsGeocoding(false);
        }
      }
    },
    [onLocationSelect, onAddressResolve]
  );

  // Use current location
  const handleUseCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setMarkerPosition({ lat, lng });
        setMapCenter({ lat, lng });
        setZoom(15);
        onLocationSelect(lat, lng);

        // Reverse geocode
        if (onAddressResolve) {
          setIsGeocoding(true);
          try {
            const address = await reverseGeocodeFullAddress(lat, lng);
            if (address) {
              onAddressResolve(address);
            }
          } finally {
            setIsGeocoding(false);
          }
        }

        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onLocationSelect, onAddressResolve]);

  return (
    <div className={cn("relative rounded-md overflow-hidden border", className)}>
      <Map
        center={mapCenter}
        zoom={zoom}
        mapId="map-picker"
        gestureHandling="greedy"
        disableDefaultUI={false}
        zoomControl={true}
        streetViewControl={false}
        mapTypeControl={false}
        fullscreenControl={false}
        style={{ width: "100%", height: "100%" }}
        onClick={handleMapClick}
        onCameraChanged={(ev) => {
          setMapCenter(ev.detail.center);
          setZoom(ev.detail.zoom);
        }}
      >
        <AdvancedMarker
          position={markerPosition}
          draggable={true}
          onDragEnd={handleMarkerDragEnd}
        >
          <div className="relative">
            {/* Marker pin */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                {isGeocoding ? (
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                ) : (
                  <Crosshair className="h-4 w-4 text-white" />
                )}
              </div>
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-8 border-l-transparent border-r-transparent border-t-primary -mt-0.5" />
            </div>
          </div>
        </AdvancedMarker>
      </Map>

      {/* Use Current Location button */}
      <div className="absolute bottom-3 left-3 z-10">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="shadow-md"
        >
          {isLocating ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Crosshair className="h-4 w-4 mr-1.5" />
          )}
          Use Current Location
        </Button>
      </div>

      {/* Geocoding indicator */}
      {isGeocoding && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-muted-foreground shadow-sm border">
          Resolving address...
        </div>
      )}
    </div>
  );
}
