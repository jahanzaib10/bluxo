import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MODULES } from "@shared/permissions";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Shield,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OrgUser = {
  id: string;
  clerkUserId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  imageUrl: string | null;
  roleId: number | null;
  roleName: string | null;
  isOwner: boolean;
  status: string;
};

type Role = {
  id: number;
  name: string;
  description: string | null;
  isSystem: boolean;
  userCount?: number;
  permissions?: RolePermission[];
};

type RolePermission = {
  module: string;
  accessLevel: string;
};

type Team = {
  id: number;
  name: string;
  description: string | null;
  memberCount?: number;
};

// Module labels for the permission editor
const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  finance: "Finance",
  people: "People",
  clients: "Clients",
  analytics: "Analytics",
  settings: "Settings",
  integrations: "Integrations",
  data_room: "Data Room",
  payroll: "Payroll",
  invoicing: "Invoicing",
};

// ---------------------------------------------------------------------------
// Users Tab
// ---------------------------------------------------------------------------

function UsersTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users = [], isLoading: usersLoading } = useQuery<OrgUser[]>({
    queryKey: ["/api/org-users"],
  });

  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({
      clerkUserId,
      roleId,
    }: {
      clerkUserId: string;
      roleId: number | null;
    }) => {
      return apiRequest("PUT", `/api/org-users/${clerkUserId}/role`, {
        roleId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-users"] });
      toast({ title: "Success", description: "User role updated." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    },
  });

  const getInitials = (user: OrgUser) => {
    const first = user.firstName?.[0] ?? "";
    const last = user.lastName?.[0] ?? "";
    if (first || last) return `${first}${last}`.toUpperCase();
    return user.email[0].toUpperCase();
  };

  const getFullName = (user: OrgUser) => {
    const parts = [user.firstName, user.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : user.email;
  };

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Organization Users
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]" />
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.clerkUserId}>
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                      {getFullName(user)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      {user.isOwner ? (
                        <Badge variant="default">Owner</Badge>
                      ) : (
                        <Select
                          value={user.roleId?.toString() ?? "none"}
                          onValueChange={(value) => {
                            assignRoleMutation.mutate({
                              clerkUserId: user.clerkUserId,
                              roleId: value === "none" ? null : parseInt(value),
                            });
                          }}
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Assign role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No role</SelectItem>
                            {roles.map((role) => (
                              <SelectItem
                                key={role.id}
                                value={role.id.toString()}
                              >
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.status === "active" ? "default" : "outline"
                        }
                      >
                        {user.status ?? "active"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Teams Tab
// ---------------------------------------------------------------------------

function TeamsTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");

  const { data: teams = [], isLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      return apiRequest("POST", "/api/teams", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setIsDialogOpen(false);
      setTeamName("");
      setTeamDescription("");
      toast({ title: "Success", description: "Team created." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create team",
        variant: "destructive",
      });
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/teams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({ title: "Success", description: "Team deleted." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete team",
        variant: "destructive",
      });
    },
  });

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    createTeamMutation.mutate({
      name: teamName.trim(),
      description: teamDescription.trim(),
    });
  };

  const handleDeleteTeam = (team: Team) => {
    if (confirm(`Delete team "${team.name}"?`)) {
      deleteTeamMutation.mutate(team.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Teams
        </CardTitle>
        <Button
          size="sm"
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          New Team
        </Button>
      </CardHeader>
      <CardContent>
        {teams.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No teams created yet.
          </p>
        ) : (
          <div className="space-y-3">
            {teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{team.name}</div>
                  {team.description && (
                    <div className="text-sm text-muted-foreground">
                      {team.description}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {team.memberCount ?? 0} member
                    {(team.memberCount ?? 0) !== 1 ? "s" : ""}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTeam(team)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Create Team Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Name</Label>
              <Input
                id="team-name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Team name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-description">Description</Label>
              <Input
                id="team-description"
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createTeamMutation.isPending}>
                {createTeamMutation.isPending ? "Creating..." : "Create Team"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Permission Editor Modal
// ---------------------------------------------------------------------------

type PermissionEditorProps = {
  role: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type PermissionState = Record<
  string,
  { enabled: boolean; accessLevel: "full" | "exclusive" }
>;

function PermissionEditor({ role, open, onOpenChange }: PermissionEditorProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  // Build permission state from a permissions array
  const buildStateFromPermissions = (perms: RolePermission[]): PermissionState => {
    const state: PermissionState = {};
    const allModules = Object.values(MODULES);

    for (const mod of allModules) {
      const existing = perms.find((p) => p.module === mod);
      if (existing) {
        state[mod] = {
          enabled: true,
          accessLevel: existing.accessLevel as "full" | "exclusive",
        };
      } else {
        state[mod] = { enabled: false, accessLevel: "full" };
      }
    }
    return state;
  };

  const buildEmptyState = (): PermissionState => {
    const state: PermissionState = {};
    for (const mod of Object.values(MODULES)) {
      state[mod] = { enabled: false, accessLevel: "full" };
    }
    return state;
  };

  const [permissions, setPermissions] = useState<PermissionState>(buildEmptyState);

  // Fetch the role's permissions from the API when the dialog opens
  React.useEffect(() => {
    if (open && role?.id) {
      setPermissionsLoading(true);
      fetch(`/api/roles/${role.id}`, { credentials: "include" })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch role");
          return res.json();
        })
        .then((data: Role) => {
          setPermissions(buildStateFromPermissions(data.permissions ?? []));
        })
        .catch(() => {
          // Fall back to whatever permissions are on the role object
          setPermissions(buildStateFromPermissions(role.permissions ?? []));
        })
        .finally(() => {
          setPermissionsLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, role?.id]);

  const savePermissionsMutation = useMutation({
    mutationFn: async (perms: { module: string; accessLevel: string }[]) => {
      return apiRequest("PUT", `/api/roles/${role.id}/permissions`, {
        permissions: perms,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      onOpenChange(false);
      toast({ title: "Success", description: "Permissions saved." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save permissions",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const enabledPermissions = Object.entries(permissions)
      .filter(([, val]) => val.enabled)
      .map(([mod, val]) => ({ module: mod, accessLevel: val.accessLevel }));
    savePermissionsMutation.mutate(enabledPermissions);
  };

  const toggleModule = (mod: string, checked: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [mod]: { ...prev[mod], enabled: checked },
    }));
  };

  const setAccessLevel = (mod: string, level: "full" | "exclusive") => {
    setPermissions((prev) => ({
      ...prev,
      [mod]: { ...prev[mod], accessLevel: level },
    }));
  };

  const allModules = Object.values(MODULES);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit Permissions &mdash; {role.name}
          </DialogTitle>
        </DialogHeader>

        {permissionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {allModules.map((mod) => {
              const perm = permissions[mod];
              return (
                <div
                  key={mod}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={perm?.enabled ?? false}
                      onCheckedChange={(checked) => toggleModule(mod, checked)}
                    />
                    <span className="font-medium text-sm">
                      {MODULE_LABELS[mod] ?? mod}
                    </span>
                  </div>

                  {perm?.enabled && (
                    <RadioGroup
                      value={perm.accessLevel}
                      onValueChange={(val) =>
                        setAccessLevel(mod, val as "full" | "exclusive")
                      }
                      className="flex gap-4"
                    >
                      <div className="flex items-center gap-1.5">
                        <RadioGroupItem value="full" id={`${mod}-full`} />
                        <Label
                          htmlFor={`${mod}-full`}
                          className="text-xs font-normal cursor-pointer"
                        >
                          Full
                        </Label>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <RadioGroupItem
                          value="exclusive"
                          id={`${mod}-exclusive`}
                        />
                        <Label
                          htmlFor={`${mod}-exclusive`}
                          className="text-xs font-normal cursor-pointer"
                        >
                          Exclusive
                        </Label>
                      </div>
                    </RadioGroup>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={savePermissionsMutation.isPending}
          >
            {savePermissionsMutation.isPending ? "Saving..." : "Save Permissions"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Roles Tab
// ---------------------------------------------------------------------------

function RolesTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const { data: roles = [], isLoading } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      return apiRequest("POST", "/api/roles", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setIsCreateOpen(false);
      setRoleName("");
      setRoleDescription("");
      toast({ title: "Success", description: "Role created." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create role",
        variant: "destructive",
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      toast({ title: "Success", description: "Role deleted." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete role",
        variant: "destructive",
      });
    },
  });

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;
    createRoleMutation.mutate({
      name: roleName.trim(),
      description: roleDescription.trim(),
    });
  };

  const handleDeleteRole = (role: Role, e: React.MouseEvent) => {
    e.stopPropagation();
    if (role.isSystem) return;
    if (confirm(`Delete role "${role.name}"?`)) {
      deleteRoleMutation.mutate(role.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Roles
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            New Role
          </Button>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No roles found.
            </p>
          ) : (
            <div className="space-y-3">
              {roles.map((role) => (
                <div
                  key={role.id}
                  onClick={() => setEditingRole(role)}
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {role.name}
                        {role.isSystem && (
                          <Badge variant="secondary" className="text-xs">
                            System
                          </Badge>
                        )}
                      </div>
                      {role.description && (
                        <div className="text-sm text-muted-foreground">
                          {role.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {role.userCount ?? 0} user
                      {(role.userCount ?? 0) !== 1 ? "s" : ""}
                    </span>
                    {!role.isSystem && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteRole(role, e)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Role Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateRole} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Name</Label>
              <Input
                id="role-name"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="Role name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-description">Description</Label>
              <Input
                id="role-description"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createRoleMutation.isPending}>
                {createRoleMutation.isPending ? "Creating..." : "Create Role"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permission Editor Dialog */}
      {editingRole && (
        <PermissionEditor
          role={editingRole}
          open={!!editingRole}
          onOpenChange={(open) => {
            if (!open) setEditingRole(null);
          }}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function UserManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">User Management</h3>
        <p className="text-sm text-muted-foreground">
          Manage users, teams, and roles for your organization.
        </p>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>

        <TabsContent value="teams">
          <TeamsTab />
        </TabsContent>

        <TabsContent value="roles">
          <RolesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
