import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CalendarClock, Clock, Bus, Users, Search } from "lucide-react";

export default function Scheduling() {
  const schedules = useQuery(api.scheduling.list);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    if (!schedules) return [];
    let result = [...schedules];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) =>
        s.scheduleId.toLowerCase().includes(q) ||
        s.busId.toLowerCase().includes(q) ||
        s.routeId.toLowerCase().includes(q) ||
        s.driverId.toLowerCase().includes(q) ||
        s.conductorId.toLowerCase().includes(q)
      );
    }
    return result;
  }, [schedules, searchQuery]);

  const stats = useMemo(() => {
    if (!schedules) return { total: 0, onTime: 0, delayed: 0, cancelled: 0, totalTrips: 0 };
    const onTime = schedules.filter((s) => s.status === "on_time").length;
    const delayed = schedules.filter((s) => s.status === "delayed").length;
    const cancelled = schedules.filter((s) => s.status === "cancelled").length;
    const totalTrips = schedules.reduce((sum, s) => sum + s.scheduledTrips, 0);
    return { total: schedules.length, onTime, delayed, cancelled, totalTrips };
  }, [schedules]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Bus Schedules</h1>
          <p className="text-sm text-muted-foreground">Daily operating schedules for Chennai MTC fleet</p>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-5">
          <StatCard icon={CalendarClock} label="Total Schedules" value={stats.total} />
          <StatCard icon={Clock} label="On Time" value={stats.onTime} color="text-accent" />
          <StatCard icon={Clock} label="Delayed" value={stats.delayed} color="text-chart-4" />
          <StatCard icon={Bus} label="Cancelled" value={stats.cancelled} color="text-destructive" />
          <StatCard icon={Users} label="Total Trips" value={stats.totalTrips} color="text-primary" />
        </div>

        {/* Search */}
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Search schedule ID, bus, route, driver..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
          </CardContent>
        </Card>

        {/* Schedules Table */}
        <Card className="border-border/60">
          <CardContent className="p-0">
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                  <tr className="border-b border-border/50">
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Schedule</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Bus</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Route</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Driver</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Conductor</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Time</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Shift</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Trips</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Freq</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Delay</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filtered.map((s) => (
                    <tr key={s._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5 text-xs font-medium text-primary">{s.scheduleId}</td>
                      <td className="px-3 py-2.5 text-xs font-medium text-foreground">{s.busId}</td>
                      <td className="px-3 py-2.5 text-xs text-foreground/80">{s.routeId}</td>
                      <td className="px-3 py-2.5 text-xs text-foreground/80">{s.driverId}</td>
                      <td className="px-3 py-2.5 text-xs text-foreground/80">{s.conductorId}</td>
                      <td className="px-3 py-2.5 text-xs text-foreground/80">{s.startTime} – {s.endTime}</td>
                      <td className="px-3 py-2.5"><Badge variant="secondary" className="text-[10px]">{s.shift}</Badge></td>
                      <td className="px-3 py-2.5 text-xs text-foreground/80 text-center">{s.scheduledTrips}</td>
                      <td className="px-3 py-2.5 text-xs text-foreground/80">{s.departureFrequency}</td>
                      <td className="px-3 py-2.5 text-xs text-foreground/80">{s.delayMinutes > 0 ? `${s.delayMinutes}min` : "—"}</td>
                      <td className="px-3 py-2.5">
                        <Badge variant={s.status === "delayed" ? "destructive" : s.status === "cancelled" ? "outline" : "default"} className="text-[10px]">
                          {s.status === "on_time" ? "On Time" : s.status === "delayed" ? "Delayed" : s.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">No schedules found.</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-muted/20 p-3 flex items-center gap-3">
      <div className={`flex size-9 items-center justify-center rounded-lg bg-muted`}>
        <Icon className={`size-4 ${color || "text-foreground"}`} />
      </div>
      <div>
        <div className="text-lg font-bold text-foreground">{value}</div>
        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
      </div>
    </div>
  );
}
