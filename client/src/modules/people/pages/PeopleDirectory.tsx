import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Search, Eye, Trash2, Users } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Person {
  id: string;
  type: "employee" | "contractor";
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  position?: string;
  department?: string;
  country?: string;
  startDate?: string;
  endDate?: string;
  status?: "active" | "on_leave" | "terminated" | "offboarding";
  seniorityLevel?: string;
  employmentType?: "full_time" | "part_time" | null;
  salary?: string | null;
  salaryFrequency?: "monthly" | "bi_weekly" | "weekly" | "annually" | null;
  salaryCurrency?: string | null;
  hourlyRate?: string | null;
  contractRate?: string | null;
  rateCurrency?: string | null;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  createdAt: string;
}

interface PeopleStats {
  total: number;
  employees: number;
  contractors: number;
}

interface PersonFormData {
  type: "employee" | "contractor";
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  country: string;
  startDate: string;
  seniorityLevel: string;
  // Employee-specific
  employmentType: string;
  salary: string;
  salaryFrequency: string;
  salaryCurrency: string;
  // Contractor-specific
  hourlyRate: string;
  contractRate: string;
  rateCurrency: string;
  contractStartDate: string;
  contractEndDate: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const defaultFormData: PersonFormData = {
  type: "employee",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  position: "",
  department: "",
  country: "",
  startDate: "",
  seniorityLevel: "",
  employmentType: "",
  salary: "",
  salaryFrequency: "",
  salaryCurrency: "USD",
  hourlyRate: "",
  contractRate: "",
  rateCurrency: "USD",
  contractStartDate: "",
  contractEndDate: "",
};

const statusConfig: Record<string, { label: string; className: string }> = {
  active: {
    label: "Active",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  on_leave: {
    label: "On Leave",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  terminated: {
    label: "Terminated",
    className:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  offboarding: {
    label: "Offboarding",
    className:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  },
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function PeopleDirectory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "employee" | "contractor">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<PersonFormData>({ ...defaultFormData });

  // ── Queries ────────────────────────────────────────────────────────────────

  const peopleQueryKey =
    activeTab === "all" ? ["/api/people"] : [`/api/people?type=${activeTab}`];

  const { data: people = [], isLoading } = useQuery<Person[]>({
    queryKey: peopleQueryKey,
  });

  const { data: stats } = useQuery<PeopleStats>({
    queryKey: ["/api/people/stats"],
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (data: PersonFormData) => {
      // Build a clean payload, stripping empty strings
      const payload: Record<string, unknown> = {
        type: data.type,
        firstName: data.firstName,
      };
      if (data.lastName) payload.lastName = data.lastName;
      if (data.email) payload.email = data.email;
      if (data.phone) payload.phone = data.phone;
      if (data.position) payload.position = data.position;
      if (data.department) payload.department = data.department;
      if (data.country) payload.country = data.country;
      if (data.startDate) payload.startDate = data.startDate;
      if (data.seniorityLevel) payload.seniorityLevel = data.seniorityLevel;

      if (data.type === "employee") {
        if (data.employmentType) payload.employmentType = data.employmentType;
        if (data.salary) payload.salary = data.salary;
        if (data.salaryFrequency) payload.salaryFrequency = data.salaryFrequency;
        if (data.salaryCurrency) payload.salaryCurrency = data.salaryCurrency;
      } else {
        if (data.hourlyRate) payload.hourlyRate = data.hourlyRate;
        if (data.contractRate) payload.contractRate = data.contractRate;
        if (data.rateCurrency) payload.rateCurrency = data.rateCurrency;
        if (data.contractStartDate) payload.contractStartDate = data.contractStartDate;
        if (data.contractEndDate) payload.contractEndDate = data.contractEndDate;
      }

      return apiRequest("POST", "/api/people", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/people"] });
      queryClient.invalidateQueries({ queryKey: ["/api/people/stats"] });
      setIsAddOpen(false);
      setFormData({ ...defaultFormData });
      toast({ title: "Person added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add person", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/people/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/people"] });
      queryClient.invalidateQueries({ queryKey: ["/api/people/stats"] });
      toast({ title: "Person deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete person", variant: "destructive" });
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this person?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleRowClick = (personId: string) => {
    setLocation(`/people/${personId}`);
  };

  // ── Filtered list ──────────────────────────────────────────────────────────

  const filteredPeople = people.filter((person) => {
    const fullName =
      `${person.firstName} ${person.lastName || ""}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">People</h1>
          <p className="text-muted-foreground mt-1">
            Manage employees and contractors
          </p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Person
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Person</DialogTitle>
            </DialogHeader>
            <AddPersonForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsAddOpen(false);
                setFormData({ ...defaultFormData });
              }}
              isPending={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter tabs + search */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        >
          <TabsList>
            <TabsTrigger value="all">
              All{stats ? ` (${stats.total})` : ""}
            </TabsTrigger>
            <TabsTrigger value="employee">
              Employees{stats ? ` (${stats.employees})` : ""}
            </TabsTrigger>
            <TabsTrigger value="contractor">
              Contractors{stats ? ` (${stats.contractors})` : ""}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3" />
                    Loading people...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredPeople.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Users className="h-8 w-8" />
                    <p>No people found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredPeople.map((person) => {
                const initials = person.firstName.charAt(0).toUpperCase();
                const fullName = `${person.firstName} ${person.lastName || ""}`.trim();
                const status = person.status || "active";
                const badge = statusConfig[status] || statusConfig.active;

                return (
                  <TableRow
                    key={person.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(person.id)}
                  >
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      {fullName}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          person.type === "employee" ? "default" : "secondary"
                        }
                      >
                        {person.type === "employee" ? "Employee" : "Contractor"}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {person.position || "---"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {person.department || "---"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {person.country || "---"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {person.startDate
                        ? new Date(person.startDate).toLocaleDateString()
                        : "---"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(person.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(person.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Add Person Form ────────────────────────────────────────────────────────────

function AddPersonForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isPending,
}: {
  formData: PersonFormData;
  setFormData: React.Dispatch<React.SetStateAction<PersonFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const update = (fields: Partial<PersonFormData>) =>
    setFormData((prev) => ({ ...prev, ...fields }));

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* ── Basic info ─────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Basic Information
        </h3>

        {/* Type toggle */}
        <div>
          <Label>Type</Label>
          <div className="flex gap-2 mt-1">
            <Button
              type="button"
              variant={formData.type === "employee" ? "default" : "outline"}
              size="sm"
              onClick={() => update({ type: "employee" })}
            >
              Employee
            </Button>
            <Button
              type="button"
              variant={formData.type === "contractor" ? "default" : "outline"}
              size="sm"
              onClick={() => update({ type: "contractor" })}
            >
              Contractor
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => update({ firstName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => update({ lastName: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => update({ email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => update({ phone: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => update({ position: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => update({ department: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => update({ country: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => update({ startDate: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="seniorityLevel">Seniority Level</Label>
          <Input
            id="seniorityLevel"
            value={formData.seniorityLevel}
            onChange={(e) => update({ seniorityLevel: e.target.value })}
            placeholder="e.g. Junior, Mid, Senior, Lead"
          />
        </div>
      </div>

      {/* ── Compensation ───────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Compensation
        </h3>

        {formData.type === "employee" ? (
          <>
            <div>
              <Label htmlFor="employmentType">Employment Type</Label>
              <Select
                value={formData.employmentType}
                onValueChange={(value) => update({ employmentType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  step="0.01"
                  value={formData.salary}
                  onChange={(e) => update({ salary: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="salaryFrequency">Frequency</Label>
                <Select
                  value={formData.salaryFrequency}
                  onValueChange={(value) => update({ salaryFrequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="bi_weekly">Bi-Weekly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="salaryCurrency">Currency</Label>
                <Select
                  value={formData.salaryCurrency}
                  onValueChange={(value) => update({ salaryCurrency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
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
          </>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="hourlyRate">Hourly Rate</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  value={formData.hourlyRate}
                  onChange={(e) => update({ hourlyRate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="contractRate">Contract Rate</Label>
                <Input
                  id="contractRate"
                  type="number"
                  step="0.01"
                  value={formData.contractRate}
                  onChange={(e) => update({ contractRate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="rateCurrency">Currency</Label>
                <Select
                  value={formData.rateCurrency}
                  onValueChange={(value) => update({ rateCurrency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contractStartDate">Contract Start Date</Label>
                <Input
                  id="contractStartDate"
                  type="date"
                  value={formData.contractStartDate}
                  onChange={(e) =>
                    update({ contractStartDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="contractEndDate">Contract End Date</Label>
                <Input
                  id="contractEndDate"
                  type="date"
                  value={formData.contractEndDate}
                  onChange={(e) =>
                    update({ contractEndDate: e.target.value })
                  }
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Actions ────────────────────────────────────────────────────────── */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Adding..." : "Add Person"}
        </Button>
      </div>
    </form>
  );
}
