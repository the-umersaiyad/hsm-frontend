"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getApiBaseUrl } from "@/lib/api";
import { getTokenFromStorage } from "@/lib/auth-utils";

interface UseStaffLocationSocketOptions {
  bookingId: number;
  role: "staff" | "customer" | "admin";
  enabled: boolean;
}

interface StaffLocationUpdate {
  lat: number;
  lng: number;
  timestamp: number;
  staffId?: number;
}

const MAX_RETRIES = 3;
const CUSTOMER_POLL_INTERVAL = 30_000; // 30 seconds
const STAFF_POLL_INTERVAL = 10_000; // 10 seconds

export function useStaffLocationSocket(options: UseStaffLocationSocketOptions): {
  latestLocation: StaffLocationUpdate | null;
  isConnected: boolean;
  emitLocation: (lat: number, lng: number) => void;
  disconnect: () => void;
} {
  const { bookingId, role, enabled } = options;

  const [latestLocation, setLatestLocation] = useState<StaffLocationUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const retryCountRef = useRef(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFallingBackRef = useRef(false);

  // HTTP polling fallback
  const startPolling = useCallback(() => {
    if (pollingRef.current) return; // Already polling
    isFallingBackRef.current = true;

    const apiBase = getApiBaseUrl();

    if (role === "staff") {
      // Staff: POST location every 10 seconds (handled externally via emitLocation)
      // We just set up a flag so emitLocation knows to use HTTP
    } else {
      // Customer/Admin: GET latest location every 30 seconds
      const poll = async () => {
        try {
          const token = getTokenFromStorage();
          const res = await fetch(
            `${apiBase}/bookings/${bookingId}/staff-location`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          if (res.ok) {
            const data = await res.json();
            if (data && data.lat != null && data.lng != null) {
              setLatestLocation({
                lat: data.lat,
                lng: data.lng,
                timestamp: data.recorded_at
                  ? new Date(data.recorded_at).getTime()
                  : Date.now(),
                staffId: data.staff_id,
              });
            }
          }
        } catch {
          // Silently fail on poll errors
        }
      };

      // Poll immediately, then on interval
      poll();
      pollingRef.current = setInterval(poll, CUSTOMER_POLL_INTERVAL);
    }
  }, [bookingId, role]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    isFallingBackRef.current = false;
  }, []);

  // Emit location (works via WebSocket or HTTP fallback)
  const emitLocation = useCallback(
    (lat: number, lng: number) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("location_update", { bookingId, lat, lng });
      } else {
        // HTTP fallback — socket not connected yet or fell back
        const apiBase = getApiBaseUrl();
        const token = getTokenFromStorage();
        fetch(`${apiBase}/staff-location/${bookingId}`, {
          method: "POST",
          credentials: "include",
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ lat, lng }),
        }).catch(() => {
          // Silently fail
        });
      }
    },
    [bookingId]
  );

  // Disconnect handler
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("leave_booking", bookingId);
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    stopPolling();
    setIsConnected(false);
  }, [bookingId, stopPolling]);

  // Main connection effect
  useEffect(() => {
    if (!enabled || !bookingId) {
      console.log(`[Socket] Skipping connection: enabled=${enabled}, bookingId=${bookingId}`);
      return;
    }

    const token = getTokenFromStorage();
    if (!token) {
      console.log("[Socket] No token found, skipping connection");
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || getApiBaseUrl();
    console.log(`[Socket] Connecting to ${socketUrl} for booking:${bookingId}, role:${role}`);

    const socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: MAX_RETRIES,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 4000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(`[Socket] ✅ Connected! socketId=${socket.id}, joining booking:${bookingId}`);
      setIsConnected(true);
      retryCountRef.current = 0;
      // Join the booking room
      socket.emit("join_booking", bookingId);
    });

    socket.on("staff_location", (data: StaffLocationUpdate) => {
      console.log(`[Socket] Received staff_location:`, data);
      setLatestLocation(data);
    });

    socket.on("booking_ended", () => {
      console.log(`[Socket] Booking ended, disconnecting`);
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket] Disconnected: ${reason}`);
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.log(`[Socket] ❌ Connection error (attempt ${retryCountRef.current + 1}/${MAX_RETRIES}):`, err.message);
      retryCountRef.current += 1;
      if (retryCountRef.current >= MAX_RETRIES) {
        console.log("[Socket] Max retries reached, falling back to HTTP polling");
        socket.disconnect();
        startPolling();
      }
    });

    // Cleanup on unmount or when enabled/bookingId changes
    return () => {
      console.log(`[Socket] Cleanup: leaving booking:${bookingId}`);
      socket.emit("leave_booking", bookingId);
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, bookingId, role]);

  return {
    latestLocation,
    isConnected,
    emitLocation,
    disconnect,
  };
}
