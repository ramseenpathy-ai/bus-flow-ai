import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardLayout } from "@/components/DashboardLayout";
import { NetworkMap } from "@/components/NetworkMap";
import { Plus, Search, Trash2, Eye, ChevronLeft, MapPin, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { toast } from "sonner";

type SortKey = "routeId" | "name" | "startPoint" | "endPoint" | "estimatedTravelTime" | "estimatedDistance";

export default function RouteManagement() {
  const routes = useQuery(api.routes.list);
  const overlapCheck = useQuery(api.logic.detectRouteOverlap, { coordinates: [] });
  const saveRoute = useMutation(api.logic.saveNewRoute);
  const deleteRoute = useMutation(api.routes.remove);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("routeId");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [showDrawDialog, setShowDrawDialog] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawnCoords, setDrawnCoords] = useState<Array<{ lat: number; lng: number }>>([]);

  const [form, setForm] = useState({
    routeId: "", name: "", startPoint: "", endPoint: "",
    stops: "", estimatedTravelTime: 30, estimatedDistance: 10,
    routeType: "Ordinary",
  });

  const selected = useMemo(() => {
    if (!routes || !selectedRouteId) return null;
    return routes.find((r) => r.routeId === selectedRouteId) ?? null;
  }, [routes, selectedRouteId]);

  const filtered = useMemo(() => {
    if (!routes) return [];
    let result = [...routes];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) =>
        r.routeId.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) ||
        r.startPoint.toLowerCase().includes(q) || r.endPoint.toLowerCase().includes(q) ||
        r.stops.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (filterType !== "all") result = result.filter((r) => r.routeType === filterType);
    result.sort((a, b) => {
      let av: any = a[sortKey] ?? ""; let bv: any = b[sortKey] ?? "";
      if (typeof av === "number") { if (av < bv) return sortDir === "asc" ? -1 : 1; if (av > bv) return sortDir === "asc" ? 1 : -1; return 0; }
      av = String(av).toLowerCase(); bv = String(bv).toLowerCase();
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return result;
  }, [routes, searchQuery, filterType, sortKey, sortDir]);

  // Overlap check for drawn route
  const [drawOverlaps, setDrawOverlaps] = useState<any[]>([]);
  const checkOverlap = useCallback((coords: Array<{ lat: number; lng: number }>) => {
    // Client-side approximate overlap check against existing routes
    if (!routes || coords.length < 2) { setDrawOverlaps([]); return; }
    const newBounds = getBounds(coords);
    const results: any[] = [];
    for (const route of routes) {
      if (route.coordinates.length < 2) continue;
      const existingBounds = getBounds(route.coordinates);
      if (newBounds.minLat <= existingBounds.maxLat && newBounds.maxLat >= existingBounds.minLat &&
          newBounds.minLng <= existingBounds.maxLng && newBounds.maxLng >= existingBounds.minLng) {
        const overlapArea = getOverlapArea(newBounds, existingBounds);
        const newArea = getArea(newBounds);
        const pct = newArea > 0 ? Math.round((overlapArea / newArea) * 100) : 0;
        if (pct > 5) {
          const severity = pct >= 60 ? "Critical" : pct >= 40 ? "High" : pct >= 20 ? "Medium" : "Low";
          results.push({ routeId: route.routeId, name: route.name, overlapPercentage: pct, severity });
        }
      }
    }
    setDrawOverlaps(results);
  }, [routes]);

  const handleDrawComplete = (coords: Array<{ lat: number; lng: number }>) => {
    setDrawnCoords(coords);
    setDrawingMode(false);
    checkOverlap(coords);
    setShowDrawDialog(true);
  };

  const handleSave = async () => {
    if (!form.routeId || !form.name) { toast.error("Route ID and name required"); return; }
    try {
      await saveRoute({
        routeId: form.routeId, name: form.name,
        startPoint: form.startPoint || "TBD", endPoint: form.endPoint || "TBD",
        stops: form.stops.split(",").map((s) => s.trim()).filter(Boolean),
        estimatedTravelTime: form.estimatedTravelTime,
        estimatedDistance: form.estimatedDistance,
        routeType: form.routeType,
        coordinates: drawnCoords,
      });
      toast.success(`Route ${form.routeId} saved`);
      setShowDrawDialog(false); setDrawnCoords([]); setDrawOverlaps([]);
      setForm({ routeId: "", name: "", startPoint: "", endPoint: "", stops: "", estimatedTravelTime: 30, estimatedDistance: 10, routeType: "Ordinary" });
    } catch (e: any) { toast.error(e.message || "Save failed"); }
  };

  const handleDelete = async (id: Id<"routes">, routeId: string) => {
    await deleteRoute({ id });
    toast.success(`Route ${routeId} deleted`);
    if (selectedRouteId === routeId) setSelectedRouteId(null);
  };

  const toggleSort = (key: SortKey) => { if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc"); else { setSortKey(key); setSortDir("asc"); } };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Chennai MTC Routes</h1>
            <p className="text-sm text-muted-foreground">{routes ? `${routes.length} routes` : "Loading..."} · Search, draw, and manage routes</p>
          </div>
          <div className="flex gap-2">
            <Button variant={drawingMode ? "destructive" : "outline"} size="sm" onClick={() => { setDrawingMode(!drawingMode); setDrawnCoords([]); }} className="gap-1.5">
              <MapPin className="size-3.5" />{drawingMode ? "Stop Drawing" : "Draw Route"}
            </Button>
          </div>
        </div>

        {drawingMode && (
          <Card className="border-primary/20 bg-primary/[0.02]">
            <CardContent className="p-3 text-xs text-primary font-medium flex items-center gap-2">
              <MapPin className="size-3.5" /> Click on the map to place route points. Double-click to finish. ({drawnCoords.length} points placed)
            </CardContent>
          </Card>
        )}

        {/* Detail View */}
        {selected && (
          <Card className="border-primary/20 bg-primary/[0.02]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => setSelectedRouteId(null)}><ChevronLeft className="size-4" /></Button>
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2"><span className="text-primary">{selected.routeId}</span>{selected.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{selected.startPoint} → {selected.endPoint} · {selected.estimatedDistance ?? "—"} km · {selected.estimatedTravelTime} min</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(selected._id, selected.routeId)} className="gap-1"><Trash2 className="size-3" />Delete</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DItem label="Route Type" value={selected.routeType ?? "—"} />
                <DItem label="Status" value={selected.status} />
                <DItem label="Distance" value={`${selected.estimatedDistance ?? "—"} km`} />
                <DItem label="Travel Time" value={`${selected.estimatedTravelTime} min`} />
                <DItem label="Passenger Load" value={selected.passengerLoad ?? "—"} />
                <DItem label="Bus Count" value={`${selected.busCount ?? 0}`} />
                <DItem label="Operating Hours" value={`${selected.operatingHours.start} – ${selected.operatingHours.end}`} />
                <DItem label="Stops" value={`${selected.stops.length} stops`} />
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
                <NetworkMap routes={[{ routeId: selected.routeId, name: selected.name, coordinates: selected.coordinates, status: selected.status, stops: selected.stops }]} focusRouteId={selected.routeId} height="320px" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        {!selected && (
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" /><Input placeholder="Search route number, name, origin, destination..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" /></div>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <option value="all">All Types</option>
                  <option value="Ordinary">Ordinary</option>
                  <option value="Express">Express</option>
                  <option value="Deluxe">Deluxe</option>
                  <option value="M-Series">M-Series</option>
                  <option value="M-Series / Express">M-Series / Express</option>
                </select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Map + Table */}
        {!selected && (
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Card className="border-border/60">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Chennai Network Map</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <NetworkMap routes={filtered.map((r) => ({ routeId: r.routeId, name: r.name, coordinates: r.coordinates, status: r.status, stops: r.stops }))} onRouteClick={setSelectedRouteId} drawingMode={drawingMode} onDrawComplete={handleDrawComplete} height="500px" focusRouteId={selectedRouteId ?? undefined} />
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-3">
              <Card className="border-border/60">
                <CardContent className="p-0">
                  <div className="max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                        <tr className="border-b border-border/50">
                          {(["routeId", "name", "estimatedTravelTime", "estimatedDistance"] as SortKey[]).map((col) => (
                            <th key={col} className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort(col)}>
                              {col === "routeId" ? "Route" : col === "name" ? "Origin → Dest" : col === "estimatedTravelTime" ? "Time" : "Dist"}
                              {sortKey === col && (sortDir === "asc" ? " ↑" : " ↓")}
                            </th>
                          ))}
                          <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Type</th>
                          <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase text-muted-foreground pr-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {filtered.map((route) => (
                          <tr key={route._id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedRouteId(route.routeId)}>
                            <td className="px-3 py-2.5"><span className="font-bold text-primary">{route.routeId}</span></td>
                            <td className="px-3 py-2.5"><div className="text-xs font-medium text-foreground">{route.startPoint}</div><div className="text-[10px] text-muted-foreground">→ {route.endPoint}</div></td>
                            <td className="px-3 py-2.5 text-xs text-foreground/80">{route.estimatedTravelTime}m</td>
                            <td className="px-3 py-2.5 text-xs text-foreground/80">{route.estimatedDistance ?? "—"}km</td>
                            <td className="px-3 py-2.5"><Badge variant="secondary" className="text-[10px]">{route.routeType ?? "—"}</Badge></td>
                            <td className="px-3 py-2.5 text-right pr-4">
                              <Button variant="ghost" size="icon" className="size-7" onClick={(e) => { e.stopPropagation(); setSelectedRouteId(route.routeId); }}><Eye className="size-3.5" /></Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filtered.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">No routes found.</div>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Draw Route Dialog */}
        <Dialog open={showDrawDialog} onOpenChange={(v) => { if (!v) { setShowDrawDialog(false); setDrawOverlaps([]); } }}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Route — {drawnCoords.length} points</DialogTitle>
              <DialogDescription>Define route details and review network analysis</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Network Analysis */}
              {drawOverlaps.length > 0 && (
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-yellow-800"><AlertTriangle className="size-4" /> Network Analysis</div>
                  {drawOverlaps.map((o, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-yellow-700">
                      <Badge variant={o.severity === "Critical" ? "destructive" : "default"} className="text-[10px]">{o.severity}</Badge>
                      <span>Route {o.routeId} ({o.name}) — {o.overlapPercentage}% overlap</span>
                    </div>
                  ))}
                </div>
              )}
              {drawnCoords.length > 0 && drawOverlaps.length === 0 && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-3 flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle2 className="size-4" /> No significant network conflict detected
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Route Number</Label><Input value={form.routeId} onChange={(e) => setForm({ ...form, routeId: e.target.value })} placeholder="N-01" className="mt-1" /></div>
                <div><Label className="text-xs">Route Type</Label><Select value={form.routeType} onValueChange={(v) => setForm({ ...form, routeType: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Ordinary">Ordinary</SelectItem><SelectItem value="Express">Express</SelectItem><SelectItem value="Deluxe">Deluxe</SelectItem><SelectItem value="M-Series">M-Series</SelectItem></SelectContent></Select></div>
              </div>
              <div><Label className="text-xs">Route Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="New Route Name" className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Origin</Label><Input value={form.startPoint} onChange={(e) => setForm({ ...form, startPoint: e.target.value })} placeholder="Origin" className="mt-1" /></div>
                <div><Label className="text-xs">Destination</Label><Input value={form.endPoint} onChange={(e) => setForm({ ...form, endPoint: e.target.value })} placeholder="Destination" className="mt-1" /></div>
              </div>
              <div><Label className="text-xs">Major Stops (comma-separated)</Label><Input value={form.stops} onChange={(e) => setForm({ ...form, stops: e.target.value })} placeholder="Stop 1, Stop 2, Stop 3" className="mt-1" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Time (min)</Label><Input type="number" value={form.estimatedTravelTime} onChange={(e) => setForm({ ...form, estimatedTravelTime: Number(e.target.value) })} className="mt-1" /></div>
                <div><Label className="text-xs">Distance (km)</Label><Input type="number" value={form.estimatedDistance} onChange={(e) => setForm({ ...form, estimatedDistance: Number(e.target.value) })} className="mt-1" /></div>
                <div><Label className="text-xs">Points</Label><div className="mt-1 text-sm font-medium text-foreground py-2">{drawnCoords.length}</div></div>
              </div>
              <Button onClick={handleSave} className="w-full">Save Route</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function DItem({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-muted/30 p-2.5"><div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-0.5 text-sm font-medium text-foreground">{value}</div></div>;
}

function getBounds(coords: Array<{ lat: number; lng: number }>) {
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const c of coords) { if (c.lat < minLat) minLat = c.lat; if (c.lat > maxLat) maxLat = c.lat; if (c.lng < minLng) minLng = c.lng; if (c.lng > maxLng) maxLng = c.lng; }
  return { minLat, maxLat, minLng, maxLng };
}
function getOverlapArea(a: any, b: any) { return Math.max(0, Math.min(a.maxLat, b.maxLat) - Math.max(a.minLat, b.minLat)) * Math.max(0, Math.min(a.maxLng, b.maxLng) - Math.max(a.minLng, b.minLng)); }
function getArea(b: any) { return (b.maxLat - b.minLat) * (b.maxLng - b.minLng); }
