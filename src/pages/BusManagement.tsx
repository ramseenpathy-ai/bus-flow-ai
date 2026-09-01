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
  Bus,
  Wrench,
  CheckCircle2,
  XCircle,
  Trash2,
  Users,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

const DEPOTS = ["Central Depot", "Harbor Depot", "University Depot", "Airport Depot"];

export default function BusManagement() {
  const buses = useQuery(api.buses.list);
  const createBus = useMutation(api.buses.create);
  const updateBus = useMutation(api.buses.update);
  const deleteBus = useMutation(api.buses.remove);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [form, setForm] = useState({
    busId: "",
    capacity: 45,
    currentStatus: "available",
    depot: "Central Depot",
    maintenanceStatus: "",
  });

  const handleCreate = async () => {
    if (!form.busId) {
      toast.error("Bus ID is required");
      return;
    }
    try {
      await createBus({
        busId: form.busId,
        capacity: form.capacity,
        currentStatus: form.currentStatus,
        depot: form.depot,
        maintenanceStatus: form.maintenanceStatus || undefined,
        assignedRoute: undefined,
        assignedDuty: undefined,
        availabilityTime: undefined,
        lastMaintenance: undefined,
      });
      toast.success(`Bus ${form.busId} added to fleet`);
      setShowCreateDialog(false);
      setForm({ busId: "", capacity: 45, currentStatus: "available", depot: "Central Depot", maintenanceStatus: "" });
    } catch (e: any) {
      toast.error(e.message || "Failed to add bus");
    }
  };

  const handleDelete = async (id: string) => {
    await deleteBus({ id });
    toast.success("Bus removed from fleet");
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateBus({ id, currentStatus: status });
    toast.success("Status updated");
  };

  const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
    available: { color: "bg-accent/10 text-accent border-accent/20", icon: CheckCircle2, label: "Available" },
    on_route: { color: "bg-primary/10 text-primary border-primary/20", icon: Bus, label: "On Route" },
    maintenance: { color: "bg-chart-4/10 text-chart-4 border-chart-4/20", icon: Wrench, label: "Maintenance" },
    off_duty: { color: "bg-muted text-muted-foreground border-border", icon: XCircle, label: "Off Duty" },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Fleet Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage buses, track status, and check availability
            </p>
          </div>
          <Button size="sm" onClick={() => setShowCreateDialog(true)} className="gap-1.5">
            <Plus className="size-3.5" />
            Add Bus
          </Button>
        </div>

        {/* Fleet Stats */}
        {buses && (
          <div className="grid gap-4 sm:grid-cols-4">
            {Object.entries(statusConfig).map(([status, config]) => (
              <Card key={status} className="border-border/60">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`flex size-9 items-center justify-center rounded-lg ${config.color.split(" ")[0]}`}>
                    <config.icon className={`size-4 ${config.color.split(" ")[1]}`} />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">
                      {buses.filter((b) => b.currentStatus === status).length}
                    </div>
                    <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      {config.label}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Bus Grid */}
        {buses && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {buses.map((bus) => {
              const config = statusConfig[bus.currentStatus] || statusConfig.off_duty;
              return (
                <Card key={bus._id} className="border-border/60 transition-all hover:shadow-md hover:shadow-primary/[0.02]">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-foreground">{bus.busId}</span>
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3" />
                          {bus.depot}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(bus._id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="rounded-lg bg-muted/30 p-2">
                        <div className="text-xs text-muted-foreground">Capacity</div>
                        <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                          <Users className="size-3" />
                          {bus.capacity} seats
                        </div>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-2">
                        <div className="text-xs text-muted-foreground">Status</div>
                        <div className="text-sm font-medium text-foreground">
                          {bus.currentStatus.replace("_", " ")}
                        </div>
                      </div>
                    </div>

                    {bus.assignedRoute && (
                      <div className="mb-3 rounded-lg bg-primary/5 p-2 text-xs">
                        <span className="font-medium text-primary">Assigned: </span>
                        <span className="text-foreground/80">{bus.assignedRoute}</span>
                      </div>
                    )}

                    {bus.maintenanceStatus && (
                      <div className="mb-3 rounded-lg bg-chart-4/5 p-2 text-xs">
                        <span className="font-medium text-chart-4">Maintenance: </span>
                        <span className="text-foreground/80">{bus.maintenanceStatus}</span>
                      </div>
                    )}

                    <div className="flex gap-1.5">
                      {bus.currentStatus !== "available" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => handleStatusChange(bus._id, "available")}
                        >
                          Set Available
                        </Button>
                      )}
                      {bus.currentStatus !== "maintenance" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => handleStatusChange(bus._id, "maintenance")}
                        >
                          Maintenance
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Bus to Fleet</DialogTitle>
              <DialogDescription>Register a new bus in the system</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Bus ID</Label>
                  <Input
                    value={form.busId}
                    onChange={(e) => setForm({ ...form, busId: e.target.value })}
                    placeholder="B-009"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Capacity (seats)</Label>
                  <Input
                    type="number"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Depot</Label>
                  <Select value={form.depot} onValueChange={(v) => setForm({ ...form, depot: v })}>
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
                <div>
                  <Label className="text-xs">Initial Status</Label>
                  <Select value={form.currentStatus} onValueChange={(v) => setForm({ ...form, currentStatus: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="off_duty">Off Duty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Maintenance Notes (optional)</Label>
                <Input
                  value={form.maintenanceStatus}
                  onChange={(e) => setForm({ ...form, maintenanceStatus: e.target.value })}
                  placeholder="Scheduled brake service"
                  className="mt-1"
                />
              </div>
              <Button onClick={handleCreate} className="w-full">
                Add Bus
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
