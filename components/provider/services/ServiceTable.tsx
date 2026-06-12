/**
 * Service Table Component
 * Table layout for list view with proper columns
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  IndianRupee,
  Clock,
  MoreHorizontal,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Star,
  MessageSquare,
  Image as ImageIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { Service } from "@/types/provider";
import { cn } from "@/lib/utils";

interface ServiceTableProps {
  services: Service[];
  onEdit: (service: Service) => void;
  onDelete: (serviceId: number) => void;
  onToggleStatus: (serviceId: number, isActive: boolean) => void;
  onViewReviews?: (service: Service) => void;
}

export function ServiceTable({
  services,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewReviews,
}: ServiceTableProps) {
  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-300 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950/60">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    }
    return (
      <Badge className="bg-muted text-muted-foreground hover:bg-muted/80 border-border">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const formatDuration = (minutes: number | undefined) => {
    if (!minutes || isNaN(minutes) || minutes <= 0) {
      return "Not set";
    }

    if (minutes < 60) {
      return `${minutes} min${minutes > 1 ? "s" : ""}`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const remainingMins = minutes % 60;
      if (remainingMins === 0) {
        return `${hours} hour${hours > 1 ? "s" : ""}`;
      }
      return `${hours}h ${remainingMins}m`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days} day${days > 1 ? "s" : ""}`;
    }
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-20">Image</TableHead>
              <TableHead className="min-w-[200px]">Service Name</TableHead>
              <TableHead className="min-w-[250px]">Description</TableHead>
              <TableHead className="w-24">Price</TableHead>
              <TableHead className="w-28">Duration</TableHead>
              <TableHead className="w-28">Rating</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow
                key={service.id}
                className="hover:bg-muted/40 transition-colors"
              >
                {/* Image */}
                <TableCell>
                  <div className="h-12 w-12 rounded-md overflow-hidden bg-muted border">
                    {service.image ? (
                      <img
                        src={service.image}
                        alt={service.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Service Name */}
                <TableCell>
                  <div className="font-semibold text-foreground">
                    {service.name}
                  </div>
                </TableCell>

                {/* Description */}
                <TableCell>
                  <div className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                    {service.description || "No description"}
                  </div>
                </TableCell>

                {/* Price */}
                <TableCell>
                  <div className="flex items-center gap-1 text-foreground">
                    <IndianRupee className="h-3.5 w-3.5" />
                    <span className="font-medium">{service.price}</span>
                  </div>
                </TableCell>

                {/* Duration */}
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-foreground">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>
                      {formatDuration(
                        service.duration || service.EstimateDuration,
                      )}
                    </span>
                  </div>
                </TableCell>

                {/* Rating */}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-medium text-sm text-foreground">
                      {Number(service.rating || 0).toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({service.totalReviews || 0})
                    </span>
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell>{getStatusBadge(service.isActive)}</TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* Quick Toggle Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onToggleStatus(service.id, !service.isActive)
                      }
                      className={cn(
                        "h-8 px-2",
                        service.isActive
                          ? "border-green-500/40 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/30"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {service.isActive ? (
                        <PowerOff className="h-3.5 w-3.5" />
                      ) : (
                        <Power className="h-3.5 w-3.5" />
                      )}
                    </Button>

                    {/* More Options Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => onEdit(service)}
                          className="cursor-pointer"
                        >
                          <Edit className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Edit Service</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            onViewReviews && onViewReviews(service)
                          }
                          className="cursor-pointer"
                        >
                          <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>View Reviews</span>
                          {(service.totalReviews || 0) > 0 && (
                            <Badge
                              variant="secondary"
                              className="ml-auto text-xs"
                            >
                              {service.totalReviews || 0}
                            </Badge>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(service.id)}
                          className="text-destructive cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Empty State */}
      {services.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No services found</p>
        </div>
      )}
    </div>
  );
}
