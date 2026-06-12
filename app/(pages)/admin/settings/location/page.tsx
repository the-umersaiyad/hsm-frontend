"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  Clock,
  Ruler,
  Radio,
  Layers,
  Plus,
  Trash2,
  Loader2,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AdminPageHeader } from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface LocationSettings {
  arrivalRadiusMeters: number;
  gracePeriodMinutes: number;
  minWaitMinutes: number;
  updateIntervalSeconds: number;
  maxZonesPerBusiness: number;
}

interface BusinessOverride {
  businessId: number;
  businessName: string;
  arrivalRadiusMeters: number;
}

interface LocationSettingsResponse {
  settings: LocationSettings;
  overrides: BusinessOverride[];
}

export default function AdminLocationSettingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin_location_settings"],
    queryFn: () => api.get<LocationSettingsResponse>("/admin/location-settings"),
  });

  const [settings, setSettings] = useState<LocationSettings>({
    arrivalRadiusMeters: 50,
    gracePeriodMinutes: 30,
    minWaitMinutes: 15,
    updateIntervalSeconds: 5,
    maxZonesPerBusiness: 20,
  });

  const [overrides, setOverrides] = useState<BusinessOverride[]>([]);
  const [newOverrideBusinessId, setNewOverrideBusinessId] = useState("");
  const [newOverrideRadius, setNewOverrideRadius] = useState("50");

  useEffect(() => {
    if (data) {
      setSettings(data.settings);
      setOverrides(data.overrides || []);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: { settings: LocationSettings; overrides: BusinessOverride[] }) => {
      return api.put("/admin/location-settings", payload);
    },
    onSuccess: () => {
      toast.success("Location settings saved successfully");
      queryClient.invalidateQueries({ queryKey: ["admin_location_settings"] });
    },
    onError: () => toast.error("Failed to save settings"),
  });

  const handleSave = () => {
    if (settings.arrivalRadiusMeters < 10 || settings.arrivalRadiusMeters > 500) {
      toast.error("Arrival radius must be between 10m and 500m");
      return;
    }
    if (settings.gracePeriodMinutes < 5 || settings.gracePeriodMinutes > 120) {
      toast.error("Grace period must be between 5 and 120 minutes");
      return;
    }
    saveMutation.mutate({ settings, overrides });
  };

  const addOverride = () => {
    const businessId = parseInt(newOverrideBusinessId);
    const radius = parseInt(newOverrideRadius);
    if (!businessId || !radius) {
      toast.error("Please enter valid business ID and radius");
      return;
    }
    if (overrides.some((o) => o.businessId === businessId)) {
      toast.error("Override already exists for this business");
      return;
    }
    setOverrides([...overrides, { businessId, businessName: `Business #${businessId}`, arrivalRadiusMeters: radius }]);
    setNewOverrideBusinessId("");
    setNewOverrideRadius("50");
  };

  const removeOverride = (businessId: number) => {
    setOverrides(overrides.filter((o) => o.businessId !== businessId));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Location Settings"
        description="Configure geo-fence, arrival, and tracking parameters."
        showRefresh={false}
      />

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            Global Location Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                Arrival Radius (meters)
              </Label>
              <Input
                type="number"
                min={10}
                max={500}
                value={settings.arrivalRadiusMeters}
                onChange={(e) => setSettings({ ...settings, arrivalRadiusMeters: parseInt(e.target.value) || 50 })}
              />
              <p className="text-xs text-muted-foreground">
                Distance threshold for auto-arrival detection (10-500m)
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Grace Period (minutes)
              </Label>
              <Input
                type="number"
                min={5}
                max={120}
                value={settings.gracePeriodMinutes}
                onChange={(e) => setSettings({ ...settings, gracePeriodMinutes: parseInt(e.target.value) || 30 })}
              />
              <p className="text-xs text-muted-foreground">
                Time window after marking customer absent (5-120 min)
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Minimum Wait (minutes)
              </Label>
              <Input
                type="number"
                min={5}
                max={60}
                value={settings.minWaitMinutes}
                onChange={(e) => setSettings({ ...settings, minWaitMinutes: parseInt(e.target.value) || 15 })}
              />
              <p className="text-xs text-muted-foreground">
                Minimum time staff must wait before marking customer absent (5-60 min)
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Radio className="h-4 w-4" />
                Update Interval (seconds)
              </Label>
              <Input
                type="number"
                min={3}
                max={30}
                value={settings.updateIntervalSeconds}
                onChange={(e) => setSettings({ ...settings, updateIntervalSeconds: parseInt(e.target.value) || 5 })}
              />
              <p className="text-xs text-muted-foreground">
                How often staff location is broadcast via WebSocket (3-30s)
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Max Zones per Business
              </Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={settings.maxZonesPerBusiness}
                onChange={(e) => setSettings({ ...settings, maxZonesPerBusiness: parseInt(e.target.value) || 20 })}
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of service zones a business can create (1-50)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-Business Overrides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-purple-500" />
            Per-Business Arrival Radius Overrides
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Override the default arrival radius for specific businesses that need different thresholds.
          </p>

          {/* Existing overrides */}
          {overrides.length > 0 && (
            <div className="space-y-2">
              {overrides.map((override) => (
                <div
                  key={override.businessId}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">ID: {override.businessId}</Badge>
                    <span className="text-sm font-medium">{override.businessName}</span>
                    <span className="text-sm text-muted-foreground">
                      → {override.arrivalRadiusMeters}m
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOverride(override.businessId)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add new override */}
          <div className="flex items-end gap-3 pt-2 border-t">
            <div className="space-y-1">
              <Label className="text-xs">Business ID</Label>
              <Input
                type="number"
                placeholder="e.g. 5"
                value={newOverrideBusinessId}
                onChange={(e) => setNewOverrideBusinessId(e.target.value)}
                className="w-32"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Radius (m)</Label>
              <Input
                type="number"
                placeholder="e.g. 100"
                value={newOverrideRadius}
                onChange={(e) => setNewOverrideRadius(e.target.value)}
                className="w-32"
              />
            </div>
            <Button variant="outline" size="sm" onClick={addOverride}>
              <Plus className="h-4 w-4 mr-1" />
              Add Override
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? "Saving..." : "Save Location Settings"}
        </Button>
      </div>
    </div>
  );
}
