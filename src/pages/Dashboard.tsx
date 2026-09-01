import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/DashboardLayout";
import { NetworkMap } from "@/components/NetworkMap";
import { useNavigate } from "react-router";
import {
  Route,
  Users,
  Bus,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
} from "lucide-react";

export default function Dashboard() {
  const stats = useQuery(api.dashboard.stats);
  const routes = useQuery(api.routes.list);
  const conflicts = useQuery(api.scheduling.detectConflicts, { date: new Date().toISOString().split("T")[0] });
  const navigate = useNavigate();

  const isLoading = !stats || !routes;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Operations Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time overview of your bus network
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Route}
            label="Active Routes"
            value={stats?.activeRoutes ?? 0}
            sub={`${stats?.proposedRoutes ?? 0} proposed`}
            color="text-primary"
            bgColor="bg-primary/10"
            loading={isLoading}
          />
          <StatCard
            icon={Users}
            label="Crew Utilization"
            value={`${stats?.crewUtilization ?? 0}%`}
            sub={`${stats?.onDutyCrew ?? 0} of ${stats?.totalCrew ?? 0} on duty`}
            color="text-accent"
            bgColor="bg-accent/10"
            loading={isLoading}
          />
          <StatCard
            icon={Bus}
            label="Fleet Status"
            value={stats?.activeBuses ?? 0}
            sub={`${stats?.availableBuses ?? 0} available, ${stats?.maintenanceBuses ?? 0} maintenance`}
            color="text-chart-3"
            bgColor="bg-chart-3/10"
            loading={isLoading}
          />
          <StatCard
            icon={ShieldAlert}
            label="Open Conflicts"
            value={stats?.openConflicts ?? 0}
            sub={`${stats?.resolvedConflicts ?? 0} resolved`}
            color="text-destructive"
            bgColor="bg-destructive/10"
            loading={isLoading}
            alert={(stats?.openConflicts ?? 0) > 0}
          />
        </div>

        {/* Map and Conflicts */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Network Map */}
          <div className="lg:col-span-2">
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Live Network Map</CardTitle>
                  <button
                    onClick={() => navigate("/dashboard/routes")}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Manage routes →
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {routes ? (
                  <NetworkMap
                    routes={routes.map((r) => ({
                      routeId: r.routeId,
                      name: r.name,
                      coordinates: r.coordinates,
                      status: r.status,
                      stops: r.stops,
                    }))}
                    height="360px"
                  />
                ) : (
                  <div className="flex h-[360px] items-center justify-center text-sm text-muted-foreground">
                    Loading map...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Conflict Alerts */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Conflict Alerts</CardTitle>
                <button
                  onClick={() => navigate("/dashboard/conflicts")}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  View all →
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {conflicts && conflicts.length > 0 ? (
                <div className="space-y-3">
                  {conflicts.slice(0, 5).map((conflict, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border/50 bg-card p-3"
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle
                          className={`mt-0.5 size-4 shrink-0 ${
                            conflict.severity === "high"
                              ? "text-destructive"
                              : conflict.severity === "medium"
                                ? "text-chart-4"
                                : "text-muted-foreground"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground leading-snug">
                            {conflict.description}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <Badge
                              variant={
                                conflict.severity === "high"
                                  ? "destructive"
                                  : conflict.severity === "medium"
                                    ? "default"
                                    : "secondary"
                              }
                              className="text-[10px] px-1.5 py-0"
                            >
                              {conflict.severity}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {conflict.type.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-center">
                  <CheckCircle2 className="mb-2 size-8 text-accent" />
                  <p className="text-sm font-medium text-foreground">No conflicts detected</p>
                  <p className="text-xs text-muted-foreground mt-1">All schedules look good</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Utilization and Coverage */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Crew Utilization */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Crew Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 animate-pulse rounded bg-muted" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Overall utilization</span>
                    <span className="text-lg font-bold text-foreground">{stats.crewUtilization}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                      style={{ width: `${stats.crewUtilization}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="text-center">
                      <div className="text-lg font-bold text-accent">{stats.onDutyCrew}</div>
                      <div className="text-[10px] text-muted-foreground">On Duty</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-primary">{stats.availableCrew}</div>
                      <div className="text-[10px] text-muted-foreground">Available</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-chart-4">{stats.restingCrew}</div>
                      <div className="text-[10px] text-muted-foreground">Resting</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Route Coverage */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Route Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 animate-pulse rounded bg-muted" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Routes covered today</span>
                    <span className="text-lg font-bold text-foreground">{stats.routeCoverage}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent to-chart-3 transition-all duration-700"
                      style={{ width: `${stats.routeCoverage}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="text-center">
                      <div className="text-lg font-bold text-foreground">{stats.activeRoutes}</div>
                      <div className="text-[10px] text-muted-foreground">Active Routes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-foreground">{stats.totalDuties}</div>
                      <div className="text-[10px] text-muted-foreground">Scheduled Duties</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-foreground">{stats.totalCapacity}</div>
                      <div className="text-[10px] text-muted-foreground">Total Capacity</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Operational Summary */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              Operational Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <SummaryItem label="Crew Utilization" value={`${stats.crewUtilization}%`} icon={TrendingUp} />
                <SummaryItem label="Route Coverage" value={`${stats.routeCoverage}%`} icon={Route} />
                <SummaryItem label="Scheduling Conflicts" value={`${stats.openConflicts}`} icon={AlertTriangle} />
                <SummaryItem label="Active Buses" value={`${stats.activeBuses}`} icon={Bus} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  bgColor,
  loading,
  alert,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub: string;
  color: string;
  bgColor: string;
  loading: boolean;
  alert?: boolean;
}) {
  return (
    <Card className={`border-border/60 transition-all ${alert ? "ring-1 ring-destructive/20" : ""}`}>
      <CardContent className="p-5">
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {label}
              </span>
              <div className={`flex size-8 items-center justify-center rounded-lg ${bgColor}`}>
                <Icon className={`size-4 ${color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">{value}</div>
            <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: any;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/30 p-3">
      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="size-4 text-primary" />
      </div>
      <div>
        <div className="text-lg font-bold text-foreground">{value}</div>
        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
      </div>
    </div>
  );
}
