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
import { Loader2, HelpCircle } from "lucide-react";
import { api } from "@/lib/api";

export function SupportClient() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{type: "success" | "error", text: string} | null>(null);

  // Form State
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("General Inquiry");
  const [subCategory, setSubCategory] = useState("Account Help");
  const [description, setDescription] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [deviceInfo, setDeviceInfo] = useState("");

  const categories = [
    "Booking Issue",
    "Payment Issue",
    "Technical Issue",
    "General Inquiry",
  ];

  const subCategoriesMap: Record<string, string[]> = {
    "Booking Issue": ["Provider No-Show", "Rescheduling Issue", "Service Quality", "Other"],
    "Payment Issue": ["Refund Request", "Double Charge", "Payment Failed", "Other"],
    "Technical Issue": ["App Crash", "Can't Login", "Page Not Loading", "Other"],
    "General Inquiry": ["Account Help", "Pricing Questions", "Other"],
  };

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const data: any = await api.get("/support/my-tickets");
      setTickets(data.tickets || []);
    } catch (error) {
      console.error("Error fetching tickets", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    // Build dynamic data
    const dynamicData: Record<string, string> = {
      subCategory,
    };
    if (category === "Booking Issue" && bookingId) {
      dynamicData.bookingId = bookingId;
    } else if (category === "Payment Issue" && transactionId) {
      dynamicData.transactionId = transactionId;
    } else if (category === "Technical Issue" && deviceInfo) {
      dynamicData.deviceInfo = deviceInfo;
    }

    try {
      await api.post("/support/ticket", {
        subject,
        category,
        message: description,
        dynamicData,
        bookingId: bookingId ? parseInt(bookingId) : undefined,
      });

      setMessage({ type: "success", text: "Ticket submitted successfully!" });
      
      // Reset form
      setSubject("");
      setDescription("");
      setBookingId("");
      setTransactionId("");
      setDeviceInfo("");
      setCategory("General Inquiry");
      setSubCategory("Account Help");

      // Refresh table
      fetchTickets();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to submit ticket" });
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <HelpCircle className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Help & Support</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Submit a Ticket</CardTitle>
              <CardDescription>
                We'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {message && (
                  <div className={`p-3 text-sm rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={(val) => {
                    setCategory(val);
                    setSubCategory(subCategoriesMap[val]?.[0] || "Other");
                    setBookingId("");
                    setTransactionId("");
                    setDeviceInfo("");
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subCategory">Subcategory</Label>
                  <Select value={subCategory} onValueChange={setSubCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {subCategoriesMap[category]?.map((sc) => (
                        <SelectItem key={sc} value={sc}>{sc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description of the issue"
                  />
                </div>

                {/* Dynamic Fields */}
                {category === "Booking Issue" && (
                  <div className="space-y-2">
                    <Label htmlFor="bookingId">Booking ID (Optional)</Label>
                    <Input
                      id="bookingId"
                      type="number"
                      value={bookingId}
                      onChange={(e) => setBookingId(e.target.value)}
                      placeholder="e.g. 1024"
                    />
                  </div>
                )}
                
                {category === "Payment Issue" && (
                  <div className="space-y-2">
                    <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
                    <Input
                      id="transactionId"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="e.g. pay_XXXXXX"
                    />
                  </div>
                )}

                {category === "Technical Issue" && (
                  <div className="space-y-2">
                    <Label htmlFor="deviceInfo">Device/Browser Details</Label>
                    <Input
                      id="deviceInfo"
                      value={deviceInfo}
                      onChange={(e) => setDeviceInfo(e.target.value)}
                      placeholder="e.g. Chrome on Windows"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Message</Label>
                  <Textarea
                    id="description"
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please describe your issue in detail..."
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Ticket
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Tickets List Section */}
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>My Tickets</CardTitle>
              <CardDescription>View your past and active support requests.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                  <HelpCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground">No tickets yet</p>
                  <p className="text-sm text-muted-foreground">When you submit a support ticket, it will appear here.</p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticket ID</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-medium">#{ticket.id}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{ticket.subject}</TableCell>
                          <TableCell>{ticket.category}</TableCell>
                          <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                          <TableCell>{format(new Date(ticket.createdAt), "MMM d, yyyy")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
