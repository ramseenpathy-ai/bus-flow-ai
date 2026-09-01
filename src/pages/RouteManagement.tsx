import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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
import { NetworkMap } from "@/components/NetworkMap";
import {
  Plus, Search, Trash2, ArrowUpDown, ArrowUp, ArrowDown,
  MapPin, Clock, Route, Users, Bus, X, Eye, ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";

type SortKey = "routeId" | "name" | "startPoint" | "endPoint" | "estimatedTravelTime" | "estimatedDistance" | "passengerLoad";

export default function RouteManagement() {
  const routes = useQuery(api.routes.list);
  const routeVerify = useQuery(api.routeMigration.verifyRoutes);
  const migrateToChennai = useMutation(api.routeMigration.migrateToChennai);
  const createRoute = useMutation(api.routes.create);
  const updateRoute = useMutation(api.routes.update);
  const deleteRoute = useMutation(api.routes.remove);
  const hasMigrated = useRef(false);

  // Auto-migrate: if database doesn't have Chennai routes, run migration
  useEffect(() => {
    if (routeVerify && !routeVerify.hasChennaiRoutes && !hasMigrated.current) {
      hasMigrated.current = true;
      migrateToChennai().then((result) => {
        toast.success(String(result));
      }).catch((err: any) => {
        toast.error(err.message || "Migration failed");
        hasMigrated.current = false;
      });
    }
  }, [routeVerify, migrateToChennai]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterLoad, setFilterLoad] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("routeId");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawnCoords, setDrawnCoords] = useState<Array<{ lat: number; lng: number }>>([]);

  const [form, setForm] = useState({
    routeId: "", name: "", startPoint: "", endPoint: "",
    stops: "", estimatedTravelTime: 30, estimatedDistance: 10,
    routeType: "Ordinary", passengerLoad: "Medium", busCount: 4,
    operatingStart: "06:00", operatingEnd: "22:00", status: "active",
  });

  const resetForm = () => setForm({
    routeId: "", name: "", startPoint: "", endPoint: "",
    stops: "", estimatedTravelTime: 30, estimatedDistance: 10,
    routeType: "Ordinary", passengerLoad: "Medium", busCount: 4,
    operatingStart: "06:00", operatingEnd: "22:00", status: "active",
  });

  // Chennai default coordinates for new routes
  const chennaiDefault = [
    { lat: 13.0827 + Math.random() * 0.01, lng: 80.2707 + Math.random() * 0.01 },
    { lat: 13.0927 + Math.random() * 0.01, lng: 80.2807 + Math.random() * 0.01 },
  ];

  const routeTypes = ["Ordinary", "Express", "Deluxe", "M-Series", "M-Series / Express"];
  const loadLevels = ["High", "Medium", "Low"];

  const filteredRoutes = useMemo(() => {
    if (!routes) return [];
    let result = [...routes];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) =>
        r.routeId.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.startPoint.toLowerCase().includes(q) ||
        r.endPoint.toLowerCase().includes(q) ||
        r.stops.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (filterType !== "all") result = result.filter((r) => r.routeType === filterType);
    if (filterLoad !== "all") result = result.filter((r) => r.passengerLoad === filterLoad);
    if (filterStatus !== "all") result = result.filter((r) => r.status === filterStatus);

    result.sort((a, b) => {
      let av: any = a[sortKey] ?? "";
      let bv: any = b[sortKey] ?? "";
      if (sortKey === "estimatedTravelTime" || sortKey === "estimatedDistance") {
        av = Number(av) || 0;
        bv = Number(bv) || 0;
      } else {
        av = String(av).toLowerCase();
        bv = String(bv).toLowerCase();
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [routes, searchQuery, filterType, filterLoad, filterStatus, sortKey, sortDir]);

  const selected = useMemo(() => {
    if (!routes || !selectedRouteId) return null;
    return routes.find((r) => r.routeId === selectedRouteId) ?? null;
  }, [routes, selectedRouteId]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="size-3 opacity-30" />;
    return sortDir === "asc" ? <ArrowUp className="size-3 text-primary" /> : <ArrowDown className="size-3 text-primary" />;
  };

  const handleCreate = async () => {
    if (!form.routeId || !form.name) { toast.error("Route ID and name are required"); return; }
    try {
      await createRoute({
        routeId: form.routeId, name: form.name,
        startPoint: form.startPoint || "TBD", endPoint: form.endPoint || "TBD",
        stops: form.stops.split(",").map((s) => s.trim()).filter(Boolean),
        estimatedTravelTime: form.estimatedTravelTime,
        estimatedDistance: form.estimatedDistance,
        routeType: form.routeType, passengerLoad: form.passengerLoad, busCount: form.busCount,
        operatingHours: { start: form.operatingStart, end: form.operatingEnd },
        status: form.status,
        coordinates: drawnCoords.length > 0 ? drawnCoords : chennaiDefault,
      });
      toast.success(`Route ${form.routeId} created`);
      setShowCreateDialog(false); setDrawnCoords([]); resetForm();
    } catch (e: any) { toast.error(e.message || "Failed to create route"); }
  };

  const handleEdit = async () => {
    if (!selected) return;
    try {
      await updateRoute({
        id: selected._id, name: form.name,
        startPoint: form.startPoint, endPoint: form.endPoint,
        stops: form.stops.split(",").map((s) => s.trim()).filter(Boolean),
        estimatedTravelTime: form.estimatedTravelTime,
        estimatedDistance: form.estimatedDistance,
        routeType: form.routeType, passengerLoad: form.passengerLoad, busCount: form.busCount,
        operatingHours: { start: form.operatingStart, end: form.operatingEnd },
        status: form.status,
      });
      toast.success(`Route ${selected.routeId} updated`);
      setShowEditDialog(false);
    } catch (e: any) { toast.error(e.message || "Failed to update route"); }
  };

  const openEdit = (r: any) => {
    setForm({
      routeId: r.routeId, name: r.name, startPoint: r.startPoint, endPoint: r.endPoint,
      stops: r.stops.join(", "), estimatedTravelTime: r.estimatedTravelTime,
      estimatedDistance: r.estimatedDistance ?? 0, routeType: r.routeType ?? "Ordinary",
      passengerLoad: r.passengerLoad ?? "Medium", busCount: r.busCount ?? 0,
      operatingStart: r.operatingHours.start, operatingEnd: r.operatingHours.end, status: r.status,
    });
    setShowEditDialog(true);
  };

  const handleDelete = async (id: Id<"routes">, routeId: string) => {
    await deleteRoute({ id });
    toast.success(`Route ${routeId} deleted`);
    if (selectedRouteId === routeId) setSelectedRouteId(null);
  };

  const loadBadge = (load?: string) => {
    if (load === "High") return <Badge variant="destructive" className="text-[10px]">High</Badge>;
    if (load === "Medium") return <Badge variant="default" className="text-[10px]">Medium</Badge>;
    if (load === "Low") return <Badge variant="secondary" className="text-[10px]">Low</Badge>;
    return <Badge variant="outline" className="text-[10px]">—</Badge>;
  };

  const typeBadge = (type?: string) => {
    if (!type) return <Badge variant="outline" className="text-[10px]">—</Badge>;
    if (type.includes("Express")) return <Badge className="text-[10px] bg-primary/15 text-primary border-primary/20">{type}</Badge>;
    if (type.includes("Deluxe")) return <Badge className="text-[10px] bg-accent/15 text-accent border-accent/20">{type}</Badge>;
    if (type.includes("M-Series")) return <Badge className="text-[10px] bg-chart-3/15 text-chart-3 border-chart-3/20">{type}</Badge>;
    return <Badge variant="secondary" className="text-[10px]">{type}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Chennai MTC Routes</h1>
            <p className="text-sm text-muted-foreground">
              {routes ? `${routes.length} routes loaded` : "Loading..."} · Search, filter, and manage bus routes across Chennai
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={drawingMode ? "destructive" : "outline"} size="sm"
              onClick={() => { setDrawingMode(!drawingMode); setDrawnCoords([]); }}
              className="gap-1.5"
            >
              <MapPin className="size-3.5" />
              {drawingMode ? "Stop Drawing" : "Draw Route"}
            </Button>
            <Button size="sm" onClick={() => { resetForm(); setShowCreateDialog(true); }} className="gap-1.5">
              <Plus className="size-3.5" /> New Route
            </Button>
          </div>
        </div>

        {/* Detail View (when a route is selected) */}
        {selected && (
          <Card className="border-primary/20 bg-primary/[0.02]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => setSelectedRouteId(null)}>
                    <ChevronLeft className="size-4" />
                  </Button>
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <span className="text-primary">{selected.routeId}</span>
                      {selected.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selected.startPoint} → {selected.endPoint} · {selected.estimatedDistance ?? "—"} km · {selected.estimatedTravelTime} min
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(selected)} className="gap-1">Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(selected._id, selected.routeId)} className="gap-1">
                    <Trash2 className="size-3" /> Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DetailItem label="Route Type" value={selected.routeType ?? "—"} />
                <DetailItem label="Status" value={selected.status} />
                <DetailItem label="Distance" value={`${selected.estimatedDistance ?? "—"} km`} />
                <DetailItem label="Travel Time" value={`${selected.estimatedTravelTime} min`} />
                <DetailItem label="Passenger Load" value={selected.passengerLoad ?? "—"} />
                <DetailItem label="Bus Count" value={`${selected.busCount ?? 0}`} />
                <DetailItem label="Operating Hours" value={`${selected.operatingHours.start} – ${selected.operatingHours.end}`} />
                <DetailItem label="Stops" value={`${selected.stops.length} stops`} />
              </div>
              <div>
                <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Major Stops</div>
                <div className="flex flex-wrap gap-1.5">
                  {selected.stops.map((stop, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                      <span className="text-muted-foreground text-[10px]">{i + 1}.</span> {stop}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl overflow-hidden border border-border/50">
                <NetworkMap
                  routes={[{
                    routeId: selected.routeId, name: selected.name,
                    coordinates: selected.coordinates, status: selected.status, stops: selected.stops,
                  }]}
                  focusRouteId={selected.routeId}
                  height="320px"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters & Search */}
        {!selected && (
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by route number, name, origin, destination, or stop..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="Route Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {routeTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filterLoad} onValueChange={setFilterLoad}>
                    <SelectTrigger className="w-[130px]"><SelectValue placeholder="Passenger Load" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Loads</SelectItem>
                      {loadLevels.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="proposed">Proposed</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  {(filterType !== "all" || filterLoad !== "all" || filterStatus !== "all" || searchQuery) && (
                    <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(""); setFilterType("all"); setFilterLoad("all"); setFilterStatus("all"); }} className="gap-1 text-xs">
                      <X className="size-3" /> Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Map + Table split */}
        {!selected && (
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Map */}
            <div className="lg:col-span-2">
              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Chennai Network Map</CardTitle>
                  {drawingMode && <p className="text-xs text-primary">Click to place waypoints. Double-click to finish. ({drawnCoords.length} points)</p>}
                </CardHeader>
                <CardContent className="p-0">
                  <NetworkMap
                    routes={filteredRoutes.map((r) => ({
                      routeId: r.routeId, name: r.name,
                      coordinates: r.coordinates, status: r.status, stops: r.stops,
                    }))}
                    onRouteClick={setSelectedRouteId}
                    drawingMode={drawingMode}
                    onDrawComplete={(coords) => { setDrawnCoords(coords); setDrawingMode(false); setShowCreateDialog(true); }}
                    height="500px"
                    focusRouteId={selectedRouteId ?? undefined}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Routes Table */}
            <div className="lg:col-span-3">
              <Card className="border-border/60">
                <CardContent className="p-0">
                  <div className="max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                        <tr className="border-b border-border/50">
                          <Th col="routeId" label="Route" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                          <Th col="name" label="Origin → Destination" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                          <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Type</th>
                          <Th col="estimatedTravelTime" label="Time" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                          <Th col="estimatedDistance" label="Dist" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                          <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Load</th>
                          <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground pr-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {filteredRoutes.map((route) => (
                          <tr
                            key={route._id}
                            className={`cursor-pointer transition-colors hover:bg-muted/30 ${selectedRouteId === route.routeId ? "bg-primary/5" : ""}`}
                            onClick={() => setSelectedRouteId(route.routeId)}
                          >
                            <td className="px-3 py-2.5">
                              <span className="font-bold text-primary">{route.routeId}</span>
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="text-xs font-medium text-foreground">{route.startPoint}</div>
                              <div className="text-[10px] text-muted-foreground">→ {route.endPoint}</div>
                            </td>
                            <td className="px-3 py-2.5">{typeBadge(route.routeType)}</td>
                            <td className="px-3 py-2.5 text-xs text-foreground/80">{route.estimatedTravelTime}m</td>
                            <td className="px-3 py-2.5 text-xs text-foreground/80">{route.estimatedDistance ?? "—"}km</td>
                            <td className="px-3 py-2.5">{loadBadge(route.passengerLoad)}</td>
                            <td className="px-3 py-2.5 text-right pr-4">
                              <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="size-7" onClick={() => setSelectedRouteId(route.routeId)}>
                                  <Eye className="size-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(route)}>
                                  <ArrowUpDown className="size-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(route._id, route.routeId)}>
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredRoutes.length === 0 && (
                      <div className="py-12 text-center text-sm text-muted-foreground">
                        {searchQuery || filterType !== "all" || filterLoad !== "all" || filterStatus !== "all"
                          ? "No routes match your filters."
                          : "No routes found. Click \"New Route\" to add one."}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <p className="text-[10px] text-muted-foreground text-right mt-2 pr-1">
                {filteredRoutes.length} route{filteredRoutes.length !== 1 ? "s" : ""} shown · Chennai, India
              </p>
            </div>
          </div>
        )}

        {/* Create / Edit Dialog */}
        <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(v) => { if (!v) { setShowCreateDialog(false); setShowEditDialog(false); } }}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{showEditDialog ? `Edit ${selected?.routeId ?? "Route"}` : "New Chennai Route"}</DialogTitle>
              <DialogDescription>
                {showEditDialog ? "Update route details" : drawnCoords.length > 0 ? `${drawnCoords.length} waypoints captured from map drawing` : "Add a new MTC bus route"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Route Number</Label>
                  <Input value={form.routeId} onChange={(e) => setForm({ ...form, routeId: e.target.value })} placeholder="21G" className="mt-1" disabled={showEditDialog} />
                </div>
                <div>
                  <Label className="text-xs">Route Type</Label>
                  <Select value={form.routeType} onValueChange={(v) => setForm({ ...form, routeType: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {routeTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Route Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tambaram – Broadway" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Origin</Label>
                  <Input value={form.startPoint} onChange={(e) => setForm({ ...form, startPoint: e.target.value })} placeholder="Tambaram" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Destination</Label>
                  <Input value={form.endPoint} onChange={(e) => setForm({ ...form, endPoint: e.target.value })} placeholder="Broadway" className="mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Major Stops (comma-separated)</Label>
                <Input value={form.stops} onChange={(e) => setForm({ ...form, stops: e.target.value })} placeholder="Chromepet, Pallavaram, Guindy, Saidapet" className="mt-1" />
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Time (min)</Label>
                  <Input type="number" value={form.estimatedTravelTime} onChange={(e) => setForm({ ...form, estimatedTravelTime: Number(e.target.value) })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Distance (km)</Label>
                  <Input type="number" value={form.estimatedDistance} onChange={(e) => setForm({ ...form, estimatedDistance: Number(e.target.value) })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Bus Count</Label>
                  <Input type="number" value={form.busCount} onChange={(e) => setForm({ ...form, busCount: Number(e.target.value) })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Load</Label>
                  <Select value={form.passengerLoad} onValueChange={(v) => setForm({ ...form, passengerLoad: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {loadLevels.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Opens</Label>
                  <Input type="time" value={form.operatingStart} onChange={(e) => setForm({ ...form, operatingStart: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Closes</Label>
                  <Input type="time" value={form.operatingEnd} onChange={(e) => setForm({ ...form, operatingEnd: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="proposed">Proposed</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={showEditDialog ? handleEdit : handleCreate} className="w-full">
                {showEditDialog ? "Save Changes" : "Create Route"}
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
    <div className="rounded-lg bg-muted/30 p-2.5">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function Th({ col, label, sortKey, sortDir, onToggle }: {
  col: SortKey; label: string; sortKey: SortKey; sortDir: "asc" | "desc"; onToggle: (col: SortKey) => void;
}) {
  return (
    <th
      className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground cursor-pointer hover:text-foreground select-none"
      onClick={() => onToggle(col)}
    >
      <span className="flex items-center gap-1">
        {label}
        <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </span>
    </th>
  );
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: "asc" | "desc" }) {
  if (sortKey !== col) return <ArrowUpDown className="size-3 opacity-30" />;
  return sortDir === "asc" ? <ArrowUp className="size-3 text-primary" /> : <ArrowDown className="size-3 text-primary" />;
}
