"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Search, Filter } from "lucide-react";
import { api } from "@/lib/api";

export function AdminSupportClient() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Modal State
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState("");
  const [updatePriority, setUpdatePriority] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [message, setMessage] = useState<{type: "success" | "error", text: string} | null>(null);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const data: any = await api.get(`/support/admin/tickets?status=${statusFilter}`);
      setTickets(data.tickets || []);
    } catch (error) {
      console.error("Error fetching tickets", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const handleOpenTicket = async (id: number) => {
    try {
      const data: any = await api.get(`/support/admin/ticket/${id}`);
      setSelectedTicket(data);
      setUpdateStatus(data.status);
      setUpdatePriority(data.priority);
      setAdminNotes(data.adminNotes || "");
      setMessage(null);
    } catch (error) {
      console.error("Error fetching ticket details", error);
    }
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;
    
    setIsUpdating(true);
    setMessage(null);

    try {
      await api.put(`/support/admin/ticket/${selectedTicket.id}`, {
        status: updateStatus,
        priority: updatePriority,
        adminNotes,
      });

      setMessage({ type: "success", text: "Ticket updated successfully!" });
      fetchTickets(); // Refresh list
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to update ticket" });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      open: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      resolved: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800",
    };
    return (
      <Badge className={variants[status] || "bg-gray-100 text-gray-800"} variant="outline">
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, string> = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-red-100 text-red-800",
    };
    return (
      <Badge className={variants[priority] || "bg-gray-100 text-gray-800"} variant="outline">
        {priority.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support Desk</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage customer and provider support tickets.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No tickets found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">#{ticket.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ticket.userName}</div>
                        <div className="text-xs text-muted-foreground">{ticket.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{ticket.subject}</TableCell>
                    <TableCell>{ticket.category}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                    <TableCell>{format(new Date(ticket.createdAt), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleOpenTicket(ticket.id)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Ticket #{selectedTicket.id}
                  {getStatusBadge(selectedTicket.status)}
                  {getPriorityBadge(selectedTicket.priority)}
                </DialogTitle>
                <DialogDescription>
                  Submitted by {selectedTicket.userName} ({selectedTicket.userEmail}) on {format(new Date(selectedTicket.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </DialogDescription>
              </DialogHeader>

              {message && (
                <div className={`p-3 text-sm rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {message.text}
                </div>
              )}

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Category</Label>
                    <div className="font-medium">{selectedTicket.category}</div>
                  </div>
                  {selectedTicket.bookingId && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Booking ID</Label>
                      <div className="font-medium">#{selectedTicket.bookingId}</div>
                    </div>
                  )}
                  {selectedTicket.dynamicData && Object.entries(selectedTicket.dynamicData).map(([key, value]) => (
                    <div key={key}>
                      <Label className="text-xs text-muted-foreground">{key}</Label>
                      <div className="font-medium">{String(value)}</div>
                    </div>
                  ))}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Subject</Label>
                  <div className="font-medium text-lg">{selectedTicket.subject}</div>
                </div>

                <div className="bg-muted p-4 rounded-md">
                  <Label className="text-xs text-muted-foreground mb-2 block">Message</Label>
                  <div className="whitespace-pre-wrap text-sm">{selectedTicket.message}</div>
                </div>

                <div className="border-t pt-4 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Update Status</Label>
                    <Select value={updateStatus} onValueChange={setUpdateStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Update Priority</Label>
                    <Select value={updatePriority} onValueChange={setUpdatePriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminNotes">Admin Notes (Internal only)</Label>
                  <Textarea
                    id="adminNotes"
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes about this ticket..."
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                  Close
                </Button>
                <Button onClick={handleUpdateTicket} disabled={isUpdating}>
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
