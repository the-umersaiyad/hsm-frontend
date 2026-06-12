"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { APIProvider } from "@vis.gl/react-google-maps";
import { queryClient } from "@/lib/queries/query-client";
import { FCMTokenRegistration } from "@/components/FCMTokenRegistration";
import { ServiceWorkerProvider } from "@/components/ServiceWorkerProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <APIProvider
          apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
          libraries={["drawing", "places", "geometry"]}
          version="3.64"
        >
          <ServiceWorkerProvider />
          <FCMTokenRegistration />
          {children}
        </APIProvider>
        <Toaster richColors />
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
