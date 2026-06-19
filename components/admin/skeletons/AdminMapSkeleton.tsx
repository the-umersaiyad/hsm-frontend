import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function AdminMapSkeleton({ hideHeader = false, hideStats = false }: { hideHeader?: boolean; hideStats?: boolean }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-[150px] rounded-md" />
          </div>
        </div>
      )}

      {/* Stat Cards */}
      {!hideStats && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-7 w-12" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Map Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <Skeleton className="h-[600px] w-full rounded-md" />
        </div>
        <div className="lg:col-span-1 space-y-4">
          <Skeleton className="h-[200px] w-full rounded-md" />
          <Skeleton className="h-[200px] w-full rounded-md" />
          <Skeleton className="h-[180px] w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function AdminServiceAreasSkeleton() {
  return <AdminMapSkeleton hideHeader />;
}

export function AdminLiveTrackingSkeleton() {
  return <AdminMapSkeleton hideHeader hideStats />;
}

export function AdminCoverageAnalyticsSkeleton() {
  return <AdminMapSkeleton />;
}
