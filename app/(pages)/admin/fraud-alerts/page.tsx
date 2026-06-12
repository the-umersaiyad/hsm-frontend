"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Clock,
  User,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AdminPageHeader, StatCard } from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface FraudFlag {
  id: number;
  bookingId: number;
  staffId: number;
  staffName?: string;
  flagType: "fake_arrival" | "gps_spoofing" | "unrealistic_area";
  details: string;
  severity: "low" | "medium" | "high";
  isResolved: boolean;
  resolvedAt?: string;
  resolvedNote?: string;
  createdAt: string;
}

export default function AdminFraudAlertsPage() {
  const queryClient = useQueryClient();
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<FraudFlag | null>(null);
  const [resolveNote, setResolveNote] = useState("");

  const { data: flags = [], isLoading, refetch } = useQuery({
    queryKey: ["admin_fraud_flags"],
    queryFn: async () => {
      const response = await api.get<any>("/admin/fraud-flags");
      // Backend returns { flags: [...], pagination: {...} }
      return response.flags || response || [];
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, note }: { id: number; note: string }) => {
      return api.put(`/admin/fraud-flags/${id}/resolve`, { note });
    },
    onSuccess: () => {
      toast.success("Fraud flag resolved");
      queryClient.invalidateQueries({ queryKey: ["admin_fraud_flags"] });
      setResolveDialogOpen(false);
      setSelectedFlag(null);
      setResolveNote("");
    },
    onError: () => toast.error("Failed to resolve flag"),
  });

  const handleResolve = (flag: FraudFlag) => {
    setSelectedFlag(flag);
    setResolveNote("");
    setResolveDialogOpen(true);
  };

  const submitResolve = () => {
    if (!selectedFlag || !resolveNote.trim()) {
      toast.error("Please provide a resolution note");
      return;
    }
    resolveMutation.mutate({ id: selectedFlag.id, note: resolveNote });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "destructive";
      case "medium": return "default";
      default: return "secondary";
    }
  };

  const getFlagTypeLabel = (type: string) => {
    switch (type) {
      case "fake_arrival": return "Fake Arrival";
      case "gps_spoofing": return "GPS Spoofing";
      case "unrealistic_area": return "Unrealistic Area";
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const unresolvedFlags = flags.filter((f) => !f.isResolved);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Fraud Alerts"
        description="Review and resolve suspicious location activity flags."
        onRefresh={() => refetch()}
      />

      {/* Summary */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <StatCard
          title="Unresolved"
          value={unresolvedFlags.length}
          icon={AlertTriangle}
          variant="red"
        />
        <StatCard
          title="High Severity"
          value={unresolvedFlags.filter((f) => f.severity === "high").length}
          icon={ShieldAlert}
          variant="orange"
        />
        <StatCard
          title="Resolved"
          value={flags.length - unresolvedFlags.length}
          icon={CheckCircle}
          variant="emerald"
        />
      </div>

      {/* Flags List */}
      <Card>
        <CardHeader>
          <CardTitle>Unresolved Fraud Flags</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : unresolvedFlags.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
              <p>No unresolved fraud flags</p>
            </div>
          ) : (
            <div className="space-y-4">
              {unresolvedFlags.map((flag) => (
                <div
                  key={flag.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={getSeverityColor(flag.severity)}>
                          {flag.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{getFlagTypeLabel(flag.flagType)}</Badge>
                        <span className="text-xs text-muted-foreground">
                          Booking #{flag.bookingId}
                        </span>
                      </div>
                      <p className="text-sm">{flag.details}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {flag.staffName || `Staff #${flag.staffId}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(flag.createdAt)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolve(flag)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Resolve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Fraud Flag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedFlag && (
              <div className="bg-muted/50 rounded-md p-3 text-sm">
                <p><strong>Type:</strong> {getFlagTypeLabel(selectedFlag.flagType)}</p>
                <p><strong>Booking:</strong> #{selectedFlag.bookingId}</p>
                <p><strong>Details:</strong> {selectedFlag.details}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Resolution Note</label>
              <Textarea
                placeholder="Describe the resolution action taken..."
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitResolve} disabled={resolveMutation.isPending}>
              {resolveMutation.isPending ? "Resolving..." : "Resolve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
