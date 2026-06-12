"use client";

import { AlertTriangle, ArrowUpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ZoneUsageBannerProps {
  activeZoneCount: number;
  maxZones: number;
  maxZoneRadiusKm?: number;
}

export function ZoneUsageBanner({
  activeZoneCount,
  maxZones,
  maxZoneRadiusKm,
}: ZoneUsageBannerProps) {
  const isAtLimit = activeZoneCount >= maxZones;

  return (
    <div
      className={cn(
        "rounded-lg border p-4 mb-4",
        isAtLimit
          ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
          : "border-border bg-muted/30"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isAtLimit && (
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          )}
          <span className="text-sm font-medium">
            {activeZoneCount} of {maxZones} zone{maxZones !== 1 ? "s" : ""} used
          </span>
          {maxZoneRadiusKm && (
            <span className="text-xs text-muted-foreground">
              · Max {maxZoneRadiusKm} km radius
            </span>
          )}
        </div>
        {isAtLimit && (
          <Badge
            variant="outline"
            className="text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-700"
          >
            Limit reached
          </Badge>
        )}
      </div>
      {isAtLimit && (
        <p className="text-sm text-muted-foreground mt-2">
          Upgrade your plan to create more service zones.
          <Link href="/provider/subscription">
            <Button variant="link" className="h-auto p-0 ml-1 text-sm">
              <ArrowUpCircle className="h-3 w-3 mr-1" />
              Upgrade
            </Button>
          </Link>
        </p>
      )}
    </div>
  );
}
