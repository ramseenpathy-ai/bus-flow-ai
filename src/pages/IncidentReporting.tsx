import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AlertTriangle, AlertCircle, Search, ChevronLeft, Plus, CheckCircle2, Clock, User, Phone, Activity } from "lucide-react";
import { toast } from "sonner";

const INCIDENT_TYPES = ["DRIVER MEDICAL EMERGENCY", "PASSENGER MEDICAL EMERGENCY", "TIRE PUNCTURE", "BUS BREAKDOWN", "ENGINE FAILURE", "ACCIDENT", "COLLISION", "FIRE/SMOKE", "VEHICLE DAMAGE", "TRAFFIC OBSTRUCTION", "ROAD HAZARD", "PASSENGER DISTURBANCE", "SECURITY ISSUE", "OTHER"];
const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const STATUSES = ["NEW", "ACKNOWLEDGED", "UNDER RESPONSE", "RESOLVED", "CLOSED"];

export default function IncidentReporting() {
  const incidents = useQuery(api.incidents.list);
  const incStats = useQuery(api.incidents.stats);
  const routes = useQuery(api.routes.list);
  const buses = useQuery(api.buses.list);
  const crew = useQuery(api.crew.list);
  const schedules = useQuery(api.logic.schedulesWithDetails);
  const createIncident = useMutation(api.incidents.create);
  const updateIncidentStatus = useMutation(api.incidents.updateStatus);
  const findCrew = useMutation(api.logic.updateScheduleLink);
  const seedDemos = useMutation(api.incidents.seedDemos);

  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showCriticalDialog, setShowCriticalDialog] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [reporterType, setReporterType] = useState("DRIVER");

  const [form, setForm] = useState({
    incidentType: "BUS BREAKDOWN", severity: "HIGH", busId: "", routeId: "", location: "", description: "", reporterType: "DRIVER", reporterId: "",
  });

  const filtered = useMemo(() => {
    if (!incidents) return [];
    let result = [...incidents];
    if (filterSeverity !== "all") result = result.filter((i) => i.severity === filterSeverity);
    if (filterStatus !== "all") result = result.filter((i) => i.status === filterStatus);
    return result;
  }, [incidents, filterSeverity, filterStatus]);

  const handleReport = async (severity?: string) => {
    if (!form.busId || !form.description) { toast.error("Bus and description required"); return; }
    const bus = buses?.find((b) => b.busId === form.busId);
    const id = `INC-${String(Date.now()).slice(-6)}`;
    try {
      await createIncident({
        incidentId: id, incidentType: form.incidentType, severity: severity || form.severity,
        reporterType: form.reporterType, reporterId: form.reporterId || undefined,
        busId: form.busId, routeId: bus?.routeId ?? form.routeId,
        driverId: bus?.assignedDriver, location: form.location || bus?.currentLocation || "Unknown",
        description: form.description,
      });
      toast.success(`Incident ${id} reported`);
      setShowReportDialog(false);
      setShowCriticalDialog(false);
      setForm({ incidentType: "BUS BREAKDOWN", severity: "HIGH", busId: "", routeId: "", location: "", description: "", reporterType: "DRIVER", reporterId: "" });
    } catch (e: any) { toast.error(e.message); }
  };

  const handleStatus = async (id: string, status: string, resolution?: string) => {
    await updateIncidentStatus({ incidentId: id as any, status, resolution });
    toast.success(`Incident ${status.toLowerCase()}`);
    if (showDetail && showDetail._id === id) {
      setShowDetail({ ...showDetail, status, resolution });
    }
  };

  const timeline = (inc: any) => {
    const steps = [
      { label: "INCIDENT REPORTED", time: inc.reportedTime, done: true },
      { label: "CONTROL ROOM NOTIFIED", time: inc.reportedTime, done: true },
      { label: "OPERATOR ACKNOWLEDGED", time: inc.acknowledgedTime, done: !!inc.acknowledgedTime },
      { label: "RESPONSE INITIATED", time: inc.responseInitiatedTime, done: !!inc.responseInitiatedTime },
      { label: "INCIDENT RESOLVED", time: inc.resolutionTime, done: !!inc.resolutionTime },
      { label: "INCIDENT CLOSED", time: inc.closedTime, done: !!inc.closedTime },
    ];
    return steps;
  };

  const sevBadge = (s: string) => {
    if (s === "CRITICAL") return <Badge variant="destructive" className="text-[10px] gap-1"><AlertCircle className="size-2.5" />CRITICAL</Badge>;
    if (s === "HIGH") return <Badge className="text-[10px] bg-orange-100 text-orange-700 border-orange-200 gap-1"><AlertTriangle className="size-2.5" />HIGH</Badge>;
    if (s === "MEDIUM") return <Badge className="text-[10px] bg-yellow-100 text-yellow-700 border-yellow-200">MEDIUM</Badge>;
    return <Badge variant="secondary" className="text-[10px]">LOW</Badge>;
  };

  const statusBadge = (s: string) => {
    if (s === "NEW") return <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200">NEW</Badge>;
    if (s === "ACKNOWLEDGED") return <Badge className="text-[10px] bg-blue-100 text-blue-700 border-blue-200">ACKNOWLEDGED</Badge>;
    if (s === "UNDER RESPONSE") return <Badge className="text-[10px] bg-yellow-100 text-yellow-700 border-yellow-200">UNDER RESPONSE</Badge>;
    if (s === "RESOLVED") return <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200">RESOLVED</Badge>;
    if (s === "CLOSED") return <Badge variant="secondary" className="text-[10px]">CLOSED</Badge>;
    return <Badge variant="secondary" className="text-[10px]">{s}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Incident Reporting</h1>
            <p className="text-sm text-muted-foreground">Real-time incident tracking and response management</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={async () => { const r = await seedDemos(); toast.success(String(r)); }} className="gap-1.5"><Activity className="size-3.5" />Seed Demos</Button>
            <Button variant="destructive" size="sm" onClick={() => setShowCriticalDialog(true)} className="gap-1.5"><AlertCircle className="size-3.5" />Critical Report</Button>
            <Button size="sm" onClick={() => { setReporterType("DRIVER"); setShowReportDialog(true); }} className="gap-1.5"><Plus className="size-3.5" />Report Incident</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-3 grid-cols-4 sm:grid-cols-7">
          <SumCard label="Total" value={incStats?.total ?? 0} />
          <SumCard label="New" value={incStats?.newIncidents ?? 0} color="text-red-600" />
          <SumCard label="Critical" value={incStats?.critical ?? 0} color="text-destructive" />
          <SumCard label="High" value={incStats?.high ?? 0} color="text-orange-600" />
          <SumCard label="Under Response" value={incStats?.underResponse ?? 0} color="text-yellow-600" />
          <SumCard label="Resolved" value={incStats?.resolved ?? 0} color="text-green-600" />
          <SumCard label="Buses in Distress" value={incStats?.busesInDistress ?? 0} color="text-primary" />
        </div>

        {/* Filters */}
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="all">All Severity</option>{SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="all">All Status</option>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
            </div>
          </CardContent>
        </Card>

        {/* Detail View */}
        {showDetail && (
          <Card className={`border-2 ${showDetail.severity === "CRITICAL" ? "border-destructive/30" : "border-primary/20 bg-primary/[0.02]"}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => setShowDetail(null)}><ChevronLeft className="size-4" /></Button>
                  <div>
                    <CardTitle className="text-lg font-bold">{showDetail.incidentId}</CardTitle>
                    <p className="text-xs text-muted-foreground">{showDetail.incidentType} · {showDetail.busId} · Route {showDetail.routeId}</p>
                  </div>
                </div>
                <div className="flex gap-2">{sevBadge(showDetail.severity)}{statusBadge(showDetail.status)}</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DItem label="Reported" value={new Date(showDetail.reportedTime).toLocaleString()} />
                <DItem label="Reporter" value={showDetail.reporterType} />
                <DItem label="Bus" value={showDetail.busId} />
                <DItem label="Route" value={`${showDetail.routeId} — ${showDetail.routeName ?? ""}`} />
                <DItem label="Driver" value={showDetail.driverName ?? showDetail.driverId ?? "—"} />
                <DItem label="Location" value={showDetail.location} />
                <DItem label="Operator" value={showDetail.assignedOperator ?? "—"} />
                <DItem label="Resolution" value={showDetail.resolution ?? "—"} />
              </div>
              <div className="rounded-lg bg-muted/40 p-3 text-sm text-foreground/80">{showDetail.description}</div>

              {/* Timeline */}
              <div className="rounded-xl border border-border/50 p-4">
                <h3 className="text-sm font-semibold mb-3">Incident Timeline</h3>
                <div className="space-y-2">
                  {timeline(showDetail).map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`flex size-6 shrink-0 items-center justify-center rounded-full ${step.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {step.done ? <CheckCircle2 className="size-3" /> : <span className="text-[8px]">{i + 1}</span>}
                      </div>
                      <div className="flex-1">
                        <span className={`text-xs font-medium ${step.done ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</span>
                        {step.time && <span className="text-[10px] text-muted-foreground ml-2">{new Date(step.time).toLocaleString()}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {showDetail.status === "NEW" && <Button size="sm" onClick={() => handleStatus(showDetail._id, "ACKNOWLEDGED")} className="gap-1"><CheckCircle2 className="size-3" />Acknowledge</Button>}
                {showDetail.status === "ACKNOWLEDGED" && <Button size="sm" onClick={() => handleStatus(showDetail._id, "UNDER RESPONSE")} className="gap-1"><Phone className="size-3" />Initiate Response</Button>}
                {showDetail.status === "UNDER RESPONSE" && <Button size="sm" onClick={() => handleStatus(showDetail._id, "RESOLVED", "Incident resolved by operator")} className="gap-1"><CheckCircle2 className="size-3" />Resolve</Button>}
                {showDetail.status === "RESOLVED" && <Button size="sm" onClick={() => handleStatus(showDetail._id, "CLOSED")} className="gap-1"><CheckCircle2 className="size-3" />Close</Button>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Incident Queue */}
        {!showDetail && (
          <Card className="border-border/60">
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                    <tr className="border-b border-border/50">
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">ID</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Time</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Bus</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Route</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Reporter</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Type</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Location</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Severity</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filtered.map((inc) => (
                      <tr key={inc._id} className={`cursor-pointer hover:bg-muted/30 transition-colors ${inc.severity === "CRITICAL" && inc.status === "NEW" ? "bg-destructive/[0.02]" : ""}`} onClick={() => setShowDetail(inc)}>
                        <td className="px-3 py-2.5 text-xs font-medium text-primary">{inc.incidentId}</td>
                        <td className="px-3 py-2.5 text-xs text-foreground/80">{new Date(inc.reportedTime).toLocaleTimeString()}</td>
                        <td className="px-3 py-2.5 text-xs font-medium text-foreground">{inc.busId}</td>
                        <td className="px-3 py-2.5 text-xs text-foreground/80">{inc.routeId}</td>
                        <td className="px-3 py-2.5"><Badge variant="outline" className="text-[10px]">{inc.reporterType}</Badge></td>
                        <td className="px-3 py-2.5 text-xs text-foreground/80">{inc.incidentType}</td>
                        <td className="px-3 py-2.5 text-xs text-foreground/80 max-w-[150px] truncate">{inc.location}</td>
                        <td className="px-3 py-2.5">{sevBadge(inc.severity)}</td>
                        <td className="px-3 py-2.5">{statusBadge(inc.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">No incidents. Click "Report Incident" or "Seed Demos" to get started.</div>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Dialog */}
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Report Incident</DialogTitle>
              <DialogDescription>Submit an incident report to the control room</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Reporter Type</Label><Select value={form.reporterType} onValueChange={(v) => setForm({ ...form, reporterType: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="DRIVER">Driver</SelectItem><SelectItem value="PASSENGER">Passenger</SelectItem><SelectItem value="CONTROL ROOM">Control Room</SelectItem></SelectContent></Select></div>
                <div><Label className="text-xs">Severity</Label><Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Incident Type</Label><Select value={form.incidentType} onValueChange={(v) => setForm({ ...form, incidentType: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{INCIDENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs">Bus</Label><Select value={form.busId} onValueChange={(v) => setForm({ ...form, busId: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select bus" /></SelectTrigger><SelectContent>{buses?.map((b) => <SelectItem key={b.busId} value={b.busId}>{b.busId} ({b.routeId})</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div><Label className="text-xs">Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Current location of incident" className="mt-1" /></div>
              <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe what happened..." rows={4} className="mt-1" /></div>
              <Button onClick={() => handleReport()} className="w-full gap-2"><Plus className="size-4" />Submit Incident Report</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Critical Report Dialog */}
        <Dialog open={showCriticalDialog} onOpenChange={setShowCriticalDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive"><AlertCircle className="size-5" />Critical Incident Report</DialogTitle>
              <DialogDescription>For life-threatening emergencies only. Contact emergency services when required.</DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive font-medium">
              Contact emergency services when required. Bus Flow AI is notifying the city bus control room.
            </div>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Incident Type</Label><Select value={form.incidentType} onValueChange={(v) => setForm({ ...form, incidentType: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{INCIDENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs">Bus</Label><Select value={form.busId} onValueChange={(v) => setForm({ ...form, busId: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select bus" /></SelectTrigger><SelectContent>{buses?.map((b) => <SelectItem key={b.busId} value={b.busId}>{b.busId} ({b.routeId})</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div><Label className="text-xs">Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location" className="mt-1" /></div>
              <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the emergency..." rows={3} className="mt-1" /></div>
              <Button variant="destructive" onClick={() => handleReport("CRITICAL")} className="w-full gap-2"><AlertCircle className="size-4" />Submit Critical Incident</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function SumCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return <div className="rounded-xl border border-border/40 bg-muted/20 p-2.5 text-center"><div className={`text-xl font-bold ${color || "text-foreground"}`}>{value}</div><div className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide mt-0.5">{label}</div></div>;
}
function DItem({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-muted/30 p-2.5"><div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-0.5 text-sm font-medium text-foreground">{value}</div></div>;
}
