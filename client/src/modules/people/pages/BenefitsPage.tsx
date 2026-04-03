import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanType = "insurance" | "retirement" | "wellness" | "other";
type EnrollmentStatus = "active" | "cancelled" | "pending";

interface BenefitPlan {
  id: string;
  name: string;
  type: PlanType;
  provider: string | null;
  costToCompany: string;
  costToEmployee: string;
  currency: string | null;
  description: string | null;
  enrollmentCount?: number;
  createdAt: string;
}

interface BenefitEnrollment {
  id: string;
  personId: string;
  planId: string;
  enrolledDate: string;
  status: EnrollmentStatus;
  expiryDate: string | null;
  personFirstName: string | null;
  personLastName: string | null;
  planName: string | null;
  createdAt: string;
}

interface Person {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name?: string;
}

// ─── Default form state ───────────────────────────────────────────────────────

interface PlanFormData {
  name: string;
  type: PlanType;
  provider: string;
  costToCompany: string;
  costToEmployee: string;
  currency: string;
  description: string;
}

const defaultPlanForm = (): PlanFormData => ({
  name: "",
  type: "insurance",
  provider: "",
  costToCompany: "",
  costToEmployee: "",
  currency: "USD",
  description: "",
});

interface EnrollFormData {
  personId: string;
  planId: string;
  enrolledDate: string;
}

const defaultEnrollForm = (): EnrollFormData => ({
  personId: "",
  planId: "",
  enrolledDate: new Date().toISOString().split("T")[0],
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function planTypeBadge(type: PlanType) {
  switch (type) {
    case "insurance":
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
          Insurance
        </Badge>
      );
    case "retirement":
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
          Retirement
        </Badge>
      );
    case "wellness":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          Wellness
        </Badge>
      );
    case "other":
    default:
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
          Other
        </Badge>
      );
  }
}

function enrollmentStatusBadge(status: EnrollmentStatus) {
  switch (status) {
    case "active":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          Active
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-700">
          Cancelled
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
          Pending
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function personDisplayName(p: Person): string {
  if (p.name) return p.name;
  return [p.firstName, p.lastName].filter(Boolean).join(" ") || "Unknown";
}

function enrollmentPersonName(e: BenefitEnrollment): string {
  return (
    [e.personFirstName, e.personLastName].filter(Boolean).join(" ") || e.personId
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BenefitsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Dialog state
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);

  // Form state
  const [planForm, setPlanForm] = useState<PlanFormData>(defaultPlanForm());
  const [enrollForm, setEnrollForm] = useState<EnrollFormData>(defaultEnrollForm());

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: plans = [], isLoading: plansLoading } = useQuery<BenefitPlan[]>({
    queryKey: ["/api/benefits/plans"],
  });

  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery<
    BenefitEnrollment[]
  >({
    queryKey: ["/api/benefits/enrollments"],
  });

  const { data: people = [] } = useQuery<Person[]>({
    queryKey: ["/api/people"],
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createPlanMutation = useMutation({
    mutationFn: (data: PlanFormData) =>
      apiRequest("/api/benefits/plans", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/benefits/plans"] });
      setIsPlanDialogOpen(false);
      setPlanForm(defaultPlanForm());
      toast({ title: "Benefit plan created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create benefit plan", variant: "destructive" });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/benefits/plans/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/benefits/plans"] });
      toast({ title: "Benefit plan deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete benefit plan", variant: "destructive" });
    },
  });

  const enrollMutation = useMutation({
    mutationFn: (data: EnrollFormData) =>
      apiRequest("/api/benefits/enrollments", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/benefits/enrollments"] });
      setIsEnrollDialogOpen(false);
      setEnrollForm(defaultEnrollForm());
      toast({ title: "Person enrolled successfully" });
    },
    onError: () => {
      toast({ title: "Failed to enroll person", variant: "destructive" });
    },
  });

  const cancelEnrollmentMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/benefits/enrollments/${id}`, "PUT", { status: "cancelled" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/benefits/enrollments"] });
      toast({ title: "Enrollment cancelled" });
    },
    onError: () => {
      toast({ title: "Failed to cancel enrollment", variant: "destructive" });
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name || !planForm.costToCompany || !planForm.costToEmployee) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createPlanMutation.mutate(planForm);
  };

  const handleDeletePlan = (id: string) => {
    if (confirm("Are you sure you want to delete this benefit plan?")) {
      deletePlanMutation.mutate(id);
    }
  };

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollForm.personId || !enrollForm.planId || !enrollForm.enrolledDate) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    enrollMutation.mutate(enrollForm);
  };

  const handleCancelEnrollment = (id: string) => {
    if (confirm("Cancel this enrollment?")) {
      cancelEnrollmentMutation.mutate(id);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Benefits</h1>
        <p className="text-muted-foreground mt-1">
          Manage benefit plans and employee enrollments
        </p>
      </div>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
        </TabsList>

        {/* ── Plans Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="plans" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Benefit Plans</CardTitle>
              <Button size="sm" onClick={() => setIsPlanDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Plan
              </Button>
            </CardHeader>
            <CardContent>
              {plansLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3" />
                  Loading plans...
                </div>
              ) : plans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No benefit plans yet. Click "+ New Plan" to get started.
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead className="text-right">Cost to Company</TableHead>
                        <TableHead className="text-right">Cost to Employee</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plans.map((plan) => (
                        <TableRow key={plan.id}>
                          <TableCell className="font-medium">{plan.name}</TableCell>
                          <TableCell>{planTypeBadge(plan.type)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {plan.provider || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {parseFloat(plan.costToCompany).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            {parseFloat(plan.costToEmployee).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell>{plan.currency || "USD"}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Delete plan"
                              onClick={() => handleDeletePlan(plan.id)}
                              disabled={deletePlanMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Enrollments Tab ────────────────────────────────────────────── */}
        <TabsContent value="enrollments" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Enrollments</CardTitle>
              <Button size="sm" onClick={() => setIsEnrollDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Enroll Person
              </Button>
            </CardHeader>
            <CardContent>
              {enrollmentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3" />
                  Loading enrollments...
                </div>
              ) : enrollments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No enrollments yet. Click "+ Enroll Person" to get started.
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Person Name</TableHead>
                        <TableHead>Plan Name</TableHead>
                        <TableHead>Enrolled Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollments.map((enrollment) => (
                        <TableRow key={enrollment.id}>
                          <TableCell className="font-medium">
                            {enrollmentPersonName(enrollment)}
                          </TableCell>
                          <TableCell>{enrollment.planName || "—"}</TableCell>
                          <TableCell>
                            {enrollment.enrolledDate
                              ? new Date(enrollment.enrolledDate).toLocaleDateString()
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {enrollmentStatusBadge(enrollment.status)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {enrollment.expiryDate
                              ? new Date(enrollment.expiryDate).toLocaleDateString()
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {enrollment.status !== "cancelled" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Cancel enrollment"
                                onClick={() => handleCancelEnrollment(enrollment.id)}
                                disabled={cancelEnrollmentMutation.isPending}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── New Plan Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Benefit Plan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePlan} className="space-y-4">
            <div>
              <Label htmlFor="plan-name">Name *</Label>
              <Input
                id="plan-name"
                placeholder="e.g. Health Insurance Basic"
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plan-type">Type *</Label>
                <Select
                  value={planForm.type}
                  onValueChange={(v) =>
                    setPlanForm({ ...planForm, type: v as PlanType })
                  }
                >
                  <SelectTrigger id="plan-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="retirement">Retirement</SelectItem>
                    <SelectItem value="wellness">Wellness</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="plan-provider">Provider</Label>
                <Input
                  id="plan-provider"
                  placeholder="e.g. Aetna"
                  value={planForm.provider}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, provider: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="plan-cost-company">Cost to Company *</Label>
                <Input
                  id="plan-cost-company"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={planForm.costToCompany}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, costToCompany: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="plan-cost-employee">Cost to Employee *</Label>
                <Input
                  id="plan-cost-employee"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={planForm.costToEmployee}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, costToEmployee: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="plan-currency">Currency</Label>
                <Input
                  id="plan-currency"
                  maxLength={3}
                  placeholder="USD"
                  value={planForm.currency}
                  onChange={(e) =>
                    setPlanForm({
                      ...planForm,
                      currency: e.target.value.toUpperCase(),
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="plan-description">Description</Label>
              <Textarea
                id="plan-description"
                placeholder="Optional description"
                rows={2}
                value={planForm.description}
                onChange={(e) =>
                  setPlanForm({ ...planForm, description: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsPlanDialogOpen(false);
                  setPlanForm(defaultPlanForm());
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createPlanMutation.isPending}>
                {createPlanMutation.isPending ? "Creating..." : "Create Plan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Enroll Person Dialog ────────────────────────────────────────────── */}
      <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enroll Person</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEnroll} className="space-y-4">
            <div>
              <Label htmlFor="enroll-person">Person *</Label>
              <Select
                value={enrollForm.personId}
                onValueChange={(v) =>
                  setEnrollForm({ ...enrollForm, personId: v })
                }
              >
                <SelectTrigger id="enroll-person">
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {people.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {personDisplayName(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="enroll-plan">Plan *</Label>
              <Select
                value={enrollForm.planId}
                onValueChange={(v) =>
                  setEnrollForm({ ...enrollForm, planId: v })
                }
              >
                <SelectTrigger id="enroll-plan">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="enroll-date">Enrolled Date *</Label>
              <Input
                id="enroll-date"
                type="date"
                value={enrollForm.enrolledDate}
                onChange={(e) =>
                  setEnrollForm({ ...enrollForm, enrolledDate: e.target.value })
                }
                required
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEnrollDialogOpen(false);
                  setEnrollForm(defaultEnrollForm());
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  enrollMutation.isPending ||
                  !enrollForm.personId ||
                  !enrollForm.planId
                }
              >
                {enrollMutation.isPending ? "Enrolling..." : "Enroll"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
