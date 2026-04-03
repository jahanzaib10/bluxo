import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReviewStatus = "draft" | "submitted" | "acknowledged";
type GoalStatus = "not_started" | "in_progress" | "completed" | "missed";

interface Person {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}

interface PerformanceReview {
  id: string;
  personId: string;
  period: string;
  rating: number | null;
  strengths: string | null;
  improvements: string | null;
  goals: string | null;
  status: ReviewStatus;
  createdAt: string;
  personFirstName?: string | null;
  personLastName?: string | null;
}

interface PerformanceGoal {
  id: string;
  personId: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  status: GoalStatus;
  createdAt: string;
  personFirstName?: string | null;
  personLastName?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function personDisplayName(p: Person): string {
  if (p.name) return p.name;
  return [p.firstName, p.lastName].filter(Boolean).join(" ") || "Unknown";
}

function reviewPersonName(r: PerformanceReview): string {
  return (
    [r.personFirstName, r.personLastName].filter(Boolean).join(" ") || r.personId
  );
}

function goalPersonName(g: PerformanceGoal): string {
  return (
    [g.personFirstName, g.personLastName].filter(Boolean).join(" ") || g.personId
  );
}

function reviewStatusBadge(status: ReviewStatus) {
  switch (status) {
    case "draft":
      return <Badge variant="secondary">Draft</Badge>;
    case "submitted":
      return <Badge variant="default">Submitted</Badge>;
    case "acknowledged":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Acknowledged
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function goalStatusBadge(status: GoalStatus) {
  switch (status) {
    case "not_started":
      return <Badge variant="secondary">Not Started</Badge>;
    case "in_progress":
      return <Badge variant="default">In Progress</Badge>;
    case "completed":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Completed
        </Badge>
      );
    case "missed":
      return <Badge variant="destructive">Missed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function nextReviewStatus(current: ReviewStatus): ReviewStatus {
  if (current === "draft") return "submitted";
  if (current === "submitted") return "acknowledged";
  return "acknowledged";
}

// ─── Default form values ──────────────────────────────────────────────────────

interface ReviewFormData {
  personId: string;
  period: string;
  rating: string;
  strengths: string;
  improvements: string;
  goals: string;
}

const defaultReviewForm: ReviewFormData = {
  personId: "",
  period: "",
  rating: "",
  strengths: "",
  improvements: "",
  goals: "",
};

interface GoalFormData {
  personId: string;
  title: string;
  description: string;
  targetDate: string;
}

const defaultGoalForm: GoalFormData = {
  personId: "",
  title: "",
  description: "",
  targetDate: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PerformancePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Dialog state ─────────────────────────────────────────────────────────

  const [isNewReviewOpen, setIsNewReviewOpen] = useState(false);
  const [isEditReviewOpen, setIsEditReviewOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<PerformanceReview | null>(null);

  const [isNewGoalOpen, setIsNewGoalOpen] = useState(false);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<PerformanceGoal | null>(null);

  // ── Form state ───────────────────────────────────────────────────────────

  const [reviewForm, setReviewForm] = useState<ReviewFormData>(defaultReviewForm);
  const [goalForm, setGoalForm] = useState<GoalFormData>(defaultGoalForm);
  const [editGoalStatus, setEditGoalStatus] = useState<GoalStatus>("not_started");

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<PerformanceReview[]>({
    queryKey: ["/api/performance/reviews"],
  });

  const { data: goals = [], isLoading: goalsLoading } = useQuery<PerformanceGoal[]>({
    queryKey: ["/api/performance/goals"],
  });

  const { data: people = [] } = useQuery<Person[]>({
    queryKey: ["/api/people"],
  });

  // ── Mutations ────────────────────────────────────────────────────────────

  const createReviewMutation = useMutation({
    mutationFn: (data: ReviewFormData) =>
      apiRequest("/api/performance/reviews", "POST", {
        personId: data.personId,
        period: data.period,
        rating: data.rating ? parseInt(data.rating, 10) : null,
        strengths: data.strengths || null,
        improvements: data.improvements || null,
        goals: data.goals || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/performance/reviews"] });
      setIsNewReviewOpen(false);
      setReviewForm(defaultReviewForm);
      toast({ title: "Review created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create review", variant: "destructive" });
    },
  });

  const updateReviewMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PerformanceReview> }) =>
      apiRequest(`/api/performance/reviews/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/performance/reviews"] });
      setIsEditReviewOpen(false);
      setEditingReview(null);
      toast({ title: "Review updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update review", variant: "destructive" });
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: (data: GoalFormData) =>
      apiRequest("/api/performance/goals", "POST", {
        personId: data.personId,
        title: data.title,
        description: data.description || null,
        targetDate: data.targetDate || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/performance/goals"] });
      setIsNewGoalOpen(false);
      setGoalForm(defaultGoalForm);
      toast({ title: "Goal created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create goal", variant: "destructive" });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PerformanceGoal> }) =>
      apiRequest(`/api/performance/goals/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/performance/goals"] });
      setIsEditGoalOpen(false);
      setEditingGoal(null);
      toast({ title: "Goal updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update goal", variant: "destructive" });
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleCreateReview = (e: React.FormEvent) => {
    e.preventDefault();
    createReviewMutation.mutate(reviewForm);
  };

  const handleOpenEditReview = (review: PerformanceReview) => {
    setEditingReview(review);
    setIsEditReviewOpen(true);
  };

  const handleAdvanceReviewStatus = () => {
    if (!editingReview) return;
    const nextStatus = nextReviewStatus(editingReview.status);
    updateReviewMutation.mutate({
      id: editingReview.id,
      data: { status: nextStatus },
    });
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    createGoalMutation.mutate(goalForm);
  };

  const handleOpenEditGoal = (goal: PerformanceGoal) => {
    setEditingGoal(goal);
    setEditGoalStatus(goal.status);
    setIsEditGoalOpen(true);
  };

  const handleSaveGoalStatus = () => {
    if (!editingGoal) return;
    updateGoalMutation.mutate({
      id: editingGoal.id,
      data: { status: editGoalStatus },
    });
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Performance</h1>
        <p className="text-muted-foreground mt-1">
          Manage performance reviews and goals for your team
        </p>
      </div>

      <Tabs defaultValue="reviews">
        <TabsList>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        {/* ── Reviews Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="reviews" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Performance Reviews</CardTitle>
              <Button size="sm" onClick={() => setIsNewReviewOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Review
              </Button>
            </CardHeader>
            <CardContent>
              {reviewsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3" />
                  Loading reviews…
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No reviews yet. Click "+ New Review" to get started.
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Person</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reviews.map((review) => (
                        <TableRow key={review.id}>
                          <TableCell className="font-medium">
                            {reviewPersonName(review)}
                          </TableCell>
                          <TableCell>{review.period}</TableCell>
                          <TableCell>
                            {review.rating != null ? `${review.rating}/5` : "—"}
                          </TableCell>
                          <TableCell>{reviewStatusBadge(review.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditReview(review)}
                            >
                              <Pencil className="h-4 w-4" />
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

        {/* ── Goals Tab ─────────────────────────────────────────────────────── */}
        <TabsContent value="goals" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Goals</CardTitle>
              <Button size="sm" onClick={() => setIsNewGoalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Goal
              </Button>
            </CardHeader>
            <CardContent>
              {goalsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3" />
                  Loading goals…
                </div>
              ) : goals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No goals yet. Click "+ New Goal" to get started.
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Person</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Target Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {goals.map((goal) => (
                        <TableRow key={goal.id}>
                          <TableCell className="font-medium">
                            {goalPersonName(goal)}
                          </TableCell>
                          <TableCell>{goal.title}</TableCell>
                          <TableCell>
                            {goal.targetDate
                              ? new Date(goal.targetDate).toLocaleDateString()
                              : "—"}
                          </TableCell>
                          <TableCell>{goalStatusBadge(goal.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditGoal(goal)}
                            >
                              <Pencil className="h-4 w-4" />
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
      </Tabs>

      {/* ── New Review Dialog ──────────────────────────────────────────────── */}
      <Dialog open={isNewReviewOpen} onOpenChange={setIsNewReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Performance Review</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateReview} className="space-y-4">
            <div>
              <Label htmlFor="review-person">Person</Label>
              <Select
                value={reviewForm.personId}
                onValueChange={(v) => setReviewForm({ ...reviewForm, personId: v })}
              >
                <SelectTrigger id="review-person">
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
              <Label htmlFor="review-period">Period</Label>
              <Input
                id="review-period"
                placeholder="e.g. 2026-Q1"
                value={reviewForm.period}
                onChange={(e) => setReviewForm({ ...reviewForm, period: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="review-rating">Rating (1–5)</Label>
              <Input
                id="review-rating"
                type="number"
                min={1}
                max={5}
                placeholder="e.g. 4"
                value={reviewForm.rating}
                onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="review-strengths">Strengths</Label>
              <Textarea
                id="review-strengths"
                placeholder="Key strengths observed…"
                value={reviewForm.strengths}
                onChange={(e) => setReviewForm({ ...reviewForm, strengths: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="review-improvements">Areas for Improvement</Label>
              <Textarea
                id="review-improvements"
                placeholder="Areas to work on…"
                value={reviewForm.improvements}
                onChange={(e) =>
                  setReviewForm({ ...reviewForm, improvements: e.target.value })
                }
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="review-goals">Goals</Label>
              <Textarea
                id="review-goals"
                placeholder="Goals for next period…"
                value={reviewForm.goals}
                onChange={(e) => setReviewForm({ ...reviewForm, goals: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsNewReviewOpen(false);
                  setReviewForm(defaultReviewForm);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createReviewMutation.isPending || !reviewForm.personId}
              >
                {createReviewMutation.isPending ? "Creating…" : "Create Review"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Review Dialog ────────────────────────────────────────────── */}
      <Dialog open={isEditReviewOpen} onOpenChange={setIsEditReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
          </DialogHeader>
          {editingReview && (
            <div className="space-y-4">
              <div className="rounded-md bg-muted px-4 py-3 space-y-1">
                <p className="text-sm font-medium">{reviewPersonName(editingReview)}</p>
                <p className="text-sm text-muted-foreground">
                  Period: {editingReview.period}
                </p>
                <p className="text-sm text-muted-foreground">
                  Current status: {editingReview.status}
                </p>
              </div>

              {editingReview.strengths && (
                <div>
                  <p className="text-sm font-medium mb-1">Strengths</p>
                  <p className="text-sm text-muted-foreground">{editingReview.strengths}</p>
                </div>
              )}
              {editingReview.improvements && (
                <div>
                  <p className="text-sm font-medium mb-1">Areas for Improvement</p>
                  <p className="text-sm text-muted-foreground">
                    {editingReview.improvements}
                  </p>
                </div>
              )}
              {editingReview.goals && (
                <div>
                  <p className="text-sm font-medium mb-1">Goals</p>
                  <p className="text-sm text-muted-foreground">{editingReview.goals}</p>
                </div>
              )}

              {editingReview.status !== "acknowledged" && (
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground mb-3">
                    Advance status:{" "}
                    <span className="font-medium">{editingReview.status}</span>
                    {" → "}
                    <span className="font-medium">
                      {nextReviewStatus(editingReview.status)}
                    </span>
                  </p>
                  <Button
                    onClick={handleAdvanceReviewStatus}
                    disabled={updateReviewMutation.isPending}
                    className="w-full"
                  >
                    {updateReviewMutation.isPending
                      ? "Updating…"
                      : `Mark as ${nextReviewStatus(editingReview.status)}`}
                  </Button>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditReviewOpen(false);
                    setEditingReview(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── New Goal Dialog ───────────────────────────────────────────────── */}
      <Dialog open={isNewGoalOpen} onOpenChange={setIsNewGoalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Goal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateGoal} className="space-y-4">
            <div>
              <Label htmlFor="goal-person">Person</Label>
              <Select
                value={goalForm.personId}
                onValueChange={(v) => setGoalForm({ ...goalForm, personId: v })}
              >
                <SelectTrigger id="goal-person">
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
              <Label htmlFor="goal-title">Title</Label>
              <Input
                id="goal-title"
                placeholder="Goal title"
                value={goalForm.title}
                onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="goal-description">Description</Label>
              <Textarea
                id="goal-description"
                placeholder="Describe the goal…"
                value={goalForm.description}
                onChange={(e) =>
                  setGoalForm({ ...goalForm, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="goal-target-date">Target Date</Label>
              <Input
                id="goal-target-date"
                type="date"
                value={goalForm.targetDate}
                onChange={(e) =>
                  setGoalForm({ ...goalForm, targetDate: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsNewGoalOpen(false);
                  setGoalForm(defaultGoalForm);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createGoalMutation.isPending || !goalForm.personId}
              >
                {createGoalMutation.isPending ? "Creating…" : "Create Goal"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Goal Dialog ──────────────────────────────────────────────── */}
      <Dialog open={isEditGoalOpen} onOpenChange={setIsEditGoalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Goal Status</DialogTitle>
          </DialogHeader>
          {editingGoal && (
            <div className="space-y-4">
              <div className="rounded-md bg-muted px-4 py-3 space-y-1">
                <p className="text-sm font-medium">{editingGoal.title}</p>
                <p className="text-sm text-muted-foreground">
                  {goalPersonName(editingGoal)}
                </p>
                {editingGoal.targetDate && (
                  <p className="text-sm text-muted-foreground">
                    Target: {new Date(editingGoal.targetDate).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-goal-status">Status</Label>
                <Select
                  value={editGoalStatus}
                  onValueChange={(v) => setEditGoalStatus(v as GoalStatus)}
                >
                  <SelectTrigger id="edit-goal-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditGoalOpen(false);
                    setEditingGoal(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveGoalStatus}
                  disabled={updateGoalMutation.isPending}
                >
                  {updateGoalMutation.isPending ? "Saving…" : "Save Status"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
