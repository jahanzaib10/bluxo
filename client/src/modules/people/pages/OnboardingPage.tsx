import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  ListOrdered,
} from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingTemplate {
  id: string;
  name: string;
  appliesToType: "employee" | "contractor" | "all";
  stepCount?: number;
  createdAt: string;
}

interface OnboardingStep {
  id: string;
  templateId: string;
  title: string;
  description?: string | null;
  order: number;
  assignedRole?: string | null;
  dueDaysAfterStart?: number | null;
}

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  type?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function appliesToBadge(appliesTo: string) {
  switch (appliesTo) {
    case "employee":
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
          Employee
        </Badge>
      );
    case "contractor":
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
          Contractor
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
          All
        </Badge>
      );
  }
}

// ─── Add Step Dialog ──────────────────────────────────────────────────────────

interface AddStepDialogProps {
  templateId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function AddStepDialog({ templateId, open, onOpenChange }: AddStepDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState("1");
  const [assignedRole, setAssignedRole] = useState("");
  const [dueDaysAfterStart, setDueDaysAfterStart] = useState("");

  const addStepMutation = useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      order: number;
      assignedRole?: string;
      dueDaysAfterStart?: number;
    }) => apiRequest("POST", `/api/onboarding/templates/${templateId}/steps`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/onboarding/templates/${templateId}/steps`],
      });
      toast({ title: "Step added successfully" });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add step",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setOrder("1");
    setAssignedRole("");
    setDueDaysAfterStart("");
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload: any = {
      title: title.trim(),
      order: parseInt(order) || 1,
    };
    if (description.trim()) payload.description = description.trim();
    if (assignedRole.trim()) payload.assignedRole = assignedRole.trim();
    if (dueDaysAfterStart.trim())
      payload.dueDaysAfterStart = parseInt(dueDaysAfterStart);

    addStepMutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Step</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="step-title">Title</Label>
            <Input
              id="step-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Step title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="step-description">Description</Label>
            <Input
              id="step-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="step-order">Order</Label>
              <Input
                id="step-order"
                type="number"
                min="1"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="step-due-days">Due Days After Start</Label>
              <Input
                id="step-due-days"
                type="number"
                min="0"
                value={dueDaysAfterStart}
                onChange={(e) => setDueDaysAfterStart(e.target.value)}
                placeholder="e.g. 7"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="step-role">Assigned Role</Label>
            <Input
              id="step-role"
              value={assignedRole}
              onChange={(e) => setAssignedRole(e.target.value)}
              placeholder="e.g. HR Manager"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={addStepMutation.isPending}>
              {addStepMutation.isPending ? "Adding..." : "Add Step"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Template Row ─────────────────────────────────────────────────────────────

interface TemplateRowProps {
  template: OnboardingTemplate;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function TemplateRow({ template, onDelete, isDeleting }: TemplateRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [addStepOpen, setAddStepOpen] = useState(false);

  const { data: steps = [], isLoading: stepsLoading } = useQuery<OnboardingStep[]>({
    queryKey: [`/api/onboarding/templates/${template.id}/steps`],
    enabled: isOpen,
  });

  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="border rounded-lg overflow-hidden">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <span className="font-medium">{template.name}</span>
                  {template.stepCount !== undefined && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({template.stepCount} step{template.stepCount !== 1 ? "s" : ""})
                    </span>
                  )}
                </div>
                {appliesToBadge(template.appliesToType)}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(template.id);
                }}
                disabled={isDeleting}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="border-t bg-muted/20 p-4 space-y-3">
              {stepsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : sortedSteps.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No steps yet. Add the first step.
                </p>
              ) : (
                <ol className="space-y-2">
                  {sortedSteps.map((step) => (
                    <li
                      key={step.id}
                      className="flex items-start gap-3 p-3 bg-background border rounded-md"
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                        {step.order}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{step.title}</div>
                        {step.description && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {step.description}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {step.assignedRole && (
                            <span>Role: {step.assignedRole}</span>
                          )}
                          {step.dueDaysAfterStart != null && (
                            <span>Due: Day {step.dueDaysAfterStart}</span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddStepOpen(true)}
                className="flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Step
              </Button>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      <AddStepDialog
        templateId={template.id}
        open={addStepOpen}
        onOpenChange={setAddStepOpen}
      />
    </>
  );
}

// ─── New Template Dialog ──────────────────────────────────────────────────────

interface NewTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function NewTemplateDialog({ open, onOpenChange }: NewTemplateDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [appliesToType, setAppliesToType] = useState<"employee" | "contractor" | "all">("all");

  const createMutation = useMutation({
    mutationFn: (data: { name: string; appliesToType: "employee" | "contractor" | "all" }) =>
      apiRequest("POST", "/api/onboarding/templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/templates"] });
      toast({ title: "Template created successfully" });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setName("");
    setAppliesToType("all");
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim(), appliesToType });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Onboarding Template</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Name</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Template name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-applies-to">Applies To</Label>
            <Select
              value={appliesToType}
              onValueChange={(v) =>
                setAppliesToType(v as "employee" | "contractor" | "all")
              }
            >
              <SelectTrigger id="template-applies-to">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="contractor">Contractor</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Template"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Assign Section ───────────────────────────────────────────────────────────

function AssignSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const { data: people = [] } = useQuery<Person[]>({
    queryKey: ["/api/people"],
  });

  const { data: templates = [] } = useQuery<OnboardingTemplate[]>({
    queryKey: ["/api/onboarding/templates"],
  });

  const assignMutation = useMutation({
    mutationFn: (data: { personId: string; templateId: string }) =>
      apiRequest("POST", "/api/onboarding/assign", data),
    onSuccess: () => {
      toast({ title: "Template assigned successfully" });
      setSelectedPersonId("");
      setSelectedTemplateId("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to assign template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId || !selectedTemplateId) return;
    assignMutation.mutate({ personId: selectedPersonId, templateId: selectedTemplateId });
  };

  const getPersonName = (person: Person) => {
    const parts = [person.firstName, person.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : person.id;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListOrdered className="h-5 w-5" />
          Assign Template to Person
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAssign} className="flex items-end gap-4 flex-wrap">
          <div className="space-y-2 flex-1 min-w-[180px]">
            <Label>Person</Label>
            <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
              <SelectTrigger>
                <SelectValue placeholder="Select person" />
              </SelectTrigger>
              <SelectContent>
                {people.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {getPersonName(person)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 flex-1 min-w-[180px]">
            <Label>Template</Label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={
              !selectedPersonId ||
              !selectedTemplateId ||
              assignMutation.isPending
            }
          >
            {assignMutation.isPending ? "Assigning..." : "Assign"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newTemplateOpen, setNewTemplateOpen] = useState(false);

  const { data: templates = [], isLoading } = useQuery<OnboardingTemplate[]>({
    queryKey: ["/api/onboarding/templates"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/onboarding/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/templates"] });
      toast({ title: "Template deleted" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteTemplate = (id: string) => {
    if (confirm("Delete this template and all its steps?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Onboarding</h1>
          <p className="text-muted-foreground">
            Manage onboarding templates and assign them to people
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setNewTemplateOpen(true)}
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Templates Section */}
      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No templates yet. Create your first onboarding template.
            </p>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <TemplateRow
                  key={template.id}
                  template={template}
                  onDelete={handleDeleteTemplate}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Section */}
      <AssignSection />

      {/* New Template Dialog */}
      <NewTemplateDialog
        open={newTemplateOpen}
        onOpenChange={setNewTemplateOpen}
      />
    </div>
  );
}
