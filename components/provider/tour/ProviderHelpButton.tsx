"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  HelpCircle,
  X,
  ArrowUpRight,
  Layers,
  Library,
  BookOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTourRunner } from "./TourRunner";
import {
  getToursByPage,
  PROVIDER_TOURS_BY_ID,
  type TourDefinition,
} from "./tours";
import { useProviderBookings } from "@/lib/queries/use-provider-bookings";
import { cn } from "@/lib/utils";

const HELP_VISITED_KEY = "hsm-provider-help-visited";
const TOUR_RESUME_KEY = "hsm-provider-tour-resume";

interface ResumeState {
  tourId: string;
  step: number;
  redirectTo: string;
}

function saveResume(state: ResumeState): void {
  try {
    sessionStorage.setItem(TOUR_RESUME_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function loadResume(): ResumeState | null {
  try {
    const raw = sessionStorage.getItem(TOUR_RESUME_KEY);
    return raw ? (JSON.parse(raw) as ResumeState) : null;
  } catch {
    return null;
  }
}

function clearResume(): void {
  try {
    sessionStorage.removeItem(TOUR_RESUME_KEY);
  } catch {
    // ignore
  }
}

export function ProviderHelpButton() {
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState(false);

  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem(HELP_VISITED_KEY);
  });

  const [isTourRunning, setIsTourRunning] = useState(false);

  const activeTourRef = useRef<{ tour: TourDefinition; step: number } | null>(
    null,
  );

  const prevPathnameRef = useRef<string>(pathname);
  const pathnameRef = useRef<string>(pathname);
  const intentionalNavRef = useRef<boolean>(false);

  const { data: bookingsData } = useProviderBookings();

  const bookings = bookingsData?.bookings ?? [];
  const hasConfirmedBookings = bookings.some((b) => b.status === "confirmed");

  const { thisPage, otherPages } = getToursByPage(pathname, {
    hasConfirmedBookings,
    hasPendingLeave: false,
    hasPendingPayouts: false,
    hasReviews: false,
  });

  const handleTourStart = useCallback(() => {
    setIsTourRunning(true);
  }, []);

  const handleTourEnd = useCallback(() => {
    setIsTourRunning(false);
    activeTourRef.current = null;
    clearResume();
  }, []);

  const handleStepChange = useCallback((absoluteStep: number) => {
    if (!activeTourRef.current) return;
    activeTourRef.current.step = absoluteStep;
    saveResume({
      tourId: activeTourRef.current.tour.id,
      step: absoluteStep,
      redirectTo: pathnameRef.current,
    });
  }, []);

  const { startTour } = useTourRunner({
    onTourStart: handleTourStart,
    onTourEnd: handleTourEnd,
    onStepChange: handleStepChange,
  });

  useEffect(() => {
    pathnameRef.current = pathname;

    const prev = prevPathnameRef.current;
    prevPathnameRef.current = pathname;

    if (prev === pathname) return;
    if (intentionalNavRef.current) return;

    const saved = loadResume();
    if (!saved) return;

    const tour = PROVIDER_TOURS_BY_ID[saved.tourId];
    if (!tour) {
      clearResume();
      return;
    }

    if (pathname !== saved.redirectTo) {
      console.log(
        `[ProviderTour] Navigated away during tour step ${saved.step}. ` +
          `Redirecting back to ${saved.redirectTo}…`,
      );
      router.push(saved.redirectTo);
      return;
    }

    console.log(
      `[ProviderTour] Back on correct page. Resuming "${tour.id}" at step ${saved.step}…`,
    );

    const { step } = saved;

    const resume = (attempts = 0) => {
      if (attempts > 20) {
        console.warn(
          `[ProviderTour] Target element for step ${step} of "${tour.id}" ` +
            "never appeared after 20 attempts — giving up.",
        );
        clearResume();
        return;
      }

      const stepDef = tour.steps[step];
      const selector =
        typeof stepDef?.element === "string" ? stepDef.element : null;

      const isReady = !selector || !!document.querySelector(selector);

      if (!isReady) {
        setTimeout(() => resume(attempts + 1), 500);
        return;
      }

      console.log(
        `[ProviderTour] Element found — resuming at step ${step} (attempt ${attempts + 1}).`,
      );
      clearResume();
      activeTourRef.current = { tour, step };
      startTour(tour.steps, step);
    };

    resume();
  }, [pathname, router, startTour]);

  const dismissPulse = useCallback(() => {
    if (isFirstVisit) {
      setIsFirstVisit(false);
      try {
        localStorage.setItem(HELP_VISITED_KEY, "true");
      } catch {
        // ignore
      }
    }
  }, [isFirstVisit]);

  const handleTourSelect = useCallback(
    (tour: TourDefinition) => {
      setOpen(false);
      dismissPulse();

      const isOnTargetPage =
        pathname === tour.targetPath ||
        (tour.targetPath.endsWith("/") && pathname.startsWith(tour.targetPath));

      clearResume();

      const redirectTo = isOnTargetPage ? pathname : tour.targetPath;
      activeTourRef.current = { tour, step: 0 };

      saveResume({ tourId: tour.id, step: 0, redirectTo });

      if (isOnTargetPage) {
        setTimeout(() => {
          startTour(tour.steps, 0);
        }, 300);
      } else {
        intentionalNavRef.current = true;
        router.push(tour.targetPath);
        setTimeout(() => {
          intentionalNavRef.current = false;
          startTour(tour.steps, 0);
        }, 700);
      }
    },
    [pathname, router, startTour, dismissPulse],
  );

  if (isTourRunning) return null;

  const hasTours = thisPage.length > 0 || otherPages.length > 0;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Popover
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (val) dismissPulse();
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="default"
            size="icon"
            aria-label="Help & Guided Tours"
            className={cn(
              "relative h-12 w-12 rounded-full shadow-lg",
              "bg-primary text-primary-foreground",
              "hover:bg-primary/90 active:scale-95 transition-all duration-200",
            )}
          >
            {open ? (
              <X className="h-5 w-5 shrink-0" />
            ) : (
              <HelpCircle className="h-5 w-5 shrink-0" />
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          side="top"
          align="end"
          sideOffset={12}
          className="w-80 p-0 shadow-xl border overflow-hidden"
        >
          <div className="flex items-center gap-2.5 px-4 py-3 border-b bg-muted/40">
            <HelpCircle className="h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold leading-none">Guided Tours</p>
              <p className="text-xs text-muted-foreground mt-1 leading-snug">
                Step-by-step walkthroughs for every feature
              </p>
            </div>
          </div>

          <ScrollArea className="max-h-150">
            <div className="p-2 space-y-1">
              {thisPage.length > 0 && (
                <section>
                  <SectionLabel icon={Layers}>This Page</SectionLabel>
                  <div className="space-y-0.5">
                    {thisPage.map((tour) => (
                      <TourMenuItem
                        key={tour.id}
                        tour={tour}
                        onSelect={handleTourSelect}
                      />
                    ))}
                  </div>
                </section>
              )}

              {thisPage.length > 0 && otherPages.length > 0 && (
                <div className="mx-2 border-t my-1.5" />
              )}

              {otherPages.length > 0 && (
                <section>
                  <SectionLabel icon={Library}>All Guides</SectionLabel>
                  <div className="space-y-0.5">
                    {otherPages.map((tour) => (
                      <TourMenuItem
                        key={tour.id}
                        tour={tour}
                        onSelect={handleTourSelect}
                        isOtherPage
                      />
                    ))}
                  </div>
                </section>
              )}

              {!hasTours && (
                <div className="py-10 text-center">
                  <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No guided tours available right now.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          {otherPages.length > 0 && (
            <div className="flex items-center justify-center gap-1.5 px-4 py-2 border-t bg-muted/20">
              <ArrowUpRight className="h-3 w-3 text-muted-foreground shrink-0" />
              <p className="text-[11px] text-muted-foreground">
                Tours with this icon will navigate to the relevant page first
              </p>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 pt-1.5 pb-1">
      <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground select-none">
        {children}
      </p>
    </div>
  );
}

interface TourMenuItemProps {
  tour: TourDefinition;
  onSelect: (tour: TourDefinition) => void;
  isOtherPage?: boolean;
}

function TourMenuItem({
  tour,
  onSelect,
  isOtherPage = false,
}: TourMenuItemProps) {
  const Icon = tour.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(tour)}
      className={cn(
        "w-full flex items-start gap-3 rounded-md px-2.5 py-2 text-left",
        "transition-colors duration-150 group",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <div
        className={cn(
          "mt-0.5 shrink-0 flex items-center justify-center",
          "h-7 w-7 rounded-md bg-muted",
          "group-hover:bg-background transition-colors duration-150",
        )}
      >
        <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors duration-150" />
      </div>

      <div className="flex-1 min-w-0">
        <span className="flex items-center gap-1">
          <span className="text-sm font-medium leading-tight">
            {tour.title}
          </span>
          {isOtherPage && (
            <ArrowUpRight
              className={cn(
                "h-3 w-3 shrink-0",
                "text-muted-foreground group-hover:text-accent-foreground/70",
                "transition-colors duration-150",
              )}
              aria-label="Navigates to another page"
            />
          )}
        </span>
        <p
          className={cn(
            "text-xs leading-snug mt-0.5 line-clamp-2",
            "text-muted-foreground group-hover:text-accent-foreground/80",
            "transition-colors duration-150",
          )}
        >
          {tour.description}
        </p>
      </div>
    </button>
  );
}
