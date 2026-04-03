import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Eye,
  Trash2,
  FileText,
  Send,
  CheckCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// ── Types ────────────────────────────────────────────────────────────────────

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  type: "outgoing" | "incoming";
  clientId?: string | null;
  personId?: string | null;
  status: string;
  issueDate: string;
  dueDate: string | null;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  currency: string;
  notes: string | null;
  createdAt: string;
  clientName: string | null;
  personFirstName: string | null;
  personLastName: string | null;
}

interface TaxRule {
  id: string;
  name: string;
  rate: string;
  type: string;
}

interface Client {
  id: string;
  name: string;
}

interface LineItem {
  description: string;
  quantity: string;
  unitPrice: string;
  taxRuleId: string;
}

interface InvoiceFormData {
  type: "outgoing" | "incoming";
  clientId: string;
  personName: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  notes: string;
  lineItems: LineItem[];
}

// ── Status badge colours ─────────────────────────────────────────────────────

function statusBadge(status: string) {
  switch (status) {
    case "draft":
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
          Draft
        </Badge>
      );
    case "sent":
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
          Sent
        </Badge>
      );
    case "viewed":
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
          Viewed
        </Badge>
      );
    case "paid":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          Paid
        </Badge>
      );
    case "overdue":
      return (
        <Badge variant="destructive">
          Overdue
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="outline" className="line-through text-gray-500">
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function typeBadge(type: "outgoing" | "incoming") {
  return type === "outgoing" ? (
    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
      Outgoing
    </Badge>
  ) : (
    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
      Incoming
    </Badge>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const emptyLineItem = (): LineItem => ({
  description: "",
  quantity: "1",
  unitPrice: "",
  taxRuleId: "",
});

const defaultForm = (): InvoiceFormData => ({
  type: "outgoing",
  clientId: "",
  personName: "",
  issueDate: new Date().toISOString().split("T")[0],
  dueDate: "",
  currency: "USD",
  notes: "",
  lineItems: [emptyLineItem()],
});

// ── Component ────────────────────────────────────────────────────────────────

export default function InvoicingPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | "outgoing" | "incoming">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formData, setFormData] = useState<InvoiceFormData>(defaultForm());

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: invoices = [], isLoading } = useQuery<InvoiceRow[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: taxRules = [] } = useQuery<TaxRule[]>({
    queryKey: ["/api/tax-rules"],
  });

  // ── Mutations ────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/invoices", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setIsCreateOpen(false);
      setFormData(defaultForm());
      toast({ title: "Invoice created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create invoice", variant: "destructive" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest(`/api/invoices/${id}/status`, "PUT", { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "Invoice status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update invoice status", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/invoices/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "Invoice deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete invoice", variant: "destructive" });
    },
  });

  // ── Line-item helpers ────────────────────────────────────────────────────

  const updateLineItem = (index: number, field: keyof LineItem, value: string) => {
    const updated = [...formData.lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, lineItems: updated });
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, emptyLineItem()],
    });
  };

  const removeLineItem = (index: number) => {
    if (formData.lineItems.length <= 1) return;
    const updated = formData.lineItems.filter((_, i) => i !== index);
    setFormData({ ...formData, lineItems: updated });
  };

  const lineTotal = (item: LineItem): number => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return qty * price;
  };

  const lineTax = (item: LineItem): number => {
    const sub = lineTotal(item);
    if (!item.taxRuleId || item.taxRuleId === "none") return 0;
    const rule = taxRules.find((r) => r.id === item.taxRuleId);
    if (!rule) return 0;
    const rate = parseFloat(rule.rate) || 0;
    if (rule.type === "inclusive") {
      return sub - sub / (1 + rate / 100);
    }
    return sub * (rate / 100);
  };

  const calcSubtotal = (): number =>
    formData.lineItems.reduce((sum, item) => sum + lineTotal(item), 0);

  const calcTax = (): number =>
    formData.lineItems.reduce((sum, item) => sum + lineTax(item), 0);

  const calcTotal = (): number => {
    // For exclusive tax rules the total is subtotal + tax.
    // For inclusive the total equals the subtotal (tax is embedded).
    // Handle the mixed case by summing per-line totals including their tax.
    return formData.lineItems.reduce((sum, item) => {
      const sub = lineTotal(item);
      const rule = item.taxRuleId && item.taxRuleId !== "none" ? taxRules.find((r) => r.id === item.taxRuleId) : null;
      if (rule && rule.type === "exclusive") {
        const rate = parseFloat(rule.rate) || 0;
        return sum + sub + sub * (rate / 100);
      }
      return sum + sub;
    }, 0);
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.lineItems.length === 0 || !formData.lineItems.some((li) => li.unitPrice)) {
      toast({ title: "Please add at least one line item with a price", variant: "destructive" });
      return;
    }

    const payload: any = {
      type: formData.type,
      issueDate: formData.issueDate,
      dueDate: formData.dueDate || null,
      currency: formData.currency,
      notes: formData.notes || undefined,
      lineItems: formData.lineItems.map((li) => ({
        description: li.description || undefined,
        quantity: li.quantity || "1",
        unitPrice: li.unitPrice,
        taxRuleId: li.taxRuleId && li.taxRuleId !== "none" ? li.taxRuleId : null,
      })),
    };

    if (formData.type === "outgoing" && formData.clientId) {
      payload.clientId = formData.clientId;
    }

    createMutation.mutate(payload);
  };

  // ── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      deleteMutation.mutate(id);
    }
  };

  // ── Filtering ────────────────────────────────────────────────────────────

  const filtered = invoices.filter((inv) => {
    if (typeFilter !== "all" && inv.type !== typeFilter) return false;
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    return true;
  });

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoicing</h1>
          <p className="text-muted-foreground">Manage invoices and billing</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Invoice</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Row 1 — Type & Client / Person */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) =>
                      setFormData({ ...formData, type: v as "outgoing" | "incoming", clientId: "", personName: "" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outgoing">Outgoing</SelectItem>
                      <SelectItem value="incoming">Incoming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.type === "outgoing" ? (
                  <div>
                    <Label>Client</Label>
                    <Select
                      value={formData.clientId}
                      onValueChange={(v) => setFormData({ ...formData, clientId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div>
                    <Label>Person / Vendor</Label>
                    <Input
                      value={formData.personName}
                      onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                      placeholder="Name of sender"
                    />
                  </div>
                )}
              </div>

              {/* Row 2 — Dates & Currency */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Issue Date</Label>
                  <Input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(v) => setFormData({ ...formData, currency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="PKR">PKR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="Optional notes"
                />
              </div>

              {/* Line Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Line Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Line
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[35%]">Description</TableHead>
                        <TableHead className="w-[10%]">Qty</TableHead>
                        <TableHead className="w-[15%]">Unit Price</TableHead>
                        <TableHead className="w-[20%]">Tax Rule</TableHead>
                        <TableHead className="w-[12%] text-right">Total</TableHead>
                        <TableHead className="w-[8%]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.lineItems.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Input
                              value={item.description}
                              onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                              placeholder="Description"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(idx, "quantity", e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(idx, "unitPrice", e.target.value)}
                              placeholder="0.00"
                              required
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={item.taxRuleId}
                              onValueChange={(v) => updateLineItem(idx, "taxRuleId", v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="None" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {taxRules.map((r) => (
                                  <SelectItem key={r.id} value={r.id}>
                                    {r.name} ({r.rate}%)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right font-medium whitespace-nowrap">
                            {lineTotal(item).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLineItem(idx)}
                              disabled={formData.lineItems.length <= 1}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>
                        {calcSubtotal().toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span>
                        {calcTax().toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold text-base border-t pt-1">
                      <span>Total</span>
                      <span>
                        {formData.currency}{" "}
                        {calcTotal().toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setFormData(defaultForm());
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Invoice"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <Tabs
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as "all" | "outgoing" | "incoming")}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
            <TabsTrigger value="incoming">Incoming</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="viewed">Viewed</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoice Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoices ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-3" />
                Loading invoices...
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No invoices found
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Client / Person</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inv) => {
                    const contactName =
                      inv.clientName ||
                      [inv.personFirstName, inv.personLastName].filter(Boolean).join(" ") ||
                      "---";

                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {inv.invoiceNumber}
                        </TableCell>
                        <TableCell>{typeBadge(inv.type)}</TableCell>
                        <TableCell className="whitespace-nowrap">{contactName}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {new Date(inv.issueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "---"}
                        </TableCell>
                        <TableCell className="text-right font-medium whitespace-nowrap">
                          {inv.currency}{" "}
                          {parseFloat(inv.totalAmount).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>{statusBadge(inv.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="View"
                              onClick={() =>
                                toast({ title: `Viewing invoice ${inv.invoiceNumber}` })
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {inv.status === "draft" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Mark as Sent"
                                onClick={() =>
                                  statusMutation.mutate({ id: inv.id, status: "sent" })
                                }
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            )}

                            {(inv.status === "sent" || inv.status === "viewed" || inv.status === "overdue") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Mark as Paid"
                                onClick={() =>
                                  statusMutation.mutate({ id: inv.id, status: "paid" })
                                }
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              title="Delete"
                              onClick={() => handleDelete(inv.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
