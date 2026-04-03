import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Star,
  FileText,
  Calendar,
  User,
  Briefcase,
  GraduationCap,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// ── Types ────────────────────────────────────────────────────────────────────

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
  address?: string;
  position?: string;
  department?: string;
  type: "employee" | "contractor";
  status: "active" | "inactive" | "on_leave" | "terminated";
  startDate?: string;
  endDate?: string;
  seniorityLevel?: string;
  managerId?: string;
  managerName?: string;
  group?: string;
  // Employee compensation
  employmentType?: string;
  salary?: string;
  salaryFrequency?: string;
  currency?: string;
  // Contractor compensation
  hourlyRate?: string;
  contractRate?: string;
  contractStartDate?: string;
  contractEndDate?: string;
}

interface PersonDocument {
  id: string;
  name: string;
  type: "contract" | "tax_form" | "id_document" | "certificate" | "other";
  fileUrl?: string;
  fileSize?: number;
  expiryDate?: string;
  createdAt: string;
}

interface LeaveBalance {
  id: string;
  policy: string;
  entitled: number;
  used: number;
  carried: number;
  remaining: number;
}

interface LeaveRequest {
  id: string;
  policy: string;
  startDate: string;
  endDate: string;
  days: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
}

interface PerformanceReview {
  id: string;
  period: string;
  rating: number;
  status: string;
  strengths?: string;
}

interface PerformanceGoal {
  id: string;
  title: string;
  targetDate: string;
  status: "not_started" | "in_progress" | "completed" | "cancelled";
}

interface OnboardingStep {
  id: string;
  title: string;
  description?: string;
  assignedRole?: string;
  status: "pending" | "in_progress" | "completed" | "skipped";
  completedBy?: string;
}

interface DocumentFormData {
  name: string;
  type: string;
  fileUrl: string;
  expiryDate: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(firstName?: string, lastName?: string): string {
  return `${(firstName || "")[0] || ""}${(lastName || "")[0] || ""}`.toUpperCase();
}

function formatDate(dateString?: string): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "N/A";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
    case "approved":
    case "completed":
      return "default";
    case "inactive":
    case "on_leave":
    case "pending":
    case "in_progress":
    case "not_started":
      return "secondary";
    case "terminated":
    case "rejected":
    case "cancelled":
    case "skipped":
      return "destructive";
    default:
      return "outline";
  }
}

function typeVariant(
  type: string
): "default" | "secondary" | "destructive" | "outline" {
  return type === "employee" ? "default" : "secondary";
}

function docTypeBadgeLabel(type: string): string {
  const labels: Record<string, string> = {
    contract: "Contract",
    tax_form: "Tax Form",
    id_document: "ID Document",
    certificate: "Certificate",
    other: "Other",
  };
  return labels[type] || type;
}

function renderStars(rating: number): JSX.Element {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground"
          }`}
        />
      ))}
      <span className="ml-1 text-sm text-muted-foreground">({rating})</span>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function PersonDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Document dialog state
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [docForm, setDocForm] = useState<DocumentFormData>({
    name: "",
    type: "",
    fileUrl: "",
    expiryDate: "",
  });

  // ── Data fetching ──────────────────────────────────────────────────────────

  const { data: person, isLoading: personLoading } = useQuery<Person>({
    queryKey: [`/api/people/${id}`],
    enabled: !!id,
  });

  const { data: documents = [] } = useQuery<PersonDocument[]>({
    queryKey: [`/api/people/${id}/documents`],
    enabled: !!id,
  });

  const { data: leaveBalances = [] } = useQuery<LeaveBalance[]>({
    queryKey: [`/api/leave-balances/${id}`],
    enabled: !!id,
  });

  const { data: leaveRequests = [] } = useQuery<LeaveRequest[]>({
    queryKey: [`/api/leave-requests/person/${id}`],
    enabled: !!id,
  });

  const { data: reviews = [] } = useQuery<PerformanceReview[]>({
    queryKey: [`/api/performance/reviews/person/${id}`],
    enabled: !!id,
  });

  const { data: goals = [] } = useQuery<PerformanceGoal[]>({
    queryKey: [`/api/performance/goals/person/${id}`],
    enabled: !!id,
  });

  const { data: onboardingSteps = [] } = useQuery<OnboardingStep[]>({
    queryKey: [`/api/onboarding/person/${id}`],
    enabled: !!id,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createDocMutation = useMutation({
    mutationFn: (data: DocumentFormData) =>
      apiRequest(`/api/people/${id}/documents`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/people/${id}/documents`],
      });
      setIsAddDocOpen(false);
      resetDocForm();
      toast({ title: "Document added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add document", variant: "destructive" });
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: (docId: string) =>
      apiRequest(`/api/people/${id}/documents/${docId}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/people/${id}/documents`],
      });
      toast({ title: "Document deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete document", variant: "destructive" });
    },
  });

  // ── Form helpers ───────────────────────────────────────────────────────────

  function resetDocForm() {
    setDocForm({ name: "", type: "", fileUrl: "", expiryDate: "" });
  }

  function handleDocSubmit(e: React.FormEvent) {
    e.preventDefault();
    createDocMutation.mutate(docForm);
  }

  function handleDeleteDoc(docId: string) {
    if (confirm("Are you sure you want to delete this document?")) {
      deleteDocMutation.mutate(docId);
    }
  }

  // ── Loading / Not Found states ─────────────────────────────────────────────

  if (personLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading person details...</p>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Person not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setLocation("/people")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to People
        </Button>
      </div>
    );
  }

  const fullName = `${person.firstName || ""} ${person.lastName || ""}`.trim();

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/people")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to People
        </Button>

        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg font-semibold">
              {getInitials(person.firstName, person.lastName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{fullName}</h1>
              <Badge variant={typeVariant(person.type)}>
                {person.type === "employee" ? "Employee" : "Contractor"}
              </Badge>
              <Badge variant={statusVariant(person.status)}>
                {person.status.replace("_", " ").replace(/\b\w/g, (c) =>
                  c.toUpperCase()
                )}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground mt-1">
              {person.position && <span>{person.position}</span>}
              {person.department && <span>- {person.department}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-1.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-1.5" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="leave">
            <Calendar className="h-4 w-4 mr-1.5" />
            Leave
          </TabsTrigger>
          <TabsTrigger value="performance">
            <GraduationCap className="h-4 w-4 mr-1.5" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="onboarding">
            <ClipboardCheck className="h-4 w-4 mr-1.5" />
            Onboarding
          </TabsTrigger>
        </TabsList>

        {/* ── Profile Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="profile">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Date of Birth</dt>
                    <dd className="font-medium">
                      {formatDate(person.dateOfBirth)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Nationality</dt>
                    <dd className="font-medium">
                      {person.nationality || "N/A"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Address</dt>
                    <dd className="font-medium text-right max-w-[60%]">
                      {person.address || "N/A"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd className="font-medium">{person.phone || "N/A"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Email</dt>
                    <dd className="font-medium">{person.email || "N/A"}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Employment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Employment Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Start Date</dt>
                    <dd className="font-medium">
                      {formatDate(person.startDate)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">End Date</dt>
                    <dd className="font-medium">
                      {formatDate(person.endDate)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Seniority Level</dt>
                    <dd className="font-medium">
                      {person.seniorityLevel || "N/A"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Manager</dt>
                    <dd className="font-medium">
                      {person.managerName || "N/A"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Group</dt>
                    <dd className="font-medium">{person.group || "N/A"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Status</dt>
                    <dd>
                      <Badge variant={statusVariant(person.status)}>
                        {person.status.replace("_", " ").replace(/\b\w/g, (c) =>
                          c.toUpperCase()
                        )}
                      </Badge>
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Compensation */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Compensation</CardTitle>
              </CardHeader>
              <CardContent>
                {person.type === "employee" ? (
                  <dl className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                    <div>
                      <dt className="text-muted-foreground text-sm">
                        Employment Type
                      </dt>
                      <dd className="font-medium mt-1">
                        {person.employmentType || "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-sm">Salary</dt>
                      <dd className="font-medium mt-1">
                        {person.salary
                          ? `${person.currency || "$"}${parseFloat(person.salary).toLocaleString()}`
                          : "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-sm">
                        Frequency
                      </dt>
                      <dd className="font-medium mt-1">
                        {person.salaryFrequency || "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-sm">
                        Currency
                      </dt>
                      <dd className="font-medium mt-1">
                        {person.currency || "N/A"}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <dl className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                    <div>
                      <dt className="text-muted-foreground text-sm">
                        Hourly Rate
                      </dt>
                      <dd className="font-medium mt-1">
                        {person.hourlyRate
                          ? `${person.currency || "$"}${parseFloat(person.hourlyRate).toLocaleString()}/hr`
                          : "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-sm">
                        Contract Rate
                      </dt>
                      <dd className="font-medium mt-1">
                        {person.contractRate
                          ? `${person.currency || "$"}${parseFloat(person.contractRate).toLocaleString()}`
                          : "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-sm">
                        Currency
                      </dt>
                      <dd className="font-medium mt-1">
                        {person.currency || "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-sm">
                        Contract Dates
                      </dt>
                      <dd className="font-medium mt-1">
                        {person.contractStartDate || person.contractEndDate
                          ? `${formatDate(person.contractStartDate)} - ${formatDate(person.contractEndDate)}`
                          : "N/A"}
                      </dd>
                    </div>
                  </dl>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Documents Tab ───────────────────────────────────────────────── */}
        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
              </CardTitle>
              <Dialog open={isAddDocOpen} onOpenChange={setIsAddDocOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Document
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Document</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleDocSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="doc-name">Name</Label>
                      <Input
                        id="doc-name"
                        value={docForm.name}
                        onChange={(e) =>
                          setDocForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="doc-type">Type</Label>
                      <Select
                        value={docForm.type}
                        onValueChange={(value) =>
                          setDocForm((prev) => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="tax_form">Tax Form</SelectItem>
                          <SelectItem value="id_document">
                            ID Document
                          </SelectItem>
                          <SelectItem value="certificate">
                            Certificate
                          </SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="doc-url">File URL</Label>
                      <Input
                        id="doc-url"
                        value={docForm.fileUrl}
                        onChange={(e) =>
                          setDocForm((prev) => ({
                            ...prev,
                            fileUrl: e.target.value,
                          }))
                        }
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="doc-expiry">Expiry Date</Label>
                      <Input
                        id="doc-expiry"
                        type="date"
                        value={docForm.expiryDate}
                        onChange={(e) =>
                          setDocForm((prev) => ({
                            ...prev,
                            expiryDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsAddDocOpen(false);
                          resetDocForm();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createDocMutation.isPending}
                      >
                        Add Document
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {(documents as PersonDocument[]).length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>File Size</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(documents as PersonDocument[]).map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">
                            {doc.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {docTypeBadgeLabel(doc.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                          <TableCell>{formatDate(doc.expiryDate)}</TableCell>
                          <TableCell>{formatDate(doc.createdAt)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDoc(doc.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-2">No documents yet</p>
                  <p className="text-sm mb-4">
                    Upload documents for {fullName}
                  </p>
                  <Button size="sm" onClick={() => setIsAddDocOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Document
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Leave Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="leave">
          <div className="space-y-6">
            {/* Leave Balances */}
            <Card>
              <CardHeader>
                <CardTitle>Leave Balances</CardTitle>
              </CardHeader>
              <CardContent>
                {(leaveBalances as LeaveBalance[]).length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Policy</TableHead>
                          <TableHead className="text-right">Entitled</TableHead>
                          <TableHead className="text-right">Used</TableHead>
                          <TableHead className="text-right">Carried</TableHead>
                          <TableHead className="text-right">
                            Remaining
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(leaveBalances as LeaveBalance[]).map((balance) => (
                          <TableRow key={balance.id}>
                            <TableCell className="font-medium">
                              {balance.policy}
                            </TableCell>
                            <TableCell className="text-right">
                              {balance.entitled}
                            </TableCell>
                            <TableCell className="text-right">
                              {balance.used}
                            </TableCell>
                            <TableCell className="text-right">
                              {balance.carried}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {balance.remaining}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-6">
                    No leave balances found.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recent Leave Requests */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {(leaveRequests as LeaveRequest[]).length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Policy</TableHead>
                          <TableHead>Dates</TableHead>
                          <TableHead className="text-right">Days</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(leaveRequests as LeaveRequest[]).map((req) => (
                          <TableRow key={req.id}>
                            <TableCell className="font-medium">
                              {req.policy}
                            </TableCell>
                            <TableCell>
                              {formatDate(req.startDate)} -{" "}
                              {formatDate(req.endDate)}
                            </TableCell>
                            <TableCell className="text-right">
                              {req.days}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusVariant(req.status)}>
                                {req.status.charAt(0).toUpperCase() +
                                  req.status.slice(1)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-6">
                    No leave requests found.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Performance Tab ─────────────────────────────────────────────── */}
        <TabsContent value="performance">
          <div className="space-y-6">
            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {(reviews as PerformanceReview[]).length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Period</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Strengths</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(reviews as PerformanceReview[]).map((review) => (
                          <TableRow key={review.id}>
                            <TableCell className="font-medium">
                              {review.period}
                            </TableCell>
                            <TableCell>{renderStars(review.rating)}</TableCell>
                            <TableCell>
                              <Badge variant={statusVariant(review.status)}>
                                {review.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[300px] truncate">
                              {review.strengths || "N/A"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-6">
                    No performance reviews found.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Goals */}
            <Card>
              <CardHeader>
                <CardTitle>Goals</CardTitle>
              </CardHeader>
              <CardContent>
                {(goals as PerformanceGoal[]).length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Target Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(goals as PerformanceGoal[]).map((goal) => (
                          <TableRow key={goal.id}>
                            <TableCell className="font-medium">
                              {goal.title}
                            </TableCell>
                            <TableCell>
                              {formatDate(goal.targetDate)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusVariant(goal.status)}>
                                {goal.status
                                  .replace("_", " ")
                                  .replace(/\b\w/g, (c) => c.toUpperCase())}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-6">
                    No goals found.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Onboarding Tab ──────────────────────────────────────────────── */}
        <TabsContent value="onboarding">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Onboarding Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(onboardingSteps as OnboardingStep[]).length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Step</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Assigned Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Completed By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(onboardingSteps as OnboardingStep[]).map((step) => (
                        <TableRow key={step.id}>
                          <TableCell className="font-medium">
                            {step.title}
                          </TableCell>
                          <TableCell className="max-w-[250px] truncate">
                            {step.description || "N/A"}
                          </TableCell>
                          <TableCell>
                            {step.assignedRole || "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(step.status)}>
                              {step.status
                                .replace("_", " ")
                                .replace(/\b\w/g, (c) => c.toUpperCase())}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {step.completedBy || "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-6">
                  No onboarding steps found.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
