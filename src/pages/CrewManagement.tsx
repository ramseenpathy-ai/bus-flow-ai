import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Search, Users, UserCheck, UserX, ChevronLeft, Shield, Clock, MapPin } from "lucide-react";

export default function CrewManagement() {
  const crew = useQuery(api.crew.list);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterBus, setFilterBus] = useState("all");
  const [selectedCrewId, setSelectedCrewId] = useState<string | null>(null);

  const selected = useMemo(() => {
    if (!crew || !selectedCrewId) return null;
    return crew.find((c) => c.crewId === selectedCrewId) ?? null;
  }, [crew, selectedCrewId]);

  const filtered = useMemo(() => {
    if (!crew) return [];
    let result = [...crew];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) =>
        c.crewId.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.employeeId.toLowerCase().includes(q) ||
        (c.assignedBus ?? "").toLowerCase().includes(q) ||
        (c.assignedRoute ?? "").toLowerCase().includes(q)
      );
    }
    if (filterRole !== "all") result = result.filter((c) => c.role === filterRole);
    if (filterStatus !== "all") result = result.filter((c) => c.dutyStatus === filterStatus);
    if (filterBus !== "all") result = result.filter((c) => c.assignedBus === filterBus);
    return result;
  }, [crew, searchQuery, filterRole, filterStatus, filterBus]);

  const stats = useMemo(() => {
    if (!crew) return { total: 0, drivers: 0, conductors: 0, onDuty: 0, offDuty: 0, onLeave: 0, available: 0, assigned: 0, trainingDue: 0 };
    const drivers = crew.filter((c) => c.role === "Driver").length;
    const conductors = crew.filter((c) => c.role === "Conductor").length;
    const onDuty = crew.filter((c) => c.dutyStatus === "on_duty").length;
    const offDuty = crew.filter((c) => c.dutyStatus === "off_duty").length;
    const available = crew.filter((c) => c.dutyStatus === "available").length;
    const assigned = crew.filter((c) => c.assignedBus).length;
    const trainingDue = crew.filter((c) => c.safetyStatus === "Due").length;
    return { total: crew.length, drivers, conductors, onDuty, offDuty, onLeave: 0, available, assigned, trainingDue };
  }, [crew]);

  const dutyStatusColors: Record<string, string> = {
    on_duty: "bg-primary/10 text-primary border-primary/20",
    available: "bg-accent/10 text-accent border-accent/20",
    off_duty: "bg-muted text-muted-foreground border-border",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Crew Management</h1>
          <p className="text-sm text-muted-foreground">{crew ? `${crew.length} crew members across 20 buses` : "Loading..."}</p>
        </div>

        {/* Stats Row */}
        <div className="grid gap-3 grid-cols-3 sm:grid-cols-6">
          <MiniStat icon={Users} label="Total" value={stats.total} color="text-foreground" />
          <MiniStat icon={UserCheck} label="Drivers" value={stats.drivers} color="text-primary" />
          <MiniStat icon={UserCheck} label="Conductors" value={stats.conductors} color="text-accent" />
          <MiniStat icon={Clock} label="On Duty" value={stats.onDuty} color="text-primary" />
          <MiniStat icon={UserX} label="Available" value={stats.available} color="text-accent" />
          <MiniStat icon={Shield} label="Training Due" value={stats.trainingDue} color="text-chart-4" />
        </div>

        {/* Filters */}
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input placeholder="Search crew ID, name, bus, route..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="all">All Roles</option>
                <option value="Driver">Drivers</option>
                <option value="Conductor">Conductors</option>
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="all">All Status</option>
                <option value="on_duty">On Duty</option>
                <option value="available">Available</option>
                <option value="off_duty">Off Duty</option>
              </select>
              <select value={filterBus} onChange={(e) => setFilterBus(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option value="all">All Buses</option>
                {Array.from({ length: 20 }, (_, i) => `Bus ${String(i + 1).padStart(3, "0")}`).map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
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
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => setSelectedCrewId(null)}><ChevronLeft className="size-4" /></Button>
                  <div>
                    <CardTitle className="text-lg font-bold">{selected.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{selected.crewId} · {selected.employeeId} · {selected.role}</p>
                  </div>
                </div>
                <Badge className={`text-[10px] ${dutyStatusColors[selected.dutyStatus] || ""}`}>{selected.dutyStatus.replace("_", " ")}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DItem label="Gender" value={selected.gender} />
                <DItem label="Age" value={`${selected.age}`} />
                <DItem label="Phone" value={selected.phone ?? "—"} />
                <DItem label="Employee ID" value={selected.employeeId} />
                {selected.role === "Driver" && <>
                  <DItem label="License Number" value={selected.licenseNumber ?? "—"} />
                  <DItem label="License Class" value={selected.licenseClass ?? "—"} />
                </>}
                <DItem label="Experience" value={selected.yearsOfExperience ? `${selected.yearsOfExperience} years` : "—"} />
                <DItem label="Assigned Bus" value={selected.assignedBus ?? "—"} />
                <DItem label="Assigned Route" value={selected.assignedRoute ?? "—"} />
                <DItem label="Shift" value={selected.shift} />
                <DItem label="Duty Status" value={selected.dutyStatus.replace("_", " ")} />
                <DItem label="Joining Date" value={selected.joiningDate} />
                <DItem label="Attendance" value={selected.attendanceStatus ?? "—"} />
                <DItem label="Safety Status" value={selected.safetyStatus ?? "—"} />
                <DItem label="Emergency Contact" value={selected.emergencyContactName ?? "—"} />
                <DItem label="Emergency Phone" value={selected.emergencyContactPhone ?? "—"} />
                <DItem label="Current Location" value={selected.currentLocation ?? "—"} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Crew Table */}
        {!selected && (
          <Card className="border-border/60">
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                    <tr className="border-b border-border/50">
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">ID</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Name</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Role</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Bus</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Route</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Shift</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filtered.map((c) => (
                      <tr key={c._id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedCrewId(c.crewId)}>
                        <td className="px-3 py-2.5 text-xs font-medium text-primary">{c.crewId}</td>
                        <td className="px-3 py-2.5 font-medium text-foreground">{c.name}</td>
                        <td className="px-3 py-2.5"><Badge variant={c.role === "Driver" ? "default" : "secondary"} className="text-[10px]">{c.role}</Badge></td>
                        <td className="px-3 py-2.5 text-xs text-foreground/80">{c.assignedBus ?? "—"}</td>
                        <td className="px-3 py-2.5 text-xs text-foreground/80">{c.assignedRoute ?? "—"}</td>
                        <td className="px-3 py-2.5 text-xs text-foreground/80">{c.shift}</td>
                        <td className="px-3 py-2.5"><Badge className={`text-[10px] ${dutyStatusColors[c.dutyStatus] || ""}`}>{c.dutyStatus.replace("_", " ")}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">No crew members found.</div>}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function MiniStat({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-muted/20 p-3 flex items-center gap-2.5">
      <Icon className={`size-4 ${color}`} />
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
