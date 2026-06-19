import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function AdminSupportSkeleton() {
  return (
    <div className="space-y-6">
      {/* Table */}
      <div className="border rounded-md overflow-hidden bg-card shadow-sm">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[10%] py-4 px-4"><Skeleton className="h-4 w-16" /></TableHead>
                <TableHead className="w-[20%] py-4 px-4"><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead className="w-[25%] py-4 px-4"><Skeleton className="h-4 w-32" /></TableHead>
                <TableHead className="w-[10%] py-4 px-4"><Skeleton className="h-4 w-16" /></TableHead>
                <TableHead className="w-[10%] py-4 px-4"><Skeleton className="h-4 w-16" /></TableHead>
                <TableHead className="w-[10%] py-4 px-4"><Skeleton className="h-4 w-16" /></TableHead>
                <TableHead className="w-[10%] py-4 px-4"><Skeleton className="h-4 w-16" /></TableHead>
                <TableHead className="w-[5%] py-4 px-4 text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <TableRow key={i}>
                  <TableCell className="py-4 px-4"><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell className="py-4 px-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-4"><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell className="py-4 px-4"><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="py-4 px-4"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="py-4 px-4"><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell className="py-4 px-4"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="py-4 px-4 text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
