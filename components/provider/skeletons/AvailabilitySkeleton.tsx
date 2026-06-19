import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function AvailabilitySkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      {/* Slots Grid */}
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="rounded-md">
            <div className="p-0">
              <div className="flex items-center justify-around gap-0 px-3 py-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-6 w-6 rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Section: Manage Daily Availability Skeleton */}
      <div className="space-y-4 pt-8 border-t border-border/40">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Calendar Skeleton */}
          <div className="flex justify-center lg:justify-start h-fit">
            <Card className="p-3 sm:p-5 inline-block w-fit shadow-sm border-zinc-200 dark:border-zinc-800">
              <div className="p-3 flex flex-col gap-4 w-fit">
                {/* Header Row */}
                <div className="flex items-center justify-between h-10 sm:h-12 w-full gap-8">
                  <Skeleton className="h-9 w-9 sm:h-10 sm:w-10 rounded-md" />
                  <Skeleton className="h-5 w-32 rounded-md" />
                  <Skeleton className="h-9 w-9 sm:h-10 sm:w-10 rounded-md" />
                </div>
                
                <div className="w-full">
                  {/* Weekdays */}
                  <div className="flex mb-2">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div key={`wd-${i}`} className="flex justify-center w-10 sm:w-12">
                        <Skeleton className="h-3 w-6 rounded-sm" />
                      </div>
                    ))}
                  </div>
                  
                  {/* Days Grid */}
                  <div className="flex flex-col gap-1 sm:gap-2 mt-2">
                    {Array.from({ length: 5 }).map((_, week) => (
                      <div key={`week-${week}`} className="flex">
                        {Array.from({ length: 7 }).map((_, day) => (
                          <div key={`day-${week}-${day}`} className="w-10 h-10 sm:w-12 sm:h-12 p-[2px]">
                            <Skeleton className="w-full h-full rounded-md" />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right: Slot grid Skeleton */}
          <div className="lg:col-span-2">
            <Card>
              <div className="p-6 pb-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-48" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-24 rounded-md" />
                    <Skeleton className="h-9 w-24 rounded-md" />
                  </div>
                </div>
              </div>
              <div className="p-6 pt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={`sub-${i}`} className="h-[46px] w-full rounded-md" />
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
