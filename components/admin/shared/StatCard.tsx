import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

type StatCardVariant =
  | "default"
  | "blue"
  | "yellow"
  | "emerald"
  | "purple"
  | "red"
  | "orange"
  | "cyan";

const variantStyles: Record<
  StatCardVariant,
  { card: string; title: string; icon: string; value: string }
> = {
  default: {
    card: "",
    title: "text-muted-foreground",
    icon: "text-muted-foreground/50",
    value: "",
  },
  blue: {
    card: "bg-gradient-to-br from-blue-100 to-indigo-50 dark:from-blue-500/20 dark:to-indigo-500/5 border-blue-200 dark:border-blue-500/30",
    title: "text-blue-700 dark:text-blue-400",
    icon: "text-blue-500 dark:text-blue-400",
    value: "text-blue-900 dark:text-slate-100",
  },
  yellow: {
    card: "bg-gradient-to-br from-yellow-100 to-amber-50 dark:from-yellow-500/20 dark:to-amber-500/5 border-yellow-200 dark:border-yellow-500/30",
    title: "text-yellow-700 dark:text-yellow-400",
    icon: "text-yellow-500 dark:text-yellow-400",
    value: "text-yellow-900 dark:text-slate-100",
  },
  emerald: {
    card: "bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-500/20 dark:to-teal-500/5 border-emerald-200 dark:border-emerald-500/30",
    title: "text-emerald-700 dark:text-emerald-400",
    icon: "text-emerald-500 dark:text-emerald-400",
    value: "text-emerald-900 dark:text-slate-100",
  },
  purple: {
    card: "bg-gradient-to-br from-purple-100 to-fuchsia-50 dark:from-purple-500/20 dark:to-fuchsia-500/5 border-purple-200 dark:border-purple-500/30",
    title: "text-purple-700 dark:text-purple-400",
    icon: "text-purple-500 dark:text-purple-400",
    value: "text-purple-900 dark:text-slate-100",
  },
  red: {
    card: "bg-gradient-to-br from-rose-100 to-pink-50 dark:from-rose-500/20 dark:to-pink-500/5 border-rose-200 dark:border-rose-500/30",
    title: "text-rose-700 dark:text-rose-400",
    icon: "text-rose-500 dark:text-rose-400",
    value: "text-rose-900 dark:text-slate-100",
  },
  orange: {
    card: "bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-500/20 dark:to-amber-500/5 border-orange-200 dark:border-orange-500/30",
    title: "text-orange-700 dark:text-orange-400",
    icon: "text-orange-500 dark:text-orange-400",
    value: "text-orange-900 dark:text-slate-100",
  },
  cyan: {
    card: "bg-gradient-to-br from-cyan-100 to-blue-50 dark:from-cyan-500/20 dark:to-blue-500/5 border-cyan-200 dark:border-cyan-500/30",
    title: "text-cyan-700 dark:text-cyan-400",
    icon: "text-cyan-500 dark:text-cyan-400",
    value: "text-cyan-900 dark:text-slate-100",
  },
};

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  variant?: StatCardVariant;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  const styles = variantStyles[variant];

  return (
    <Card className={cn("p-2", styles.card, className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1 flex-1">
            <p className={cn("text-sm font-medium", styles.title)}>{title}</p>
            <p className={cn("text-2xl font-bold", styles.value)}>{value}</p>
            {change && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {trend && <TrendIcon className="h-3 w-3" />}
                {change}
              </p>
            )}
          </div>
          <Icon className={cn("h-8 w-8", styles.icon)} />
        </div>
      </CardContent>
    </Card>
  );
}
