import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Search, Bus, Wrench, CheckCircle2, XCircle, Fuel, Gauge, ChevronLeft } from "lucide-react";

export default function BusManagement() {
  const buses = useQuery(api.buses.list);
  const updateBus = useMutation(api.buses.update);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);

  const selected = useMemo(() => {
    if (!buses || !selectedBusId) return null;
    return buses.find((b) => b.busId === selectedBusId) ?? null;
  }, [buses, selectedBusId]);

  const filtered = useMemo(() => {
    if (!buses) return [];
    let result = [...buses];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((b) =>
        b.busId.toLowerCase().includes(q) ||
        b.registrationNumber.toLowerCase().includes(q) ||
        b.routeId.toLowerCase().includes(q) ||
        b.origin.toLowerCase().includes(q) ||
        b.destination.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "all") result = result.filter((b) => b.currentStatus === filterStatus);
    return result;
  }, [buses, searchQuery, filterStatus]);

  const statusCfg: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    on_route: { icon: Bus, color: "text-primary", bg: "bg-primary/10", label: "On Route" },
    available: { icon: CheckCircle2, color: "text-accent", bg: "bg-accent/10", label: "Available" },
    maintenance: { icon: Wrench, color: "text-chart-4", bg: "bg-chart-4/10", label: "Maintenance" },
    off_duty: { icon: XCircle, color: "text-muted-foreground", bg: "bg-muted", label: "Off Duty" },
  };

  const fleetStats = useMemo(() => {
    if (!buses) return { total: 0, onRoute: 0, available: 0, maintenance: 0, offDuty: 0, utilization: 0 };
    const onRoute = buses.filter((b) => b.currentStatus === "on_route").length;
    const available = buses.filter((b) => b.currentStatus === "available").length;
    const maintenance = buses.filter((b) => b.currentStatus === "maintenance").length;
    const offDuty = buses.filter((b) => b.currentStatus === "off_duty").length;
    return { total: buses.length, onRoute, available, maintenance, offDuty, utilization: buses.length > 0 ? Math.round((onRoute / buses.length) * 100) : 0 };
  }, [buses]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Fleet Management</h1>
          <p className="text-sm text-muted-foreground">{buses ? `${buses.length} buses in Chennai MTC fleet` : "Loading..."}</p>
        </div>

        {/* TOTAL FLEET */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Bus className="size-4 text-primary" /> Total Fleet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-5">
              <StatCard label="Total Fleet" value={fleetStats.total} />
              <StatCard label="On Route" value={fleetStats.onRoute} color="text-primary" />
              <StatCard label="Available" value={fleetStats.available} color="text-accent" />
              <StatCard label="Maintenance" value={fleetStats.maintenance} color="text-chart-4" />
              <StatCard label="Off Duty" value={fleetStats.offDuty} color="text-muted-foreground" />
            </div>
            <div className="mt-4 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Fleet Utilization:</span>
                <span className="text-lg font-bold text-foreground">{fleetStats.utilization}%</span>
              </div>
              <div className="flex-1 h-2 overflow-hidden rounded-full bg-muted max-w-xs">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${fleetStats.utilization}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search & Filter */}
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input placeholder="Search bus ID, registration, route, origin..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="all">All Status</option>
                <option value="on_route">On Route</option>
                <option value="available">Available</option>
                <option value="maintenance">Maintenance</option>
                <option value="off_duty">Off Duty</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Detail View */}
        {selected && (
          <Card className="border-primary/20 bg-primary/[0.02]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => setSelectedBusId(null)}><ChevronLeft className="size-4" /></Button>
                  <div>
                    <CardTitle className="text-lg font-bold">{selected.busId}</CardTitle>
                    <p className="text-xs text-muted-foreground">{selected.registrationNumber} · {selected.origin} → {selected.destination}</p>
                  </div>
                </div>
                {(() => { const cfg = statusCfg[selected.currentStatus] || statusCfg.available; return <Badge className={`${cfg.bg} ${cfg.color} border-0`}>{cfg.label}</Badge>; })()}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DetailItem label="Registration" value={selected.registrationNumber} />
                <DetailItem label="Route" value={selected.routeId} />
                <DetailItem label="Bus Type" value={selected.busType} />
                <DetailItem label="Capacity" value={`${selected.capacity} seats`} />
                <DetailItem label="Driver" value={selected.assignedDriver ?? "Unassigned"} />
                <DetailItem label="Conductor" value={selected.assignedConductor ?? "Unassigned"} />
                <DetailItem label="Fuel Level" value={`${selected.fuelLevel}%`} />
                <DetailItem label="Mileage" value={selected.mileage ? `${selected.mileage.toLocaleString()} km` : "—"} />
                <DetailItem label="Operating Hours" value={selected.operatingHours ?? "—"} />
                <DetailItem label="Last Maintenance" value={selected.lastMaintenance ?? "—"} />
                <DetailItem label="Next Maintenance" value={selected.nextMaintenance ?? "—"} />
                <DetailItem label="Last Inspection" value={selected.lastInspection ?? "—"} />
              </div>
              {selected.notes && <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">{selected.notes}</div>}
            </CardContent>
          </Card>
        )}

        {/* Bus Cards */}
        {!selected && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((bus) => {
              const cfg = statusCfg[bus.currentStatus] || statusCfg.available;
              return (
                <Card key={bus._id} className="border-border/60 cursor-pointer transition-all hover:shadow-md hover:shadow-primary/[0.02]" onClick={() => setSelectedBusId(bus.busId)}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-foreground">{bus.busId}</span>
                          <Badge className={`text-[10px] ${cfg.bg} ${cfg.color} border-0`}>{cfg.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{bus.registrationNumber}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-foreground/80">
                        <span className="font-medium text-primary">{bus.routeId}</span>
                        <span className="text-muted-foreground">·</span>
                        <span>{bus.origin} → {bus.destination}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Fuel className="size-3" />{bus.fuelLevel}%</span>
                        <span className="flex items-center gap-1"><Gauge className="size-3" />{bus.mileage?.toLocaleString() ?? "—"} km</span>
                        <span>{bus.busType} · {bus.capacity} seats</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-muted/20 p-3 text-center">
      <div className={`text-2xl font-bold ${color || "text-foreground"}`}>{value}</div>
      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mt-1">{label}</div>
    </div>
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
