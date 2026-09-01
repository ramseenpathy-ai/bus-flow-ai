import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ShieldAlert, AlertTriangle, Search, AlertCircle, Info } from "lucide-react";

export default function Conflicts() {
  // Fetch all data
  const schedules = useQuery(api.scheduling.list);
  const buses = useQuery(api.buses.list);
  const crew = useQuery(api.crew.list);
  const routes = useQuery(api.routes.list);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Build conflicts from schedule + bus data relationships
  const conflicts = useMemo(() => {
    if (!schedules || !buses || !crew || !routes) return [];
    const result: any[] = [];

    // Schedule conflicts
    for (const s of schedules) {
      const bus = buses.find((b) => b.busId === s.busId);
      if (!bus) continue;

      // Maintenance bus with active schedule
      if (bus.currentStatus === "maintenance") {
        result.push({
          id: `SC-${s.scheduleId}`, category: "schedule", type: "Maintenance Conflict", severity: "High",
          busId: s.busId, routeId: s.routeId, crewMember: `${s.driverId} / ${s.conductorId}`,
          scheduleId: s.scheduleId, location: `${bus.origin} depot`, detectedTime: s.startTime,
          description: `${s.busId} is under Maintenance but has an active schedule on Route ${s.routeId}.`,
          impact: "Scheduled trip cannot operate safely.", recommendedAction: "Cancel schedule or reassign bus.", status: "Open",
        });
      }

      // Off-duty bus with active schedule
      if (bus.currentStatus === "off_duty") {
        result.push({
          id: `SC-${s.scheduleId}-OD`, category: "schedule", type: "Off-Duty Conflict", severity: "High",
          busId: s.busId, routeId: s.routeId, crewMember: s.driverId,
          scheduleId: s.scheduleId, location: `${bus.origin} depot`, detectedTime: s.startTime,
          description: `${s.busId} is Off Duty but assigned to Route ${s.routeId} schedule.`,
          impact: "Route service disruption.", recommendedAction: "Reassign bus or change status.", status: "Open",
        });
      }

      // Delay propagation
      if (s.delayMinutes > 10) {
        result.push({
          id: `SC-${s.scheduleId}-DL`, category: "schedule", type: "Delay Propagation", severity: "Medium",
          busId: s.busId, routeId: s.routeId, crewMember: s.driverId,
          scheduleId: s.scheduleId, location: `Route ${s.routeId}`, detectedTime: s.startTime,
          description: `${s.busId} (Route ${s.routeId}) has ${s.delayMinutes}-minute delay. Subsequent trips will cascade.`,
          impact: "Estimated cumulative delay.", recommendedAction: "Notify control room; adjust departures.", status: "Open",
        });
      }

      // Low fuel on long route
      if (bus.fuelLevel < 50 && bus.mileage && bus.mileage > 150000) {
        result.push({
          id: `SC-${s.scheduleId}-FL`, category: "operational", type: "Low Fuel on High-Mileage Bus", severity: "Medium",
          busId: s.busId, routeId: s.routeId, crewMember: s.driverId,
          scheduleId: s.scheduleId, location: `${bus.origin} depot`, detectedTime: s.startTime,
          description: `${s.busId} fuel at ${bus.fuelLevel}% with ${bus.mileage?.toLocaleString()} km mileage. Risk of breakdown.`,
          impact: "Bus may require mid-route refuelling.", recommendedAction: "Refuel before departure.", status: "Open",
        });
      }

      // Insufficient turnaround (bus finishes and starts same time)
      // Simplified: if schedule is 9h+ that's fine, but flag if notes mention turnaround
      if (s.breakTime && s.breakTime.includes("–")) {
        const breakParts = s.breakTime.split("–");
        const breakMinutes = (parseInt(breakParts[1]?.split(":")[0] ?? "0") - parseInt(breakParts[0]?.split(":")[0] ?? "0")) * 60 +
          (parseInt(breakParts[1]?.split(":")[1] ?? "0") - parseInt(breakParts[0]?.split(":")[1] ?? "0"));
        if (breakMinutes < 20) {
          result.push({
            id: `SC-${s.scheduleId}-TR`, category: "schedule", type: "Insufficient Turnaround Time", severity: "Medium",
            busId: s.busId, routeId: s.routeId, crewMember: s.driverId,
            scheduleId: s.scheduleId, location: `Route ${s.routeId}`, detectedTime: s.startTime,
            description: `${s.busId} has only ${breakMinutes}-minute break between trips on Route ${s.routeId}.`,
            impact: "Driver fatigue; delayed departures.", recommendedAction: "Extend break to 30+ minutes.", status: "Under Review",
          });
        }
      }
    }

    // Bus-only conflicts (no crew assignment)
    for (const bus of buses) {
      if (bus.currentStatus === "on_route" && !bus.assignedDriver) {
        result.push({
          id: `OC-${bus.busId}-NC`, category: "operational", type: "No Assigned Crew", severity: "Critical",
          busId: bus.busId, routeId: bus.routeId, crewMember: undefined,
          scheduleId: undefined, location: `${bus.origin} depot`, detectedTime: "06:00",
          description: `${bus.busId} is On Route but has no assigned driver.`,
          impact: "Service may not operate.", recommendedAction: "Assign substitute driver.", status: "Open",
        });
      }

      // Low fuel
      if (bus.fuelLevel < 30) {
        result.push({
          id: `OC-${bus.busId}-LF`, category: "operational", type: "Critical Low Fuel", severity: "Critical",
          busId: bus.busId, routeId: bus.routeId, crewMember: undefined,
          scheduleId: undefined, location: `${bus.origin} depot`, detectedTime: "06:00",
          description: `${bus.busId} fuel critically low at ${bus.fuelLevel}%. Cannot complete full route.`,
          impact: "Bus will run out of fuel mid-route.", recommendedAction: "Refuel immediately before departure.", status: "Open",
        });
      }

      // Exceeded mileage threshold
      if (bus.mileage && bus.mileage > 200000) {
        result.push({
          id: `OC-${bus.busId}-MG`, category: "operational", type: "Exceeded Mileage Threshold", severity: "Low",
          busId: bus.busId, routeId: bus.routeId, crewMember: undefined,
          scheduleId: undefined, location: `${bus.origin} depot`, detectedTime: "06:00",
          description: `${bus.busId} has exceeded 200,000 km. Major service recommended.`,
          impact: "Increased breakdown risk.", recommendedAction: "Schedule major maintenance.", status: "Under Review",
        });
      }
    }

    // Crew conflicts: assigned to off-duty bus
    for (const c of crew) {
      if (c.assignedBus) {
        const bus = buses.find((b) => b.busId === c.assignedBus);
        if (bus && bus.currentStatus === "off_duty" && c.dutyStatus === "on_duty") {
          result.push({
            id: `OC-${c.crewId}-CB`, category: "operational", type: "Crew on Off-Duty Bus", severity: "Medium",
            busId: c.assignedBus, routeId: c.assignedRoute ?? undefined, crewMember: c.crewId,
            scheduleId: undefined, location: `${bus.origin}`, detectedTime: "06:00",
            description: `${c.name} (${c.crewId}) is on duty but assigned to ${c.assignedBus} which is Off Duty.`,
            impact: "Crew wasting shift; bus not operational.", recommendedAction: "Reassign crew or change bus status.", status: "Open",
        });
        }
      }
    }

    return result;
  }, [schedules, buses, crew, routes]);

  const filtered = useMemo(() => {
    let result = [...conflicts];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) =>
        c.busId?.toLowerCase().includes(q) || c.routeId?.toLowerCase().includes(q) ||
        c.crewMember?.toLowerCase().includes(q) || c.type.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }
    if (filterSeverity !== "all") result = result.filter((c) => c.severity === filterSeverity);
    if (filterCategory !== "all") result = result.filter((c) => c.category === filterCategory);
    if (filterStatus !== "all") result = result.filter((c) => c.status === filterStatus);
    return result;
  }, [conflicts, searchQuery, filterSeverity, filterCategory, filterStatus]);

  const summary = useMemo(() => {
    const total = conflicts.length;
    const critical = conflicts.filter((c) => c.severity === "Critical").length;
    const high = conflicts.filter((c) => c.severity === "High").length;
    const medium = conflicts.filter((c) => c.severity === "Medium").length;
    const low = conflicts.filter((c) => c.severity === "Low").length;
    const open = conflicts.filter((c) => c.status === "Open").length;
    const underReview = conflicts.filter((c) => c.status === "Under Review").length;
    const resolved = conflicts.filter((c) => c.status === "Resolved").length;
    const scheduleConflicts = conflicts.filter((c) => c.category === "schedule").length;
    const operationalConflicts = conflicts.filter((c) => c.category === "operational").length;
    return { total, critical, high, medium, low, open, underReview, resolved, scheduleConflicts, operationalConflicts };
  }, [conflicts]);

  const sevBadge = (s: string) => {
    if (s === "Critical") return <Badge variant="destructive" className="text-[10px]">Critical</Badge>;
    if (s === "High") return <Badge className="text-[10px] bg-orange-100 text-orange-700 border-orange-200">High</Badge>;
    if (s === "Medium") return <Badge className="text-[10px] bg-yellow-100 text-yellow-700 border-yellow-200">Medium</Badge>;
    return <Badge variant="secondary" className="text-[10px]">Low</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Schedule Conflicts</h1>
          <p className="text-sm text-muted-foreground">Detected scheduling and operational conflicts across 20 routes</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-3 grid-cols-4 sm:grid-cols-8">
          <SumCard label="Total" value={summary.total} />
          <SumCard label="Critical" value={summary.critical} color="text-destructive" />
          <SumCard label="High" value={summary.high} color="text-orange-600" />
          <SumCard label="Medium" value={summary.medium} color="text-yellow-600" />
          <SumCard label="Low" value={summary.low} color="text-muted-foreground" />
          <SumCard label="Open" value={summary.open} color="text-primary" />
          <SumCard label="Under Review" value={summary.underReview} color="text-chart-4" />
          <SumCard label="Resolved" value={summary.resolved} color="text-accent" />
        </div>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <SumCard label="Schedule Conflicts" value={summary.scheduleConflicts} color="text-primary" />
          <SumCard label="Bus Conflicts" value={summary.operationalConflicts} color="text-accent" />
          <SumCard label="Crew Conflicts" value={conflicts.filter((c) => c.crewMember).length} color="text-chart-3" />
          <SumCard label="Maintenance Conflicts" value={conflicts.filter((c) => c.type.toLowerCase().includes("maintenance")).length} color="text-chart-4" />
        </div>

        {/* Filters */}
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input placeholder="Search conflicts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="all">All Severity</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="all">All Types</option>
                <option value="schedule">Schedule</option>
                <option value="operational">Operational</option>
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="all">All Status</option>
                <option value="Open">Open</option>
                <option value="Under Review">Under Review</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Conflicts List */}
        <div className="space-y-3">
          {filtered.map((c) => (
            <Card key={c.id} className={`border-border/60 ${c.severity === "Critical" ? "border-destructive/20 bg-destructive/[0.01]" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                    c.severity === "Critical" ? "bg-destructive/10" : c.severity === "High" ? "bg-orange-50" : c.severity === "Medium" ? "bg-yellow-50" : "bg-muted"
                  }`}>
                    {c.severity === "Critical" ? <AlertCircle className="size-4 text-destructive" /> :
                     c.severity === "High" ? <AlertTriangle className="size-4 text-orange-600" /> :
                     <Info className="size-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-foreground/80">{c.id}</span>
                      {sevBadge(c.severity)}
                      <Badge variant="outline" className="text-[10px]">{c.type}</Badge>
                      <Badge variant={c.status === "Open" ? "destructive" : c.status === "Under Review" ? "default" : "secondary"} className="text-[10px]">{c.status}</Badge>
                    </div>
                    <p className="text-sm text-foreground font-medium leading-relaxed">{c.description}</p>
                    <div className="mt-2 flex flex-wrap gap-4 text-[10px] text-muted-foreground">
                      {c.busId && <span>Bus: <strong className="text-foreground/70">{c.busId}</strong></span>}
                      {c.routeId && <span>Route: <strong className="text-foreground/70">{c.routeId}</strong></span>}
                      {c.crewMember && <span>Crew: <strong className="text-foreground/70">{c.crewMember}</strong></span>}
                      {c.location && <span>Location: {c.location}</span>}
                    </div>
                    {c.recommendedAction && (
                      <div className="mt-2 rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground">
                        <strong className="text-foreground/70">Action:</strong> {c.recommendedAction}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <Card className="border-border/60"><CardContent className="py-12 text-center text-sm text-muted-foreground">No conflicts found.</CardContent></Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function SumCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-muted/20 p-2.5 text-center">
      <div className={`text-xl font-bold ${color || "text-foreground"}`}>{value}</div>
      <div className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}
