"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { api } from "@/lib/api";
import { AdminPageHeader, StatCard } from "@/components/admin/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminLocationAuditSkeleton } from "@/components/admin/skeletons";

interface AuditLog {
  id: number;
  eventType: string;
  actorId: number;
  actorName?: string;
  actorRole: string;
  entityType: string;
  entityId: number;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const EVENT_TYPES = [
  { value: "all", label: "All Events" },
  { value: "zone_created", label: "Zone Created" },
  { value: "zone_updated", label: "Zone Updated" },
  { value: "zone_deleted", label: "Zone Deleted" },
  { value: "arrival_marked", label: "Arrival Marked" },
  { value: "customer_absent", label: "Customer Absent" },
  { value: "location_sharing_start", label: "Location Sharing Start" },
  { value: "location_sharing_stop", label: "Location Sharing Stop" },
  { value: "fraud_detected", label: "Fraud Detected" },
];

export default function AdminLocationAuditPage() {
  const [page, setPage] = useState(1);
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const limit = 20;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin_location_audit", page, eventTypeFilter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (eventTypeFilter !== "all") params.set("eventType", eventTypeFilter);
      if (searchTerm) params.set("search", searchTerm);
      return api.get<AuditLogsResponse>(`/admin/location-audit-logs?${params.toString()}`);
    },
  });

  if (isLoading) {
    return <AdminLocationAuditSkeleton />;
  }

  const logs = (data?.logs || []).map((log: any) => ({
    id: log.id,
    eventType: log.event_type || log.eventType || "",
    actorId: log.user_id || log.actorId,
    actorName: log.user_name || log.actorName,
    actorRole: log.actorRole || "user",
    entityType: log.booking_id ? "booking" : log.business_id ? "business" : "system",
    entityId: log.booking_id || log.business_id || 0,
    details: typeof log.metadata === "string" ? log.metadata : JSON.stringify(log.metadata || {}),
    createdAt: log.created_at || log.createdAt,
  }));
  const pagination = data?.pagination;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getEventBadgeVariant = (eventType: string) => {
    if (!eventType) return "outline";
    if (eventType.includes("created")) return "default";
    if (eventType.includes("deleted") || eventType.includes("fraud")) return "destructive";
    if (eventType.includes("absent")) return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Location Audit Logs"
        description="View all location-related events and actions across the platform."
        onRefresh={() => refetch()}
      />

      {/* Summary Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <StatCard
          title="Total Audit Events"
          value={pagination?.total || 0}
          icon={FileText}
          variant="blue"
        />
        <StatCard
          title="Recent Fraud Alerts"
          value={logs.filter(l => l.eventType.includes('fraud')).length}
          icon={AlertCircle}
          variant="red"
        />
        <StatCard
          title="Location Sessions"
          value={logs.filter(l => l.eventType.includes('location_sharing')).length}
          icon={MapPin}
          variant="emerald"
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
                  placeholder="Search by actor name or details..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={eventTypeFilter}
              onValueChange={(v) => {
                setEventTypeFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-52">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((et) => (
                  <SelectItem key={et.value} value={et.value}>
                    {et.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      {pagination && (
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{logs.length}</span> of{" "}
          <span className="font-medium">{pagination.total}</span> logs
        </div>
      )}

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Time</th>
                    <th className="text-left py-3 px-2 font-medium">Event</th>
                    <th className="text-left py-3 px-2 font-medium">Actor</th>
                    <th className="text-left py-3 px-2 font-medium">Entity</th>
                    <th className="text-left py-3 px-2 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={getEventBadgeVariant(log.eventType)} className="text-xs">
                          {log.eventType.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <div>
                          <span className="font-medium">{log.actorName || `User #${log.actorId}`}</span>
                          <span className="text-xs text-muted-foreground ml-1">({log.actorRole})</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-xs">
                        {log.entityType} #{log.entityId}
                      </td>
                      <td className="py-3 px-2 text-xs text-muted-foreground max-w-[200px] truncate">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
