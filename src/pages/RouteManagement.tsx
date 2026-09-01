import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { NetworkMap } from "@/components/NetworkMap";
import {
  Plus,
  MapPin,
  Trash2,
  Edit3,
  AlertTriangle,
  Clock,
  ArrowRightLeft,
} from "lucide-react";
import { toast } from "sonner";

export default function RouteManagement() {
  const routes = useQuery(api.routes.list);
  const createRoute = useMutation(api.routes.create);
  const updateRoute = useMutation(api.routes.update);
  const deleteRoute = useMutation(api.routes.remove);
  const overlaps = useQuery(
    api.routes.detectOverlaps,
    { coordinates: [] }
  );

  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawnCoords, setDrawnCoords] = useState<Array<{ lat: number; lng: number }>>([]);

  const [form, setForm] = useState({
    routeId: "",
    name: "",
    startPoint: "",
    endPoint: "",
    stops: "",
    estimatedTravelTime: 30,
    operatingStart: "06:00",
    operatingEnd: "22:00",
    status: "proposed",
  });

  const handleCreate = async () => {
    if (!form.routeId || !form.name) {
      toast.error("Route ID and name are required");
      return;
    }

    try {
      await createRoute({
        routeId: form.routeId,
        name: form.name,
        startPoint: form.startPoint || "TBD",
        endPoint: form.endPoint || "TBD",
        stops: form.stops.split(",").map((s) => s.trim()).filter(Boolean),
        estimatedTravelTime: form.estimatedTravelTime,
        operatingHours: { start: form.operatingStart, end: form.operatingEnd },
        status: form.status,
        coordinates: drawnCoords.length > 0 ? drawnCoords : [
          { lat: 40.7128 + Math.random() * 0.02, lng: -74.006 + Math.random() * 0.02 },
          { lat: 40.7158 + Math.random() * 0.02, lng: -74.002 + Math.random() * 0.02 },
        ],
      });
      toast.success("Route created successfully");
      setShowCreateDialog(false);
      setDrawnCoords([]);
      setForm({
        routeId: "", name: "", startPoint: "", endPoint: "", stops: "",
        estimatedTravelTime: 30, operatingStart: "06:00", operatingEnd: "22:00", status: "proposed",
      });
    } catch (e: any) {
      toast.error(e.message || "Failed to create route");
    }
  };

  const handleDelete = async (id: Id<"routes">, routeId: string) => {
    await deleteRoute({ id });
    toast.success(`Route ${routeId} deleted`);
    if (selectedRoute === routeId) setSelectedRoute(null);
  };

  const selected = routes?.find((r) => r.routeId === selectedRoute);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Route Management</h1>
            <p className="text-sm text-muted-foreground">
              Create, edit, and visualize bus routes on the network
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={drawingMode ? "destructive" : "outline"}
              size="sm"
              onClick={() => {
                setDrawingMode(!drawingMode);
                setDrawnCoords([]);
              }}
              className="gap-1.5"
            >
              <MapPin className="size-3.5" />
              {drawingMode ? "Stop Drawing" : "Draw Route"}
            </Button>
            <Button size="sm" onClick={() => setShowCreateDialog(true)} className="gap-1.5">
              <Plus className="size-3.5" />
              New Route
            </Button>
          </div>
        </div>

        {/* Map and Route List */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Network Map</CardTitle>
                {drawingMode && (
                  <p className="text-xs text-primary">
                    Click to place waypoints. Double-click to finish drawing. Points drawn: {drawnCoords.length}
                  </p>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <NetworkMap
                  routes={
                    routes?.map((r) => ({
                      routeId: r.routeId,
                      name: r.name,
                      coordinates: r.coordinates,
                      status: r.status,
                      stops: r.stops,
                    })) ?? []
                  }
                  onRouteClick={setSelectedRoute}
                  drawingMode={drawingMode}
                  onDrawComplete={(coords) => {
                    setDrawnCoords(coords);
                    setDrawingMode(false);
                    setShowCreateDialog(true);
                  }}
                  height="480px"
                />
              </CardContent>
            </Card>
          </div>

          {/* Route List */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Routes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[480px] overflow-y-auto p-4 space-y-2">
                {routes?.map((route) => (
                  <button
                    key={route._id}
                    onClick={() => setSelectedRoute(route.routeId)}
                    className={`w-full rounded-lg border p-3 text-left transition-all ${
                      selectedRoute === route.routeId
                        ? "border-primary/30 bg-primary/5 shadow-sm"
                        : "border-border/50 hover:border-border hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary">{route.routeId}</span>
                        <span className="text-sm font-medium text-foreground">{route.name}</span>
                      </div>
                      <Badge
                        variant={
                          route.status === "active"
                            ? "default"
                            : route.status === "proposed"
                              ? "secondary"
                              : "outline"
                        }
                        className="text-[10px]"
                      >
                        {route.status}
                      </Badge>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ArrowRightLeft className="size-3" />
                        {route.startPoint} → {route.endPoint}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {route.estimatedTravelTime} min
                      </span>
                      <span>{route.stops.length} stops</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Route Detail */}
        {selected && (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">
                    {selected.routeId}: {selected.name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Route details and configuration
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(selected._id, selected.routeId)}
                    className="gap-1"
                  >
                    <Trash2 className="size-3" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DetailItem label="Route ID" value={selected.routeId} />
                <DetailItem label="Status" value={selected.status} />
                <DetailItem label="Start" value={selected.startPoint} />
                <DetailItem label="End" value={selected.endPoint} />
                <DetailItem label="Travel Time" value={`${selected.estimatedTravelTime} min`} />
                <DetailItem
                  label="Operating Hours"
                  value={`${selected.operatingHours.start} – ${selected.operatingHours.end}`}
                />
                <DetailItem label="Stops" value={selected.stops.join(", ") || "None"} />
                <DetailItem
                  label="Waypoints"
                  value={`${selected.coordinates.length} coordinates`}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Route Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Route</DialogTitle>
              <DialogDescription>
                {drawnCoords.length > 0
                  ? `${drawnCoords.length} waypoints captured from map drawing`
                  : "Define a new bus route for the network"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Route ID</Label>
                  <Input
                    value={form.routeId}
                    onChange={(e) => setForm({ ...form, routeId: e.target.value })}
                    placeholder="R-06"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="proposed">Proposed</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Route Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Downtown Express"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Starting Point</Label>
                  <Input
                    value={form.startPoint}
                    onChange={(e) => setForm({ ...form, startPoint: e.target.value })}
                    placeholder="Central Station"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Ending Point</Label>
                  <Input
                    value={form.endPoint}
                    onChange={(e) => setForm({ ...form, endPoint: e.target.value })}
                    placeholder="City Hall"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Stops (comma-separated)</Label>
                <Input
                  value={form.stops}
                  onChange={(e) => setForm({ ...form, stops: e.target.value })}
                  placeholder="Market St, Library, Plaza"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Travel Time (min)</Label>
                  <Input
                    type="number"
                    value={form.estimatedTravelTime}
                    onChange={(e) => setForm({ ...form, estimatedTravelTime: Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Opens</Label>
                  <Input
                    type="time"
                    value={form.operatingStart}
                    onChange={(e) => setForm({ ...form, operatingStart: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Closes</Label>
                  <Input
                    type="time"
                    value={form.operatingEnd}
                    onChange={(e) => setForm({ ...form, operatingEnd: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full">
                Create Route
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}
