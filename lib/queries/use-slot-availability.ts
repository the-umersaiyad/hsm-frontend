'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { QUERY_KEYS } from './query-keys';

// ============================================================================
// Types
// ============================================================================

export interface SlotAvailability {
  id: number;
  startTime: string;
  isDisabled: boolean;
  isBooked: boolean;
  bookingCount: number;
}

interface SlotAvailabilityResponse {
  slots: SlotAvailability[];
  date: string;
}

interface ToggleSlotPayload {
  businessId: number;
  slotId: number;
  date: string;
  isDisabled: boolean;
  reason?: string;
}

interface BulkTogglePayload {
  businessId: number;
  date: string;
  isDisabled: boolean;
  reason?: string;
  slotIds?: number[];
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Fetch slot availability for a specific date (provider view)
 */
export function useSlotAvailability(businessId?: number, date?: string) {
  return useQuery<SlotAvailability[]>({
    queryKey: [QUERY_KEYS.SLOTS, 'availability', businessId, date],
    queryFn: async () => {
      if (!businessId || !date) return [];
      const response = await api.get<SlotAvailabilityResponse>(
        `/slots/${businessId}/availability?date=${date}`
      );
      return response.slots || [];
    },
    enabled: !!businessId && !!date,
    staleTime: 30 * 1000, // 30 seconds — availability changes frequently
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Toggle a single slot's availability for a date
 */
export function useToggleSlotAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ businessId, slotId, date, isDisabled, reason }: ToggleSlotPayload) => {
      const response = await api.post(`/slots/${businessId}/availability`, {
        slotId,
        date,
        isDisabled,
        reason,
      });
      return response;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.SLOTS, 'availability', variables.businessId, variables.date],
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update slot availability');
    },
  });
}

/**
 * Bulk toggle slot availability (enable all / disable all)
 */
export function useBulkToggleSlotAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ businessId, date, isDisabled, reason, slotIds }: BulkTogglePayload) => {
      const response = await api.post<any>(`/slots/${businessId}/availability/bulk`, {
        date,
        isDisabled,
        reason,
        slotIds,
      });
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.SLOTS, 'availability', variables.businessId, variables.date],
      });
      const action = variables.isDisabled ? 'disabled' : 'enabled';
      const count = data.disabledCount || data.enabledCount || 0;
      toast.success(`${count} slot(s) ${action}`);

      if (data.skippedBookedCount > 0) {
        toast.info(`${data.skippedBookedCount} slot(s) skipped (have bookings)`);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to bulk update slot availability');
    },
  });
}
