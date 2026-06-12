import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AdminAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-[165px] rounded-md" />
      </div>

      {/* Charts Grid — matches actual layout */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Revenue Chart — spans 2 columns */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-52" />
                  <Skeleton className="h-4 w-80" />
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-7 w-20 ml-auto" />
                  <Skeleton className="h-3 w-40 ml-auto" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[250px] w-full rounded-md" />
              <div className="flex items-center gap-4 mt-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Chart */}
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-52" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full rounded-full mx-auto max-w-[200px]" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>

        {/* Status Chart */}
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full rounded-md" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>

        {/* Top Providers Chart */}
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full rounded-md" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>

        {/* Payment Status Chart */}
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-44" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[180px] w-full rounded-md" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>

        {/* Average Order Value Chart */}
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-52" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[180px] w-full rounded-md" />
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <div className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-6 w-14" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
