import { useState } from "react";
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
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Plus,
  Users,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  Phone,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

const DEPOTS = ["Central Depot", "Harbor Depot", "University Depot", "Airport Depot"];
const ROLES = ["Driver", "Conductor", "Inspector", "Mechanic"];

export default function CrewManagement() {
  const crew = useQuery(api.crew.list);
  const createCrew = useMutation(api.crew.create);
  const updateCrew = useMutation(api.crew.update);
  const deleteCrew = useMutation(api.crew.remove);
  const restCheck = useQuery(
    api.crew.validateRestPeriod,
    { crewId: "", proposedStartTime: "06:00" }
  );

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [form, setForm] = useState({
    crewId: "",
    name: "",
    role: "Driver",
    assignedDepot: "Central Depot",
    availability: "available",
    requiredRestPeriod: 8,
    phone: "",
  });

  const handleCreate = async () => {
    if (!form.crewId || !form.name) {
      toast.error("Crew ID and name are required");
      return;
    }
    try {
      await createCrew({
        ...form,
        dutyStartTime: undefined,
        dutyEndTime: undefined,
        lastCompletedDuty: undefined,
        currentAssignment: undefined,
      });
      toast.success(`${form.name} added to crew database`);
      setShowCreateDialog(false);
      setForm({
        crewId: "", name: "", role: "Driver", assignedDepot: "Central Depot",
        availability: "available", requiredRestPeriod: 8, phone: "",
      });
    } catch (e: any) {
      toast.error(e.message || "Failed to create crew member");
    }
  };

  const handleDelete = async (id: any) => {
    await deleteCrew({ id });
    toast.success("Crew member removed");
  };

  const statusColors: Record<string, string> = {
    available: "bg-accent/10 text-accent border-accent/20",
    on_duty: "bg-primary/10 text-primary border-primary/20",
    resting: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    off_duty: "bg-muted text-muted-foreground border-border",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Crew Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage crew members, availability, and rest periods
            </p>
          </div>
          <Button size="sm" onClick={() => setShowCreateDialog(true)} className="gap-1.5">
            <Plus className="size-3.5" />
            Add Crew Member
          </Button>
        </div>

        {/* Summary Cards */}
        {crew && (
          <div className="grid gap-4 sm:grid-cols-4">
            <MiniStat
              icon={Users}
              label="Total Crew"
              value={crew.length}
              color="text-primary"
              bg="bg-primary/10"
            />
            <MiniStat
              icon={ShieldCheck}
              label="Available"
              value={crew.filter((c) => c.availability === "available").length}
              color="text-accent"
              bg="bg-accent/10"
            />
            <MiniStat
              icon={Clock}
              label="On Duty"
              value={crew.filter((c) => c.availability === "on_duty").length}
              color="text-primary"
              bg="bg-primary/10"
            />
            <MiniStat
              icon={AlertTriangle}
              label="Resting"
              value={crew.filter((c) => c.availability === "resting").length}
              color="text-chart-4"
              bg="bg-chart-4/10"
            />
          </div>
        )}

        {/* Crew Table */}
        <Card className="border-border/60">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Crew Member
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Depot
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Rest Period
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Duty Hours
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {crew?.map((member) => (
                    <tr key={member._id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-foreground">{member.name}</div>
                          <div className="text-xs text-muted-foreground">{member.crewId}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground/80">{member.role}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-foreground/80">
                          <MapPin className="size-3 text-muted-foreground" />
                          {member.assignedDepot}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusColors[member.availability] || ""}`}>
                          {member.availability.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground/80">{member.requiredRestPeriod}h</td>
                      <td className="px-4 py-3 text-foreground/80">
                        {member.dutyStartTime && member.dutyEndTime
                          ? `${member.dutyStartTime} – ${member.dutyEndTime}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(member._id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!crew || crew.length === 0) && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No crew members added yet. Click "Add Crew Member" to get started.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rest Period Info */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              Rest Period Policy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
              <p>
                The system automatically validates whether each crew member has received their
                required rest period before confirming assignments. An assignment violating the
                configured rest period will be blocked or flagged with a warning.
              </p>
              <p className="mt-2">
                <strong className="text-foreground">Example:</strong> Crew C-104 completed duty at 22:00.
                Required rest: 8 hours. Earliest next assignment: 06:00.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Crew Member</DialogTitle>
              <DialogDescription>Add a new crew member to the system</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Crew ID</Label>
                  <Input
                    value={form.crewId}
                    onChange={(e) => setForm({ ...form, crewId: e.target.value })}
                    placeholder="C-109"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Full Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="John Smith"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Role</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Depot</Label>
                  <Select value={form.assignedDepot} onValueChange={(v) => setForm({ ...form, assignedDepot: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPOTS.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Availability</Label>
                  <Select value={form.availability} onValueChange={(v) => setForm({ ...form, availability: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="on_duty">On Duty</SelectItem>
                      <SelectItem value="resting">Resting</SelectItem>
                      <SelectItem value="off_duty">Off Duty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Rest Period (hours)</Label>
                  <Input
                    type="number"
                    value={form.requiredRestPeriod}
                    onChange={(e) => setForm({ ...form, requiredRestPeriod: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Phone (optional)</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="555-0109"
                  className="mt-1"
                />
              </div>
              <Button onClick={handleCreate} className="w-full">
                Add Crew Member
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex size-9 items-center justify-center rounded-lg ${bg}`}>
          <Icon className={`size-4 ${color}`} />
        </div>
        <div>
          <div className="text-lg font-bold text-foreground">{value}</div>
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
