import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Plus,
  CalendarClock,
  Link2,
  Unlink,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Clock,
  Route,
  Bus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export default function Scheduling() {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const duties = useQuery(api.scheduling.listByDate, { date: selectedDate });
  const allDuties = useQuery(api.scheduling.list);
  const routes = useQuery(api.routes.list);
  const crew = useQuery(api.crew.list);
  const buses = useQuery(api.buses.list);
  const conflicts = useQuery(api.scheduling.detectConflicts, { date: selectedDate });
  const fallbacks = useQuery(api.scheduling.getFallbackSuggestions, {
    routeId: "R-01",
    startTime: "06:00",
    endTime: "14:00",
    date: selectedDate,
  });

  const createDuty = useMutation(api.scheduling.create);
  const deleteDuty = useMutation(api.scheduling.remove);
  const updateDuty = useMutation(api.scheduling.update);
  const seedData = useMutation(api.scheduling.seed);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [form, setForm] = useState({
    routeId: "",
    busId: "",
    crewId: "",
    startTime: "06:00",
    endTime: "14:00",
    mode: "linked",
    notes: "",
  });

  const handleCreate = async () => {
    if (!form.routeId) {
      toast.error("Route is required");
      return;
    }
    try {
      const dutyData: any = {
        routeId: form.routeId,
        startTime: form.startTime,
        endTime: form.endTime,
        mode: form.mode,
        date: selectedDate,
        notes: form.notes || undefined,
      };
      if (form.mode === "linked") {
        dutyData.busId = form.busId || undefined;
        dutyData.crewId = form.crewId || undefined;
      } else {
        dutyData.busId = form.busId || undefined;
        dutyData.crewId = form.crewId || undefined;
      }
      await createDuty(dutyData);
      toast.success("Duty created successfully");
      setShowCreateDialog(false);
      setForm({ routeId: "", busId: "", crewId: "", startTime: "06:00", endTime: "14:00", mode: "linked", notes: "" });
    } catch (e: any) {
      toast.error(e.message || "Failed to create duty");
    }
  };

  const handleDelete = async (id: any) => {
    await deleteDuty({ id });
    toast.success("Duty removed");
  };

  const handleSeed = async () => {
    const result = await seedData();
    toast.success(typeof result === "string" ? result : "Data seeded");
  };

  const availableCrew = useMemo(() => {
    if (!crew) return [];
    return crew.filter((c) => c.availability === "available");
  }, [crew]);

  const availableBuses = useMemo(() => {
    if (!buses) return [];
    return buses.filter((b) => b.currentStatus === "available");
  }, [buses]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Scheduling</h1>
            <p className="text-sm text-muted-foreground">
              Assign crews and buses to routes with linked and unlinked duty modes
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSeed} className="gap-1.5">
              <CalendarClock className="size-3.5" />
              Seed Demo Data
            </Button>
            <Button size="sm" onClick={() => setShowCreateDialog(true)} className="gap-1.5">
              <Plus className="size-3.5" />
              New Duty
            </Button>
          </div>
        </div>

        {/* Date Picker */}
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium">Schedule Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
              {conflicts && conflicts.length > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="size-3" />
                  {conflicts.length} conflict{conflicts.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Duty Mode Legend */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Link2 className="size-3.5 text-primary" />
            <span><strong className="text-foreground">Linked:</strong> Crew and bus assigned together as one operational duty</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Unlink className="size-3.5 text-accent" />
            <span><strong className="text-foreground">Unlinked:</strong> Crew and bus assigned independently</span>
          </div>
        </div>

        {/* Tabs: Schedule + Conflicts */}
        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="schedule" className="gap-1.5">
              <CalendarClock className="size-3.5" />
              Schedule ({duties?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="conflicts" className="gap-1.5">
              <AlertTriangle className="size-3.5" />
              Conflicts ({conflicts?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule">
            <Card className="border-border/60">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Route</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bus</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Crew</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mode</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {duties?.map((duty) => {
                        const route = routes?.find((r) => r.routeId === duty.routeId);
                        const bus = duty.busId ? buses?.find((b) => b.busId === duty.busId) : null;
                        const crewMember = duty.crewId ? crew?.find((c) => c.crewId === duty.crewId) : null;
                        const hasConflict = conflicts?.some((c) => c.relatedDuties.includes(duty._id));

                        return (
                          <tr key={duty._id} className={`hover:bg-muted/20 transition-colors ${hasConflict ? "bg-destructive/[0.02]" : ""}`}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 font-medium text-foreground">
                                <Clock className="size-3 text-muted-foreground" />
                                {duty.startTime} – {duty.endTime}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <Route className="size-3 text-primary" />
                                <span className="font-medium text-foreground">
                                  {duty.routeId}
                                </span>
                                {route && (
                                  <span className="text-xs text-muted-foreground">
                                    {route.name}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {duty.busId ? (
                                <span className="flex items-center gap-1 text-foreground/80">
                                  <Bus className="size-3 text-accent" />
                                  {duty.busId}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Unassigned</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {duty.crewId ? (
                                <span className="flex items-center gap-1 text-foreground/80">
                                  <Users className="size-3 text-chart-3" />
                                  {crewMember?.name || duty.crewId}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Unassigned</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={duty.mode === "linked" ? "default" : "secondary"}
                                className="gap-1 text-[10px]"
                              >
                                {duty.mode === "linked" ? (
                                  <Link2 className="size-2.5" />
                                ) : (
                                  <Unlink className="size-2.5" />
                                )}
                                {duty.mode}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={
                                  hasConflict
                                    ? "destructive"
                                    : duty.status === "scheduled"
                                      ? "default"
                                      : "secondary"
                                }
                                className="text-[10px]"
                              >
                                {hasConflict ? "Conflict" : duty.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDelete(duty._id)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {(!duties || duties.length === 0) && (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                      No duties scheduled for this date. Click "New Duty" or "Seed Demo Data" to get started.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conflicts">
            <div className="space-y-4">
              {conflicts && conflicts.length > 0 ? (
                conflicts.map((conflict, i) => (
                  <Card key={i} className={`border-border/60 ${conflict.severity === "high" ? "border-destructive/20" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                          conflict.severity === "high"
                            ? "bg-destructive/10"
                            : conflict.severity === "medium"
                              ? "bg-chart-4/10"
                              : "bg-muted"
                        }`}>
                          <AlertTriangle className={`size-4 ${
                            conflict.severity === "high" ? "text-destructive" : conflict.severity === "medium" ? "text-chart-4" : "text-muted-foreground"
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={conflict.severity === "high" ? "destructive" : "default"} className="text-[10px]">
                              {conflict.severity}
                            </Badge>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              {conflict.type.replace(/_/g, " ")}
                            </span>
                          </div>
                          <p className="text-sm text-foreground font-medium">{conflict.description}</p>
                          {conflict.fallbackSuggestions.length > 0 && (
                            <div className="mt-3 rounded-lg bg-muted/40 p-3">
                              <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-primary">
                                <Lightbulb className="size-3" />
                                Suggested Actions
                              </div>
                              <ul className="space-y-1">
                                {conflict.fallbackSuggestions.map((suggestion, j) => (
                                  <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                                    <CheckCircle2 className="size-3 mt-0.5 shrink-0 text-accent" />
                                    {suggestion}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-border/60">
                  <CardContent className="py-12 text-center">
                    <CheckCircle2 className="mx-auto mb-3 size-10 text-accent" />
                    <p className="text-sm font-medium text-foreground">No conflicts detected</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      All duties for this date are properly scheduled
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Duty Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Duty Assignment</DialogTitle>
              <DialogDescription>
                Assign a crew member and bus to a route duty
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs">Assignment Mode</Label>
                <Select value={form.mode} onValueChange={(v) => setForm({ ...form, mode: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linked">
                      <span className="flex items-center gap-1.5">
                        <Link2 className="size-3" />
                        Linked (Crew + Bus together)
                      </span>
                    </SelectItem>
                    <SelectItem value="unlinked">
                      <span className="flex items-center gap-1.5">
                        <Unlink className="size-3" />
                        Unlinked (Independent)
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Route</Label>
                <Select value={form.routeId} onValueChange={(v) => setForm({ ...form, routeId: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select route" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes?.map((r) => (
                      <SelectItem key={r._id} value={r.routeId}>
                        {r.routeId}: {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Crew Member</Label>
                  <Select value={form.crewId} onValueChange={(v) => setForm({ ...form, crewId: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select crew" />
                    </SelectTrigger>
                    <SelectContent>
                      {crew?.map((c) => (
                        <SelectItem key={c._id} value={c.crewId}>
                          {c.name} ({c.crewId}) — {c.availability}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Bus</Label>
                  <Select value={form.busId} onValueChange={(v) => setForm({ ...form, busId: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select bus" />
                    </SelectTrigger>
                    <SelectContent>
                      {buses?.map((b) => (
                        <SelectItem key={b._id} value={b.busId}>
                          {b.busId} ({b.capacity} seats) — {b.currentStatus}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Start Time</Label>
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">End Time</Label>
                  <Input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full">
                Create Duty
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
