import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2, CheckCircle, XCircle } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AppliesTo = "employee" | "contractor" | "all";

type LeavePolicy = {
  id: number;
  name: string;
  daysPerYear: number;
  carryOverLimit: number;
  appliesTo: AppliesTo;
};

type LeaveRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

type LeaveRequest = {
  id: number;
  personName: string;
  policyName: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: LeaveRequestStatus;
};

type Person = {
  id: number;
  name: string;
  firstName?: string;
  lastName?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function appliesToLabel(value: AppliesTo): string {
  if (value === "employee") return "Employee";
  if (value === "contractor") return "Contractor";
  return "All";
}

function appliesToVariant(value: AppliesTo): "default" | "secondary" | "outline" {
  if (value === "employee") return "default";
  if (value === "contractor") return "secondary";
  return "outline";
}

function statusVariant(
  status: LeaveRequestStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "approved":
      return "default";
    case "rejected":
      return "destructive";
    case "cancelled":
      return "outline";
    default:
      return "secondary";
  }
}

function statusLabel(status: LeaveRequestStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusClassName(status: LeaveRequestStatus): string {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800 border-green-200";
    case "rejected":
      return "bg-red-100 text-red-800 border-red-200";
    case "cancelled":
      return "bg-gray-100 text-gray-600 border-gray-200";
    default:
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
  }
}

// ---------------------------------------------------------------------------
// Policies Tab
// ---------------------------------------------------------------------------

function PoliciesTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [daysPerYear, setDaysPerYear] = useState("");
  const [carryOverLimit, setCarryOverLimit] = useState("");
  const [appliesTo, setAppliesTo] = useState<AppliesTo>("all");

  const { data: policies = [], isLoading } = useQuery<LeavePolicy[]>({
    queryKey: ["/api/leave-policies"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      daysPerYear: number;
      carryOverLimit: number;
      appliesTo: AppliesTo;
    }) => {
      const res = await apiRequest("POST", "/api/leave-policies", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-policies"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Policy created." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create policy",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/leave-policies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-policies"] });
      toast({ title: "Policy deleted." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete policy",
        variant: "destructive",
      });
    },
  });

  function resetForm() {
    setName("");
    setDaysPerYear("");
    setCarryOverLimit("");
    setAppliesTo("all");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({
      name: name.trim(),
      daysPerYear: parseFloat(daysPerYear) || 0,
      carryOverLimit: parseFloat(carryOverLimit) || 0,
      appliesTo,
    });
  }

  function handleDelete(policy: LeavePolicy) {
    if (confirm(`Delete policy "${policy.name}"?`)) {
      deleteMutation.mutate(policy.id);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Leave Policies</CardTitle>
        <Button size="sm" onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Policy
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Days / Year</TableHead>
                  <TableHead className="text-right">Carry Over Limit</TableHead>
                  <TableHead>Applies To</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-8"
                    >
                      No leave policies yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  policies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="font-medium">{policy.name}</TableCell>
                      <TableCell className="text-right">{policy.daysPerYear}</TableCell>
                      <TableCell className="text-right">{policy.carryOverLimit}</TableCell>
                      <TableCell>
                        <Badge variant={appliesToVariant(policy.appliesTo)}>
                          {appliesToLabel(policy.appliesTo)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(policy)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Add Policy Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Leave Policy</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="policy-name">Name</Label>
              <Input
                id="policy-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Annual Leave"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="days-per-year">Days Per Year</Label>
              <Input
                id="days-per-year"
                type="number"
                min="0"
                step="0.5"
                value={daysPerYear}
                onChange={(e) => setDaysPerYear(e.target.value)}
                placeholder="e.g. 20"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carry-over-limit">Carry Over Limit</Label>
              <Input
                id="carry-over-limit"
                type="number"
                min="0"
                step="0.5"
                value={carryOverLimit}
                onChange={(e) => setCarryOverLimit(e.target.value)}
                placeholder="e.g. 5"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="applies-to">Applies To</Label>
              <Select value={appliesTo} onValueChange={(v) => setAppliesTo(v as AppliesTo)}>
                <SelectTrigger id="applies-to">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setIsDialogOpen(false); resetForm(); }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Policy"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Requests Tab
// ---------------------------------------------------------------------------

function RequestsTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [personId, setPersonId] = useState("");
  const [policyId, setPolicyId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState("");
  const [reason, setReason] = useState("");

  const { data: requests = [], isLoading: requestsLoading } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests"],
  });

  const { data: people = [] } = useQuery<Person[]>({
    queryKey: ["/api/people"],
  });

  const { data: policies = [] } = useQuery<LeavePolicy[]>({
    queryKey: ["/api/leave-policies"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      personId: number;
      policyId: number;
      startDate: string;
      endDate: string;
      days: number;
      reason: string;
    }) => {
      const res = await apiRequest("POST", "/api/leave-requests", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Leave request created." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create request",
        variant: "destructive",
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/leave-requests/${id}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      toast({ title: "Request approved." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve request",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/leave-requests/${id}/reject`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      toast({ title: "Request rejected." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject request",
        variant: "destructive",
      });
    },
  });

  function resetForm() {
    setPersonId("");
    setPolicyId("");
    setStartDate("");
    setEndDate("");
    setDays("");
    setReason("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!personId || !policyId || !startDate || !endDate || !days) return;
    createMutation.mutate({
      personId: parseInt(personId),
      policyId: parseInt(policyId),
      startDate,
      endDate,
      days: parseFloat(days),
      reason: reason.trim(),
    });
  }

  function getPersonName(person: Person): string {
    if (person.name) return person.name;
    const parts = [person.firstName, person.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : String(person.id);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Leave Requests</CardTitle>
        <Button size="sm" onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New Request
        </Button>
      </CardHeader>
      <CardContent>
        {requestsLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>Policy</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-8"
                    >
                      No leave requests yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.personName}</TableCell>
                      <TableCell>{request.policyName}</TableCell>
                      <TableCell>{request.startDate}</TableCell>
                      <TableCell>{request.endDate}</TableCell>
                      <TableCell className="text-right">{request.days}</TableCell>
                      <TableCell className="max-w-[160px] truncate text-muted-foreground text-sm">
                        {request.reason || "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusClassName(request.status)}`}
                        >
                          {statusLabel(request.status)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {request.status === "pending" && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => approveMutation.mutate(request.id)}
                              disabled={approveMutation.isPending}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 px-2"
                              title="Approve"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => rejectMutation.mutate(request.id)}
                              disabled={rejectMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* New Request Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Leave Request</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="request-person">Person</Label>
              <Select value={personId} onValueChange={setPersonId}>
                <SelectTrigger id="request-person">
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {people.map((person) => (
                    <SelectItem key={person.id} value={String(person.id)}>
                      {getPersonName(person)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="request-policy">Policy</Label>
              <Select value={policyId} onValueChange={setPolicyId}>
                <SelectTrigger id="request-policy">
                  <SelectValue placeholder="Select policy" />
                </SelectTrigger>
                <SelectContent>
                  {policies.map((policy) => (
                    <SelectItem key={policy.id} value={String(policy.id)}>
                      {policy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="request-start">Start Date</Label>
                <Input
                  id="request-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="request-end">End Date</Label>
                <Input
                  id="request-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="request-days">Days</Label>
              <Input
                id="request-days"
                type="number"
                min="0.5"
                step="0.5"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                placeholder="e.g. 1, 0.5 for half day"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="request-reason">Reason</Label>
              <Input
                id="request-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Optional reason"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createMutation.isPending ||
                  !personId ||
                  !policyId ||
                  !startDate ||
                  !endDate ||
                  !days
                }
              >
                {createMutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function LeavePage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Leave Management</h3>
        <p className="text-sm text-muted-foreground">
          Manage leave policies and employee leave requests.
        </p>
      </div>

      <Tabs defaultValue="policies">
        <TabsList>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="mt-4">
          <PoliciesTab />
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          <RequestsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
