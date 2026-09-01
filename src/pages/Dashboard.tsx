import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/DashboardLayout";
import { NetworkMap } from "@/components/NetworkMap";
import { useNavigate } from "react-router";
import { Route, Users, Bus, ShieldAlert, TrendingUp, Link2, Unlink, AlertTriangle, Activity, CheckCircle2, Bell, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const ops = useQuery(api.logic.opsSummary);
  const routes = useQuery(api.routes.list);
  const routeSchedule = useQuery(api.logic.routeScheduleView);
  const conflicts = useQuery(api.scheduling.detectConflicts, { date: new Date().toISOString().split("T")[0] });
  const alertStats = useQuery(api.alerts.stats);
  const incStats = useQuery(api.incidents.stats);
  const navigate = useNavigate();

  const isLoading = !ops;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Operations Dashboard</h1>
          <p className="text-sm text-muted-foreground">Chennai MTC — Real-time route, schedule, and fleet overview</p>
        </div>

        {/* Operations Overview */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="size-4 text-primary" /> Operations Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-3 sm:grid-cols-6 lg:grid-cols-12">
              {isLoading ? Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />) : (
                <>
                  <OpsStat label="Routes" value={ops!.routes} icon={Route} color="text-primary" />
                  <OpsStat label="Active Buses" value={ops!.onRouteBuses} icon={Bus} color="text-primary" />
                  <OpsStat label="Available" value={ops!.availableBuses} icon={CheckCircle2} color="text-accent" />
                  <OpsStat label="Maintenance" value={ops!.maintenanceBuses} icon={AlertTriangle} color="text-chart-4" />
                  <OpsStat label="Crew On Duty" value={ops!.onDutyCrew} icon={Users} color="text-primary" />
                  <OpsStat label="Crew Available" value={ops!.availableCrew} icon={Users} color="text-accent" />
                  <OpsStat label="Schedules" value={ops!.totalSchedules} icon={Activity} color="text-foreground" />
                  <OpsStat label="Linked" value={ops!.linkedDuties} icon={Link2} color="text-green-600" />
                  <OpsStat label="Partial" value={ops!.partiallyLinkedDuties} icon={AlertTriangle} color="text-yellow-600" />
                  <OpsStat label="Unlinked" value={ops!.unlinkedDuties} icon={Unlink} color="text-red-600" />
                  <OpsStat label="Conflicts" value={0} icon={ShieldAlert} color="text-destructive" />
                  <OpsStat label="Rest Violations" value={ops!.restViolations} icon={ShieldAlert} color="text-destructive" />
                </>
              )}
            </div>
            {!isLoading && (
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>Fleet Utilization: <strong className="text-foreground">{ops!.fleetUtilization}%</strong></span>
                <span>Route Coverage: <strong className="text-foreground">{ops!.routeCoverage}%</strong></span>
                <span>Rest Compliance: <strong className="text-foreground">{ops!.totalCrew > 0 ? Math.round(((ops!.totalCrew - ops!.restViolations) / ops!.totalCrew) * 100) : 0}%</strong></span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Map + Conflicts */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Chennai Network Map</CardTitle>
                  <button onClick={() => navigate("/dashboard/routes")} className="text-xs font-medium text-primary hover:underline">Routes →</button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {routes ? (
                  <NetworkMap routes={routes.map((r) => ({ routeId: r.routeId, name: r.name, coordinates: r.coordinates, status: r.status, stops: r.stops }))} height="320px" />
                ) : (
                  <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">Loading map...</div>
                )}
              </CardContent>
            </Card>
          </div>
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Conflict Alerts</CardTitle>
                <button onClick={() => navigate("/dashboard/conflicts")} className="text-xs font-medium text-primary hover:underline">View all →</button>
              </div>
            </CardHeader>
            <CardContent>
              {conflicts && conflicts.length > 0 ? (
                <div className="space-y-2">
                  {conflicts.slice(0, 5).map((c: any, i: number) => (
                    <div key={i} className="rounded-lg border border-border/50 bg-card p-2.5">
                      <p className="text-xs font-medium text-foreground leading-snug">{c.description}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant={c.severity === "high" ? "destructive" : "default"} className="text-[10px]">{c.severity}</Badge>
                        <span className="text-[10px] text-muted-foreground">{c.type.replace(/_/g, " ")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-center">
                  <CheckCircle2 className="mb-2 size-8 text-accent" />
                  <p className="text-sm font-medium text-foreground">No conflicts detected</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Combined Route + Schedule View */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Link2 className="size-4 text-primary" /> Route + Schedule View
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                  <tr className="border-b border-border/50">
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Route</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Bus</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Driver</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Conductor</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Link</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Start</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">End</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Shift</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Status</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Conflicts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {routeSchedule?.map((r, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2 text-xs font-bold text-primary">{r.routeId}</td>
                      <td className="px-3 py-2 text-xs text-foreground/80">{r.busId}</td>
                      <td className="px-3 py-2 text-xs text-foreground/80">{r.driverName}</td>
                      <td className="px-3 py-2 text-xs text-foreground/80">{r.conductorName}</td>
                      <td className="px-3 py-2">
                        {r.linkStatus === "linked" ? <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200 gap-1"><Link2 className="size-2" />LINKED</Badge> :
                         r.linkStatus === "partially_linked" ? <Badge className="text-[10px] bg-yellow-100 text-yellow-700 border-yellow-200 gap-1"><AlertTriangle className="size-2" />PARTIAL</Badge> :
                         <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200 gap-1"><Unlink className="size-2" />UNLINKED</Badge>}
                      </td>
                      <td className="px-3 py-2 text-xs text-foreground/80">{r.startTime}</td>
                      <td className="px-3 py-2 text-xs text-foreground/80">{r.endTime}</td>
                      <td className="px-3 py-2"><Badge variant="secondary" className="text-[10px]">{r.shift}</Badge></td>
                      <td className="px-3 py-2"><Badge variant={r.status === "delayed" ? "destructive" : "default"} className="text-[10px]">{r.status === "on_time" ? "On Time" : r.status}</Badge></td>
                      <td className="px-3 py-2">
                        {r.conflicts.length > 0 ? r.conflicts.map((c: string, j: number) => (
                          <Badge key={j} variant="destructive" className="text-[9px] mr-1 mb-0.5">{c}</Badge>
                        )) : <span className="text-[10px] text-muted-foreground">None</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!routeSchedule && <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>}
              {routeSchedule && routeSchedule.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No schedules</div>}
            </div>
          </CardContent>
        </Card>

        {/* Utilisation & Coverage */}
        {!isLoading && (
          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Fleet Utilisation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">On Route / Total</span>
                  <span className="text-lg font-bold text-foreground">{ops!.fleetUtilization}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${ops!.fleetUtilization}%` }} /></div>
                <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                  <div><div className="text-sm font-bold text-primary">{ops!.onRouteBuses}</div><div className="text-[9px] text-muted-foreground">On Route</div></div>
                  <div><div className="text-sm font-bold text-accent">{ops!.availableBuses}</div><div className="text-[9px] text-muted-foreground">Available</div></div>
                  <div><div className="text-sm font-bold text-chart-4">{ops!.maintenanceBuses}</div><div className="text-[9px] text-muted-foreground">Maint.</div></div>
                  <div><div className="text-sm font-bold text-muted-foreground">{ops!.offDutyBuses}</div><div className="text-[9px] text-muted-foreground">Off Duty</div></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Route Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Routes with buses / Total</span>
                  <span className="text-lg font-bold text-foreground">{ops!.routeCoverage}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-accent to-chart-3" style={{ width: `${ops!.routeCoverage}%` }} /></div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div><div className="text-sm font-bold text-foreground">{ops!.routes}</div><div className="text-[9px] text-muted-foreground">Total Routes</div></div>
                  <div><div className="text-sm font-bold text-accent">{ops!.routesWithBuses}</div><div className="text-[9px] text-muted-foreground">With Buses</div></div>
                  <div><div className="text-sm font-bold text-muted-foreground">{ops!.routesWithoutBuses}</div><div className="text-[9px] text-muted-foreground">No Buses</div></div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Emergency & Incident Summary */}
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="border-border/60 cursor-pointer hover:shadow-md transition-all" onClick={() => navigate("/dashboard/emergency")}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><Bell className="size-4 text-destructive" />Emergency Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div><div className="text-lg font-bold text-destructive">{alertStats?.activeEmergencies ?? 0}</div><div className="text-[9px] text-muted-foreground">Active</div></div>
                <div><div className="text-lg font-bold text-orange-600">{alertStats?.criticalAlerts ?? 0}</div><div className="text-[9px] text-muted-foreground">Critical</div></div>
                <div><div className="text-lg font-bold text-primary">{alertStats?.busesAffected ?? 0}</div><div className="text-[9px] text-muted-foreground">Buses</div></div>
                <div><div className="text-lg font-bold text-destructive">{alertStats?.unacknowledgedAlerts ?? 0}</div><div className="text-[9px] text-muted-foreground">Unack.</div></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 cursor-pointer hover:shadow-md transition-all" onClick={() => navigate("/dashboard/incidents")}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2"><AlertCircle className="size-4 text-orange-600" />Incident Reporting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div><div className="text-lg font-bold text-orange-600">{incStats?.newIncidents ?? 0}</div><div className="text-[9px] text-muted-foreground">New</div></div>
                <div><div className="text-lg font-bold text-destructive">{incStats?.critical ?? 0}</div><div className="text-[9px] text-muted-foreground">Critical</div></div>
                <div><div className="text-lg font-bold text-primary">{incStats?.busesInDistress ?? 0}</div><div className="text-[9px] text-muted-foreground">Buses</div></div>
                <div><div className="text-lg font-bold text-accent">{incStats?.resolved ?? 0}</div><div className="text-[9px] text-muted-foreground">Resolved</div></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function OpsStat({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-muted/10 p-2 text-center">
      <Icon className={`size-3.5 mx-auto mb-0.5 ${color}`} />
      <div className="text-base font-bold text-foreground">{value}</div>
      <div className="text-[8px] font-medium text-muted-foreground uppercase tracking-wide leading-tight">{label}</div>
    </div>
  );
}
