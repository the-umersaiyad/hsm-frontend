"use client";

import { useState } from "react";
import * as React from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Plus, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { SlotDialog } from "@/components/provider/availability/SlotDialog";
import { AvailabilitySkeleton } from "@/components/provider/skeletons/AvailabilitySkeleton";
import { useProviderSlots, useCreateSlot, useDeleteSlot } from "@/lib/queries";
import {
  useSlotAvailability,
  useToggleSlotAvailability,
  useBulkToggleSlotAvailability,
} from "@/lib/queries/use-slot-availability";
import { useProviderBusinessProfile } from "@/lib/queries/use-provider-business-profile";
import { getUserData } from "@/lib/auth-utils";
import type { Slot } from "@/lib/queries/use-provider-slots";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ProviderAvailabilityPage() {
  const router = useRouter();
  const userData = getUserData();

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Daily availability state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Set today's date by default on mount
  React.useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  // Fetch business profile
  const { business, isLoading: isLoadingBusiness } = useProviderBusinessProfile(
    userData?.id,
  );

  // Fetch slots using cached hook
  const slotsQuery = useProviderSlots(business?.id);
  const slots = slotsQuery.data || [];
  const isLoadingSlots = slotsQuery.isLoading;
  const refetchSlots = slotsQuery.refetch;

  // Slot availability for selected date
  const formattedDate = selectedDate
    ? selectedDate.toISOString().split("T")[0]
    : undefined;
  const availabilityQuery = useSlotAvailability(business?.id, formattedDate);
  const slotsForDate = availabilityQuery.data || [];

  // Mutations
  const createSlotMutation = useCreateSlot();
  const deleteSlotMutation = useDeleteSlot();
  const toggleMutation = useToggleSlotAvailability();
  const bulkToggleMutation = useBulkToggleSlotAvailability();

  const isLoading = isLoadingBusiness || (business?.id && isLoadingSlots);

  // Redirect if no business
  if (!isLoadingBusiness && !business) {
    router.push("/onboarding");
    return null;
  }

  const handleRefresh = async () => {
    await refetchSlots();
    toast.success("Slots refreshed");
  };

  const handleCreateSlot = async (slotData: { startTime: string }) => {
    if (!business?.id) return;

    createSlotMutation.mutate(
      { businessId: business.id, slotData },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
        },
      },
    );
  };

  const handleDeleteSlot = async (slotId: number) => {
    if (!business?.id) return;

    deleteSlotMutation.mutate(
      { businessId: business.id, slotId },
      {
        onSuccess: () => {
          // Slot deleted, cache will be invalidated automatically
        },
      },
    );
  };

  const handleOpenCreateDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  // Daily availability handlers
  const handleToggle = (slotId: number, isDisabled: boolean) => {
    if (!business?.id || !formattedDate) return;
    toggleMutation.mutate({
      businessId: business.id,
      slotId,
      date: formattedDate,
      isDisabled,
    });
  };

  const handleEnableAll = () => {
    if (!business?.id || !formattedDate) return;
    bulkToggleMutation.mutate({
      businessId: business.id,
      date: formattedDate,
      isDisabled: false,
    });
  };

  const handleDisableAll = () => {
    if (!business?.id || !formattedDate) return;
    bulkToggleMutation.mutate({
      businessId: business.id,
      date: formattedDate,
      isDisabled: true,
    });
  };

  if (isLoading) {
    return <AvailabilitySkeleton />;
  }

  // Sort slots by start time (ensure slots and sortedSlots are always arrays)
  const safeSlots = Array.isArray(slots) ? slots : [];
  const sortedSlots = safeSlots.slice().sort((a, b) => {
    try {
      return (a.startTime || "").localeCompare(b.startTime || "");
    } catch (e) {
      return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Availability
          </h1>
          <p className="text-muted-foreground">
            Manage your booking time slots
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="icon"
            disabled={
              createSlotMutation.isPending || deleteSlotMutation.isPending
            }
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleOpenCreateDialog}
            className="whitespace-nowrap"
            data-tour-provider-add-slot-btn
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add Time Slot</span>
            <span className="sm:hidden">Add Slot</span>
          </Button>
        </div>
      </div>

      {/* Time Slots Grid */}
      {sortedSlots.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Clock className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              No time slots configured
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              You haven't created any time slots yet. Click "Add Time Slot" to
              get started.
            </p>
            <Button onClick={handleOpenCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Time Slot
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" data-tour-provider-slot-grid>
          {sortedSlots.map((slot) => (
            <SlotCard key={slot.id} slot={slot} onDelete={handleDeleteSlot} />
          ))}
        </div>
      )}

      {/* Create Slot Dialog */}
      <SlotDialog
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
        onSubmit={handleCreateSlot}
        businessId={business?.id}
      />

      {/* Section: Manage Daily Availability */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Manage Daily Availability</h2>
        <p className="text-sm text-muted-foreground">
          Pick a date to enable or disable specific time slots
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Calendar */}
          <div className="flex justify-center lg:justify-start h-fit">
            <Card className="p-3 sm:p-5 inline-block w-fit shadow-sm border-zinc-200 dark:border-zinc-800">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today;
                }}
                className="rounded-md [--cell-size:2.5rem] sm:[--cell-size:3rem] [&_.rdp-caption_label]:text-lg"
              />
            </Card>
          </div>

          {/* Right: Slot grid for selected date */}
          <div className="lg:col-span-2">
            {selectedDate ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Slots for{" "}
                      {selectedDate.toLocaleDateString("en-IN", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleEnableAll}
                        disabled={bulkToggleMutation.isPending}
                      >
                        Enable All
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleDisableAll}
                        disabled={bulkToggleMutation.isPending}
                      >
                        Disable All
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {availabilityQuery.isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-[46px] w-full rounded-md" />
                      ))}
                    </div>
                  ) : slotsForDate.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No time slots configured. Add slots above first.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {slotsForDate.map((slot) => (
                        <div
                          key={slot.id}
                          className="flex items-center justify-between p-3 border rounded-md"
                        >
                          <span className="text-sm font-medium">
                            {formatTime12Hour(slot.startTime)}
                          </span>
                          {slot.isBooked ? (
                            <Badge variant="secondary">Booked</Badge>
                          ) : (
                            <Switch
                              checked={!slot.isDisabled}
                              onCheckedChange={(checked) =>
                                handleToggle(slot.id, !checked)
                              }
                              disabled={toggleMutation.isPending}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="flex items-center justify-center p-12">
                <p className="text-sm text-muted-foreground">
                  Select a date from the calendar to manage slot availability
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Slot Card Component
function SlotCard({
  slot,
  onDelete,
}: {
  slot: Slot;
  onDelete: (slotId: number) => void;
}) {
  return (
    <Card className="rounded-sm">
      <div className="p-0">
        <div className="flex items-center justify-around gap-0 px-3 py-2">
          <span className="text-base font-semibold">
            {formatTime12Hour(slot.startTime)}
          </span>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this time slot?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => onDelete(slot.id)}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
}

// Convert 24-hour time to 12-hour AM/PM format
function formatTime12Hour(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12; // Convert 0 to 12
  const displayMinutes = minutes.toString().padStart(2, "0");
  return `${displayHours}:${displayMinutes} ${period}`;
}
