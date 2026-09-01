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
import { AlertTriangle, AlertCircle, Shield, Send, CheckCircle2, XCircle, Clock, Search, ChevronLeft, Bell, Eye } from "lucide-react";
import { toast } from "sonner";

const ALERT_TYPES = ["FLOOD", "WATERLOGGING", "ROAD CLOSURE", "SEVERE TRAFFIC", "ACCIDENT AHEAD", "FIRE", "FALLEN TREE", "SEVERE WEATHER", "ROAD DAMAGE", "SECURITY EMERGENCY", "MEDICAL EMERGENCY"];
const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function EmergencyAlerts() {
  const alerts = useQuery(api.alerts.list);
  const alertStats = useQuery(api.alerts.stats);
  const routes = useQuery(api.routes.list);
  const buses = useQuery(api.buses.list);
  const crew = useQuery(api.crew.list);
  const sendAlert = useMutation(api.alerts.send);
  const ackAlert = useMutation(api.alerts.acknowledge);
  const escalateAlert = useMutation(api.alerts.escalate);
  const resolveAlert = useMutation(api.alerts.resolve);
  const seedFlood = useMutation(api.alerts.seedFloodScenario);

  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRoute, setFilterRoute] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [form, setForm] = useState({
    alertId: "", alertType: "FLOOD", severity: "CRITICAL", routeId: "", busId: "",
    affectedLocation: "", affectedStops: "", message: "", createdBy: "Control Room",
  });

  const filtered = useMemo(() => {
    if (!alerts) return [];
    let result = [...alerts];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) => a.alertId.toLowerCase().includes(q) || a.alertType.toLowerCase().includes(q) || a.message.toLowerCase().includes(q) || a.affectedLocation.toLowerCase().includes(q));
    }
    if (filterSeverity !== "all") result = result.filter((a) => a.severity === filterSeverity);
    if (filterStatus !== "all") result = result.filter((a) => a.status === filterStatus);
    if (filterRoute !== "all") result = result.filter((a) => a.routeId === filterRoute);
    return result;
  }, [alerts, searchQuery, filterSeverity, filterStatus, filterRoute]);

  const handleSend = async () => {
    if (!form.routeId || !form.message) { toast.error("Route and message required"); return; }
    const id = form.alertId || `ALERT-${String(Date.now()).slice(-6)}`;
    const selectedBus = buses?.find((b) => b.busId === form.busId);
    const driverId = selectedBus?.assignedDriver;
    try {
      await sendAlert({
        alertId: id, alertType: form.alertType, severity: form.severity, routeId: form.routeId,
        busId: form.busId || undefined, driverId,
        affectedLocation: form.affectedLocation || "Route segment",
        affectedStops: form.affectedStops.split(",").map((s) => s.trim()).filter(Boolean),
        message: form.message, createdBy: form.createdBy,
      });
      toast.success(`Emergency alert ${id} sent`);
      setShowSendDialog(false);
      setForm({ alertId: "", alertType: "FLOOD", severity: "CRITICAL", routeId: "", busId: "", affectedLocation: "", affectedStops: "", message: "", createdBy: "Control Room" });
    } catch (e: any) { toast.error(e.message); }
  };

  const handleAck = async (id: string) => { await ackAlert({ alertId: id as any }); toast.success("Alert acknowledged"); };
  const handleEscalate = async (id: string) => { await escalateAlert({ alertId: id as any }); toast.success("Alert escalated"); };
  const handleResolve = async (id: string, status: string) => { await resolveAlert({ alertId: id as any, status }); toast.success(`Alert ${status.toLowerCase()}`); };

  const handleSeed = async () => {
    const result = await seedFlood();
    toast.success(String(result));
  };

  const sevBadge = (s: string) => {
    if (s === "CRITICAL") return <Badge variant="destructive" className="text-[10px] gap-1"><AlertCircle className="size-2.5" />CRITICAL</Badge>;
    if (s === "HIGH") return <Badge className="text-[10px] bg-orange-100 text-orange-700 border-orange-200 gap-1"><AlertTriangle className="size-2.5" />HIGH</Badge>;
    if (s === "MEDIUM") return <Badge className="text-[10px] bg-yellow-100 text-yellow-700 border-yellow-200">MEDIUM</Badge>;
    return <Badge variant="secondary" className="text-[10px]">LOW</Badge>;
  };

  const statusBadge = (s: string) => {
    if (s === "ACTIVE") return <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200">ACTIVE</Badge>;
    if (s === "ACKNOWLEDGED") return <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200">ACKNOWLEDGED</Badge>;
    if (s === "EXPIRED") return <Badge variant="secondary" className="text-[10px]">EXPIRED</Badge>;
    if (s === "CANCELLED") return <Badge variant="outline" className="text-[10px]">CANCELLED</Badge>;
    return <Badge variant="secondary" className="text-[10px]">{s}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Emergency Alerts</h1>
            <p className="text-sm text-muted-foreground">Real-time emergency alert management for Chennai MTC</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSeed} className="gap-1.5"><Bell className="size-3.5" />Seed Demo</Button>
            <Button size="sm" onClick={() => setShowSendDialog(true)} className="gap-1.5"><Send className="size-3.5" />Send Alert</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-3 grid-cols-4 sm:grid-cols-7">
          <SumCard label="Active" value={alertStats?.activeEmergencies ?? 0} color="text-red-600" />
          <SumCard label="Critical" value={alertStats?.criticalAlerts ?? 0} color="text-destructive" />
          <SumCard label="High" value={alertStats?.highAlerts ?? 0} color="text-orange-600" />
          <SumCard label="Buses Affected" value={alertStats?.busesAffected ?? 0} color="text-primary" />
          <SumCard label="Passengers Notified" value={alertStats?.passengersNotified ?? 0} color="text-accent" />
          <SumCard label="Acknowledged" value={alertStats?.driverAcknowledgments ?? 0} color="text-green-600" />
          <SumCard label="Unacknowledged" value={alertStats?.unacknowledgedAlerts ?? 0} color="text-destructive" />
        </div>

        {/* Filters */}
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-wrap">
              <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" /><Input placeholder="Search alerts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" /></div>
              <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="all">All Severity</option>{SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="all">All Status</option><option value="ACTIVE">Active</option><option value="ACKNOWLEDGED">Acknowledged</option><option value="EXPIRED">Expired</option><option value="CANCELLED">Cancelled</option></select>
              <select value={filterRoute} onChange={(e) => setFilterRoute(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="all">All Routes</option>{routes?.map((r) => <option key={r.routeId} value={r.routeId}>{r.routeId}</option>)}</select>
            </div>
          </CardContent>
        </Card>

        {/* Alert Detail */}
        {showDetail && (
          <Card className={`border-2 ${showDetail.severity === "CRITICAL" ? "border-destructive/30 bg-destructive/[0.02]" : showDetail.severity === "HIGH" ? "border-orange-200" : "border-primary/20 bg-primary/[0.02]"}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => setShowDetail(null)}><ChevronLeft className="size-4" /></Button>
                  <div>
                    <CardTitle className="text-lg font-bold">{showDetail.alertId}</CardTitle>
                    <p className="text-xs text-muted-foreground">{showDetail.alertType} · Route {showDetail.routeId} · {showDetail.busId ?? "All buses"}</p>
                  </div>
                </div>
                <div className="flex gap-2">{sevBadge(showDetail.severity)}{statusBadge(showDetail.status)}</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Alert Box */}
              <div className={`rounded-xl border-2 p-5 ${showDetail.severity === "CRITICAL" ? "border-destructive bg-destructive/5" : "border-orange-200 bg-orange-50"}`}>
                <div className="flex items-center gap-2 mb-2">
                  {showDetail.severity === "CRITICAL" ? <AlertCircle className="size-5 text-destructive" /> : <AlertTriangle className="size-5 text-orange-600" />}
                  <span className="font-bold text-foreground">{showDetail.severity} {showDetail.alertType} ALERT</span>
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Route {showDetail.routeId}</p>
                <p className="text-sm text-foreground/80 mb-3">{showDetail.message}</p>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>📍 {showDetail.affectedLocation}</span>
                  <span>🕐 Issued: {new Date(showDetail.createdTime).toLocaleString()}</span>
                  {showDetail.expiresAt && <span>⏰ Expires: {new Date(showDetail.expiresAt).toLocaleString()}</span>}
                </div>
                {showDetail.affectedStops.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {showDetail.affectedStops.map((stop: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{stop}</Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Delivery Status */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-muted/30 p-3">
                  <div className="text-[10px] font-medium uppercase text-muted-foreground mb-1">Driver Delivery</div>
                  {showDetail.driverDelivered ? <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200 gap-1"><CheckCircle2 className="size-2.5" />DELIVERED</Badge> : <Badge variant="secondary" className="text-[10px]">NOT DELIVERED</Badge>}
                </div>
                <div className="rounded-lg bg-muted/30 p-3">
                  <div className="text-[10px] font-medium uppercase text-muted-foreground mb-1">Driver Acknowledgment</div>
                  {showDetail.driverAcknowledged ? <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200 gap-1"><CheckCircle2 className="size-2.5" />ACKNOWLEDGED {showDetail.driverAckTime ? `at ${new Date(showDetail.driverAckTime).toLocaleTimeString()}` : ""}</Badge> : <Badge variant="destructive" className="text-[10px] gap-1"><XCircle className="size-2.5" />NOT ACKNOWLEDGED</Badge>}
                </div>
                <div className="rounded-lg bg-muted/30 p-3">
                  <div className="text-[10px] font-medium uppercase text-muted-foreground mb-1">Passenger Delivery</div>
                  {showDetail.passengerDelivered ? <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200 gap-1"><CheckCircle2 className="size-2.5" />DELIVERED</Badge> : <Badge variant="secondary" className="text-[10px]">NOT DELIVERED</Badge>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {!showDetail.driverAcknowledged && <Button size="sm" variant="outline" onClick={() => { handleAck(showDetail._id); setShowDetail({ ...showDetail, driverAcknowledged: true }); }} className="gap-1"><CheckCircle2 className="size-3" />Acknowledge</Button>}
                <Button size="sm" variant="outline" onClick={() => handleEscalate(showDetail._id)} className="gap-1"><AlertTriangle className="size-3" />Escalate</Button>
                <Button size="sm" variant="outline" onClick={() => { handleResolve(showDetail._id, "EXPIRED"); setShowDetail({ ...showDetail, status: "EXPIRED" }); }} className="gap-1"><Clock className="size-3" />Expire</Button>
                <Button size="sm" variant="outline" onClick={() => { handleResolve(showDetail._id, "CANCELLED"); setShowDetail({ ...showDetail, status: "CANCELLED" }); }} className="gap-1"><XCircle className="size-3" />Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alerts List */}
        {!showDetail && (
          <div className="space-y-3">
            {filtered.map((alert) => (
              <Card key={alert._id} className={`cursor-pointer transition-all hover:shadow-md ${alert.severity === "CRITICAL" && alert.status === "ACTIVE" ? "border-destructive/30 bg-destructive/[0.01]" : ""}`} onClick={() => setShowDetail(alert)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${alert.severity === "CRITICAL" ? "bg-destructive/10" : alert.severity === "HIGH" ? "bg-orange-50" : "bg-muted"}`}>
                      {alert.severity === "CRITICAL" ? <AlertCircle className="size-4 text-destructive" /> : <AlertTriangle className="size-4 text-orange-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-foreground">{alert.alertId}</span>
                        {sevBadge(alert.severity)}
                        <Badge variant="outline" className="text-[10px]">{alert.alertType}</Badge>
                        {statusBadge(alert.status)}
                      </div>
                      <p className="text-sm text-foreground font-medium leading-snug line-clamp-1">{alert.message}</p>
                      <div className="mt-1.5 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                        <span>Route: <strong className="text-foreground/70">{alert.routeId}</strong></span>
                        {alert.busId && <span>Bus: <strong className="text-foreground/70">{alert.busId}</strong></span>}
                        <span>📍 {alert.affectedLocation}</span>
                        <span>{new Date(alert.createdTime).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {alert.driverAcknowledged ? <Badge className="text-[9px] bg-green-100 text-green-700 border-green-200">ACK</Badge> : alert.status === "ACTIVE" ? <Badge variant="destructive" className="text-[9px]">NO ACK</Badge> : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && <Card className="border-border/60"><CardContent className="py-12 text-center text-sm text-muted-foreground">No alerts found. Click "Send Alert" or "Seed Demo" to get started.</CardContent></Card>}
          </div>
        )}

        {/* Send Alert Dialog */}
        <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Send Emergency Alert</DialogTitle>
              <DialogDescription>Send an immediate warning to bus drivers and passengers</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Alert Type</Label><Select value={form.alertType} onValueChange={(v) => setForm({ ...form, alertType: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{ALERT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs">Severity</Label><Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Route</Label><Select value={form.routeId} onValueChange={(v) => setForm({ ...form, routeId: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select route" /></SelectTrigger><SelectContent>{routes?.map((r) => <SelectItem key={r.routeId} value={r.routeId}>{r.routeId} — {r.name}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs">Bus (optional)</Label><Select value={form.busId} onValueChange={(v) => setForm({ ...form, busId: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="All buses" /></SelectTrigger><SelectContent><SelectItem value="">All Buses</SelectItem>{buses?.filter((b) => !form.routeId || b.routeId === form.routeId).map((b) => <SelectItem key={b.busId} value={b.busId}>{b.busId} ({b.routeId})</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div><Label className="text-xs">Affected Location</Label><Input value={form.affectedLocation} onChange={(e) => setForm({ ...form, affectedLocation: e.target.value })} placeholder="Road section near..." className="mt-1" /></div>
              <div><Label className="text-xs">Affected Stops (comma-separated)</Label><Input value={form.affectedStops} onChange={(e) => setForm({ ...form, affectedStops: e.target.value })} placeholder="Chromepet, Pallavaram" className="mt-1" /></div>
              <div><Label className="text-xs">Warning Message</Label><Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Detailed warning message for drivers and passengers..." rows={4} className="mt-1" /></div>
              <Button onClick={handleSend} className="w-full gap-2"><Send className="size-4" />Send Emergency Alert</Button>
            </div>
          </DialogContent>
        </Dialog>
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
