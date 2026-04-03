import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ChevronDown, ChevronRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PayrollItem {
  id: string;
  personId: string;
  personName?: string;
  grossAmount: string;
  taxDeduction: string;
  benefitDeductions: string;
  otherDeductions: string;
  netAmount: string;
  currency: string;
  notes?: string;
}

interface PayrollRun {
  id: string;
  period: string;
  runDate: string;
  status: "draft" | "processing" | "completed" | "failed";
  totalGross: string;
  totalNet: string;
  items?: PayrollItem[];
  createdAt: string;
}

interface Person {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusVariant(
  status: PayrollRun["status"]
): "secondary" | "default" | "outline" | "destructive" {
  switch (status) {
    case "draft":
      return "secondary";
    case "processing":
      return "default";
    case "completed":
      return "outline";
    case "failed":
      return "destructive";
    default:
      return "secondary";
  }
}

function statusLabel(status: PayrollRun["status"]): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatAmount(amount: string | number, currency = "USD"): string {
  const num = parseFloat(String(amount)) || 0;
  return `${currency} ${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function calcNet(
  gross: string,
  tax: string,
  benefits: string,
  other: string
): string {
  const net =
    (parseFloat(gross) || 0) -
    (parseFloat(tax) || 0) -
    (parseFloat(benefits) || 0) -
    (parseFloat(other) || 0);
  return net.toFixed(2);
}

// ─── New Run Form ─────────────────────────────────────────────────────────────

interface NewRunFormData {
  period: string;
  runDate: string;
}

const defaultRunForm: NewRunFormData = { period: "", runDate: "" };

// ─── Add Item Form ────────────────────────────────────────────────────────────

interface NewItemFormData {
  personId: string;
  grossAmount: string;
  taxDeduction: string;
  benefitDeductions: string;
  otherDeductions: string;
  currency: string;
  notes: string;
}

const defaultItemForm: NewItemFormData = {
  personId: "",
  grossAmount: "",
  taxDeduction: "",
  benefitDeductions: "",
  otherDeductions: "",
  currency: "USD",
  notes: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PayrollPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Dialog states
  const [isNewRunOpen, setIsNewRunOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  // Expanded rows
  const [expandedRuns, setExpandedRuns] = useState<Set<string>>(new Set());

  // Form states
  const [runForm, setRunForm] = useState<NewRunFormData>(defaultRunForm);
  const [itemForm, setItemForm] = useState<NewItemFormData>(defaultItemForm);

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: runs = [], isLoading } = useQuery<PayrollRun[]>({
    queryKey: ["/api/payroll"],
  });

  const { data: people = [] } = useQuery<Person[]>({
    queryKey: ["/api/people"],
  });

  // Fetch detail for expanded runs
  const expandedRunId = expandedRuns.size === 1 ? [...expandedRuns][0] : null;
  const { data: runDetail } = useQuery<PayrollRun>({
    queryKey: ["/api/payroll", expandedRunId],
    enabled: !!expandedRunId,
  });

  // Build a map of run details so we always have the latest items
  const runDetailsMap: Record<string, PayrollRun> = {};
  if (runDetail) {
    runDetailsMap[runDetail.id] = runDetail;
  }

  // ── Mutations ────────────────────────────────────────────────────────────

  const createRunMutation = useMutation({
    mutationFn: (data: NewRunFormData) =>
      apiRequest("/api/payroll", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      setIsNewRunOpen(false);
      setRunForm(defaultRunForm);
      toast({ title: "Payroll run created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create payroll run", variant: "destructive" });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: ({ runId, data }: { runId: string; data: NewItemFormData }) =>
      apiRequest(`/api/payroll/${runId}/items`, "POST", data),
    onSuccess: (_, { runId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll", runId] });
      setIsAddItemOpen(false);
      setItemForm(defaultItemForm);
      setSelectedRunId(null);
      toast({ title: "Payroll item added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add payroll item", variant: "destructive" });
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: (runId: string) =>
      apiRequest(`/api/payroll/${runId}`, "PUT", { status: "completed" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      toast({ title: "Payroll run finalized" });
    },
    onError: () => {
      toast({ title: "Failed to finalize payroll run", variant: "destructive" });
    },
  });

  const deleteRunMutation = useMutation({
    mutationFn: (runId: string) =>
      apiRequest(`/api/payroll/${runId}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      toast({ title: "Payroll run deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete payroll run", variant: "destructive" });
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleCreateRun = (e: React.FormEvent) => {
    e.preventDefault();
    createRunMutation.mutate(runForm);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRunId) return;
    addItemMutation.mutate({ runId: selectedRunId, data: itemForm });
  };

  const handleToggleExpand = (runId: string) => {
    setExpandedRuns((prev) => {
      const next = new Set(prev);
      if (next.has(runId)) {
        next.delete(runId);
      } else {
        next.clear(); // collapse others
        next.add(runId);
        // Fetch detail
        queryClient.invalidateQueries({ queryKey: ["/api/payroll", runId] });
      }
      return next;
    });
  };

  const handleOpenAddItem = (runId: string) => {
    setSelectedRunId(runId);
    setItemForm(defaultItemForm);
    setIsAddItemOpen(true);
  };

  const handleFinalize = (runId: string) => {
    if (confirm("Mark this payroll run as completed?")) {
      finalizeMutation.mutate(runId);
    }
  };

  const handleDeleteRun = (runId: string) => {
    if (confirm("Are you sure you want to delete this payroll run?")) {
      deleteRunMutation.mutate(runId);
    }
  };

  const personName = (p: Person) =>
    p.name || [p.firstName, p.lastName].filter(Boolean).join(" ") || "Unknown";

  // Items to display for an expanded run
  const getItems = (run: PayrollRun): PayrollItem[] => {
    const detail = runDetailsMap[run.id];
    return detail?.items ?? run.items ?? [];
  };

  // Computed net for form preview
  const previewNet = calcNet(
    itemForm.grossAmount,
    itemForm.taxDeduction,
    itemForm.benefitDeductions,
    itemForm.otherDeductions
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payroll</h1>
          <p className="text-muted-foreground mt-1">
            Manage salary and contractor payments
          </p>
        </div>
        <Button size="sm" onClick={() => setIsNewRunOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Payroll Run
        </Button>
      </div>

      {/* Payroll Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3" />
              Loading payroll runs…
            </div>
          ) : runs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payroll runs yet. Click "+ New Payroll Run" to get started.
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Period</TableHead>
                    <TableHead>Run Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Gross</TableHead>
                    <TableHead>Total Net</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((run) => {
                    const isExpanded = expandedRuns.has(run.id);
                    const items = getItems(run);

                    return (
                      <>
                        <TableRow
                          key={run.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleToggleExpand(run.id)}
                        >
                          <TableCell>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {run.period}
                          </TableCell>
                          <TableCell>
                            {run.runDate
                              ? new Date(run.runDate).toLocaleDateString()
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(run.status)}>
                              {statusLabel(run.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {run.totalGross
                              ? formatAmount(run.totalGross)
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {run.totalNet ? formatAmount(run.totalNet) : "—"}
                          </TableCell>
                          <TableCell>
                            <div
                              className="flex items-center justify-end space-x-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {run.status !== "completed" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleFinalize(run.id)}
                                  disabled={finalizeMutation.isPending}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Finalize
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRun(run.id)}
                                disabled={deleteRunMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Expanded: Items table */}
                        {isExpanded && (
                          <TableRow key={`${run.id}-detail`}>
                            <TableCell colSpan={7} className="p-0">
                              <div className="bg-muted/30 border-t px-6 py-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <h3 className="text-sm font-semibold">
                                    Items for {run.period}
                                  </h3>
                                  {run.status !== "completed" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleOpenAddItem(run.id)
                                      }
                                    >
                                      <Plus className="h-4 w-4 mr-1" />
                                      Add Item
                                    </Button>
                                  )}
                                </div>

                                {items.length === 0 ? (
                                  <p className="text-sm text-muted-foreground py-2">
                                    No items yet. Add payroll items above.
                                  </p>
                                ) : (
                                  <div className="border rounded-md overflow-hidden bg-background">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Person</TableHead>
                                          <TableHead className="text-right">
                                            Gross
                                          </TableHead>
                                          <TableHead className="text-right">
                                            Tax Deduction
                                          </TableHead>
                                          <TableHead className="text-right">
                                            Benefit Deductions
                                          </TableHead>
                                          <TableHead className="text-right">
                                            Other Deductions
                                          </TableHead>
                                          <TableHead className="text-right">
                                            Net Amount
                                          </TableHead>
                                          <TableHead>Currency</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {items.map((item) => (
                                          <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                              {item.personName || item.personId}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              {formatAmount(
                                                item.grossAmount,
                                                item.currency
                                              )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              {formatAmount(
                                                item.taxDeduction,
                                                item.currency
                                              )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              {formatAmount(
                                                item.benefitDeductions,
                                                item.currency
                                              )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              {formatAmount(
                                                item.otherDeductions,
                                                item.currency
                                              )}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                              {formatAmount(
                                                item.netAmount,
                                                item.currency
                                              )}
                                            </TableCell>
                                            <TableCell>
                                              {item.currency}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── New Run Dialog ────────────────────────────────────────────────── */}
      <Dialog open={isNewRunOpen} onOpenChange={setIsNewRunOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Payroll Run</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateRun} className="space-y-4">
            <div>
              <Label htmlFor="period">Period</Label>
              <Input
                id="period"
                placeholder="e.g. 2026-04"
                value={runForm.period}
                onChange={(e) =>
                  setRunForm({ ...runForm, period: e.target.value })
                }
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: YYYY-MM
              </p>
            </div>
            <div>
              <Label htmlFor="runDate">Run Date</Label>
              <Input
                id="runDate"
                type="date"
                value={runForm.runDate}
                onChange={(e) =>
                  setRunForm({ ...runForm, runDate: e.target.value })
                }
                required
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsNewRunOpen(false);
                  setRunForm(defaultRunForm);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createRunMutation.isPending}>
                {createRunMutation.isPending ? "Creating…" : "Create Run"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Add Item Dialog ───────────────────────────────────────────────── */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Payroll Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div>
              <Label htmlFor="personId">Person</Label>
              <Select
                value={itemForm.personId}
                onValueChange={(v) =>
                  setItemForm({ ...itemForm, personId: v })
                }
              >
                <SelectTrigger id="personId">
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {people.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {personName(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="grossAmount">Gross Amount</Label>
                <Input
                  id="grossAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={itemForm.grossAmount}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, grossAmount: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={itemForm.currency}
                  onValueChange={(v) =>
                    setItemForm({ ...itemForm, currency: v })
                  }
                >
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="PKR">PKR</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="taxDeduction">Tax Deduction</Label>
                <Input
                  id="taxDeduction"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={itemForm.taxDeduction}
                  onChange={(e) =>
                    setItemForm({
                      ...itemForm,
                      taxDeduction: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="benefitDeductions">Benefit Deductions</Label>
                <Input
                  id="benefitDeductions"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={itemForm.benefitDeductions}
                  onChange={(e) =>
                    setItemForm({
                      ...itemForm,
                      benefitDeductions: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="otherDeductions">Other Deductions</Label>
                <Input
                  id="otherDeductions"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={itemForm.otherDeductions}
                  onChange={(e) =>
                    setItemForm({
                      ...itemForm,
                      otherDeductions: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Net Amount preview */}
            <div className="rounded-md bg-muted px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Net Amount (auto-calculated)
              </span>
              <span className="text-lg font-bold">
                {itemForm.currency}{" "}
                {parseFloat(previewNet).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Optional notes"
                value={itemForm.notes}
                onChange={(e) =>
                  setItemForm({ ...itemForm, notes: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddItemOpen(false);
                  setItemForm(defaultItemForm);
                  setSelectedRunId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  addItemMutation.isPending || !itemForm.personId
                }
              >
                {addItemMutation.isPending ? "Adding…" : "Add Item"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
