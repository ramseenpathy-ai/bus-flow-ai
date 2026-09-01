import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CalendarClock, Clock, Bus, Users, Search, ChevronLeft, Link2, Unlink, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function Scheduling() {
  const schedules = useQuery(api.logic.schedulesWithDetails);
  const updateLink = useMutation(api.logic.updateScheduleLink);
  const allCrew = useQuery(api.crew.list);
  const allBuses = useQuery(api.buses.list);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLink, setFilterLink] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editField, setEditField] = useState<string | null>(null);

  const selected = useMemo(() => {
    if (!schedules || !selectedId) return null;
    return schedules.find((s) => s._id === selectedId) ?? null;
  }, [schedules, selectedId]);

  const filtered = useMemo(() => {
    if (!schedules) return [];
    let result = [...schedules];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) =>
        s.scheduleId.toLowerCase().includes(q) || s.busId.toLowerCase().includes(q) ||
        s.routeId.toLowerCase().includes(q) || s.driverId.toLowerCase().includes(q) ||
        s.conductorId.toLowerCase().includes(q) || s.driverName.toLowerCase().includes(q) ||
        s.conductorName.toLowerCase().includes(q)
      );
    }
    if (filterLink !== "all") result = result.filter((s) => s.linkStatus === filterLink);
    return result;
  }, [schedules, searchQuery, filterLink]);

  const stats = useMemo(() => {
    if (!schedules) return { total: 0, linked: 0, partial: 0, unlinked: 0, onTime: 0, delayed: 0, restViolations: 0 };
    const linked = schedules.filter((s) => s.linkStatus === "linked").length;
    const partial = schedules.filter((s) => s.linkStatus === "partially_linked").length;
    const unlinked = schedules.filter((s) => s.linkStatus === "unlinked").length;
    const onTime = schedules.filter((s) => s.status === "on_time").length;
    const delayed = schedules.filter((s) => s.status === "delayed").length;
    const restViolations = schedules.filter((s) => s.driverRestCompliant === false || s.conductorRestCompliant === false).length;
    return { total: schedules.length, linked, partial, unlinked, onTime, delayed, restViolations };
  }, [schedules]);

  const handleLinkChange = async (scheduleId: string, field: string, value: string) => {
    try {
      await updateLink({
        scheduleId: scheduleId as any,
        [field]: value || undefined,
      });
      toast.success(`Schedule updated`);
      setEditField(null);
    } catch (e: any) {
      toast.error(e.message || "Update failed");
    }
  };

  const linkBadge = (status: string) => {
    if (status === "linked") return <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200 gap-1"><Link2 className="size-2.5" />LINKED</Badge>;
    if (status === "partially_linked") return <Badge className="text-[10px] bg-yellow-100 text-yellow-700 border-yellow-200 gap-1"><AlertTriangle className="size-2.5" />PARTIAL</Badge>;
    return <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200 gap-1"><Unlink className="size-2.5" />UNLINKED</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Schedules</h1>
          <p className="text-sm text-muted-foreground">Linked and unlinked duty assignments with rest period tracking</p>
        </div>

        {/* Stats */}
        <div className="grid gap-3 grid-cols-3 sm:grid-cols-6">
          <StatCard icon={CalendarClock} label="Total" value={stats.total} />
          <StatCard icon={Link2} label="Linked" value={stats.linked} color="text-green-600" />
          <StatCard icon={AlertTriangle} label="Partial" value={stats.partial} color="text-yellow-600" />
          <StatCard icon={Unlink} label="Unlinked" value={stats.unlinked} color="text-red-600" />
          <StatCard icon={Clock} label="Delayed" value={stats.delayed} color="text-chart-4" />
          <StatCard icon={XCircle} label="Rest Violations" value={stats.restViolations} color="text-destructive" />
        </div>

        {/* Search & Filter */}
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input placeholder="Search schedule, bus, route, driver..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              <select value={filterLink} onChange={(e) => setFilterLink(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="all">All Link Status</option>
                <option value="linked">Linked</option>
                <option value="partially_linked">Partially Linked</option>
                <option value="unlinked">Unlinked</option>
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
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => { setSelectedId(null); setEditField(null); }}><ChevronLeft className="size-4" /></Button>
                  <div>
                    <CardTitle className="text-lg font-bold">{selected.scheduleId}</CardTitle>
                    <p className="text-xs text-muted-foreground">Route {selected.routeId} · {selected.routeName}</p>
                  </div>
                </div>
                {linkBadge(selected.linkStatus)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DItem label="Route" value={`${selected.routeId} — ${selected.routeName}`} />
                <DItem label="Shift" value={selected.shift} />
                <DItem label="Start Time" value={selected.startTime} />
                <DItem label="End Time" value={selected.endTime} />
                <DItem label="Break" value={selected.breakTime} />
                <DItem label="Frequency" value={selected.departureFrequency} />
                <DItem label="Trips" value={`${selected.scheduledTrips}`} />
                <DItem label="Delay" value={selected.delayMinutes > 0 ? `${selected.delayMinutes} min` : "None"} />
              </div>

              {/* Linkage Editor */}
              <div className="rounded-xl border border-border/50 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Resource Assignment</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <LinkField label="Bus" value={selected.busId} field="busId" options={allBuses?.map((b) => ({ value: b.busId, label: `${b.busId} (${b.routeId})` })) ?? []} onChange={(v) => handleLinkChange(selected._id, "busId", v)} editField={editField} setEditField={setEditField} fieldKey="busId" />
                  <LinkField label="Route" value={selected.routeId} field="routeId" options={[]} onChange={(v) => handleLinkChange(selected._id, "routeId", v)} editField={editField} setEditField={setEditField} fieldKey="routeId" />
                  <LinkField label="Driver" value={selected.driverId} field="driverId" options={allCrew?.filter((c) => c.role === "Driver").map((c) => ({ value: c.crewId, label: `${c.crewId} — ${c.name}` })) ?? []} onChange={(v) => handleLinkChange(selected._id, "driverId", v)} editField={editField} setEditField={setEditField} fieldKey="driverId" />
                  <LinkField label="Conductor" value={selected.conductorId} field="conductorId" options={allCrew?.filter((c) => c.role === "Conductor").map((c) => ({ value: c.crewId, label: `${c.crewId} — ${c.name}` })) ?? []} onChange={(v) => handleLinkChange(selected._id, "conductorId", v)} editField={editField} setEditField={setEditField} fieldKey="conductorId" />
                </div>
              </div>

              {/* Rest Period */}
              <div className="rounded-xl border border-border/50 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Rest Period Compliance</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <RestInfo label="Driver" name={selected.driverName} restHours={selected.driverRestHours} compliant={selected.driverRestCompliant} required={selected.requiredRestHours} />
                  <RestInfo label="Conductor" name={selected.conductorName} restHours={selected.conductorRestHours} compliant={selected.conductorRestCompliant} required={selected.requiredRestHours} />
                </div>
              </div>

              {/* Conflicts */}
              {selected.conflictFlags.length > 0 && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/[0.02] p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-destructive flex items-center gap-2"><AlertTriangle className="size-4" />Conflicts</h3>
                  {selected.conflictFlags.map((flag, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-foreground/80">
                      <XCircle className="size-3 text-destructive shrink-0" /> {flag}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Schedule Table */}
        {!selected && (
          <Card className="border-border/60">
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                    <tr className="border-b border-border/50">
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">ID</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Route</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Bus</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Driver</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Conductor</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Time</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Shift</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Link</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Rest</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filtered.map((s) => (
                      <tr key={s._id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedId(s._id)}>
                        <td className="px-3 py-2.5 text-xs font-medium text-primary">{s.scheduleId}</td>
                        <td className="px-3 py-2.5 text-xs font-medium text-foreground">{s.routeId}</td>
                        <td className="px-3 py-2.5 text-xs text-foreground/80">{s.busId || <span className="text-red-500">—</span>}</td>
                        <td className="px-3 py-2.5 text-xs text-foreground/80">{s.driverId || <span className="text-red-500">—</span>}</td>
                        <td className="px-3 py-2.5 text-xs text-foreground/80">{s.conductorId || <span className="text-red-500">—</span>}</td>
                        <td className="px-3 py-2.5 text-xs text-foreground/80">{s.startTime} – {s.endTime}</td>
                        <td className="px-3 py-2.5"><Badge variant="secondary" className="text-[10px]">{s.shift}</Badge></td>
                        <td className="px-3 py-2.5">{linkBadge(s.linkStatus)}</td>
                        <td className="px-3 py-2.5">
                          {s.driverRestCompliant === false ? <Badge variant="destructive" className="text-[10px]">REST VIOLATION</Badge> :
                           s.driverRestCompliant === true ? <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200">OK</Badge> :
                           <span className="text-[10px] text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">No schedules found.</div>}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-muted/20 p-3 flex items-center gap-2.5">
      <Icon className={`size-4 ${color || "text-foreground"}`} />
      <div>
        <div className="text-lg font-bold text-foreground">{value}</div>
        <div className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
      </div>
    </div>
  );
}

function DItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/30 p-2.5">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function LinkField({ label, value, options, onChange, editField, setEditField, fieldKey }: {
  label: string; value: string; field: string; options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void; editField: string | null; setEditField: (f: string | null) => void; fieldKey: string;
}) {
  const isEditing = editField === fieldKey;
  return (
    <div className="rounded-lg bg-muted/30 p-2.5">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      {isEditing ? (
        <div className="flex gap-1.5">
          <select
            defaultValue={value}
            onChange={(e) => { onChange(e.target.value); setEditField(null); }}
            className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs"
          >
            <option value="">— None —</option>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => setEditField(null)}>Cancel</Button>
        </div>
      ) : (
        <button className="text-sm font-medium text-foreground hover:text-primary cursor-pointer text-left" onClick={() => setEditField(fieldKey)}>
          {value || <span className="text-red-500 italic">Not assigned — click to assign</span>}
        </button>
      )}
    </div>
  );
}

function RestInfo({ label, name, restHours, compliant, required }: {
  label: string; name: string; restHours: number | null; compliant: boolean | null; required: number;
}) {
  return (
    <div className="rounded-lg bg-muted/30 p-2.5">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      <div className="text-sm font-medium text-foreground">{name}</div>
      {restHours !== null ? (
        <div className="flex items-center gap-2 mt-1">
          {compliant ? (
            <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200 gap-1">
              <CheckCircle2 className="size-2.5" />REST COMPLIANT ({restHours}h ≥ {required}h)
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-[10px] gap-1">
              <XCircle className="size-2.5" />REST VIOLATION ({restHours}h &lt; {required}h)
            </Badge>
          )}
        </div>
      ) : (
        <div className="text-[10px] text-muted-foreground mt-1">No previous duty recorded</div>
      )}
    </div>
  );
}
