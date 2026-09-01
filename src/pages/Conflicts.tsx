import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Clock,
  Link2,
  Unlink,
  Route,
  Bus,
  Users,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

export default function Conflicts() {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [filterSeverity, setFilterSeverity] = useState("all");

  const conflicts = useQuery(api.scheduling.detectConflicts, { date: selectedDate });
  const fallbacks = useQuery(api.scheduling.getFallbackSuggestions, {
    routeId: "R-01",
    startTime: "06:00",
    endTime: "14:00",
    date: selectedDate,
  });

  const filteredConflicts = conflicts?.filter((c) => {
    if (filterSeverity === "all") return true;
    return c.severity === filterSeverity;
  });

  const highCount = conflicts?.filter((c) => c.severity === "high").length ?? 0;
  const mediumCount = conflicts?.filter((c) => c.severity === "medium").length ?? 0;
  const lowCount = conflicts?.filter((c) => c.severity === "low").length ?? 0;

  const conflictTypeIcons: Record<string, any> = {
    crew_double_booking: Users,
    bus_double_booking: Bus,
    insufficient_rest: Clock,
    missing_crew_assignment: Users,
    missing_bus_assignment: Bus,
    route_overlap: Route,
    time_conflict: AlertTriangle,
  };

  const conflictTypeLabels: Record<string, string> = {
    crew_double_booking: "Crew Double-Booking",
    bus_double_booking: "Bus Double-Booking",
    insufficient_rest: "Insufficient Rest Period",
    missing_crew_assignment: "Missing Crew Assignment",
    missing_bus_assignment: "Missing Bus Assignment",
    route_overlap: "Route Overlap",
    time_conflict: "Time Conflict",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Conflict Detection & Resolution
            </h1>
            <p className="text-sm text-muted-foreground">
              Automatic overlap and conflict detection with fallback recommendations
            </p>
          </div>
        </div>

        {/* Conflict Summary */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className={`border-border/60 ${highCount > 0 ? "ring-1 ring-destructive/20" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertTriangle className="size-4 text-destructive" />
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">{highCount}</div>
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">High Severity</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-chart-4/10">
                  <AlertTriangle className="size-4 text-chart-4" />
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">{mediumCount}</div>
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Medium</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <AlertTriangle className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">{lowCount}</div>
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Low</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-accent/10">
                  <CheckCircle2 className="size-4 text-accent" />
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">{conflicts?.length ?? 0}</div>
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Total Detected</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Date and Filter */}
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium whitespace-nowrap">Check Date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium whitespace-nowrap">Filter</Label>
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="high">High Only</SelectItem>
                    <SelectItem value="medium">Medium Only</SelectItem>
                    <SelectItem value="low">Low Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conflicts List and Fallback */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Conflict List */}
          <div className="lg:col-span-2 space-y-4">
            {filteredConflicts && filteredConflicts.length > 0 ? (
              filteredConflicts.map((conflict, i) => {
                const TypeIcon = conflictTypeIcons[conflict.type] || AlertTriangle;
                const typeLabel = conflictTypeLabels[conflict.type] || conflict.type.replace(/_/g, " ");

                return (
                  <Card
                    key={i}
                    className={`border-border/60 transition-all ${
                      conflict.severity === "high"
                        ? "border-destructive/20 bg-destructive/[0.01]"
                        : conflict.severity === "medium"
                          ? "border-chart-4/20"
                          : ""
                    }`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                          conflict.severity === "high"
                            ? "bg-destructive/10"
                            : conflict.severity === "medium"
                              ? "bg-chart-4/10"
                              : "bg-muted"
                        }`}>
                          <TypeIcon className={`size-5 ${
                            conflict.severity === "high" ? "text-destructive" : conflict.severity === "medium" ? "text-chart-4" : "text-muted-foreground"
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge
                              variant={
                                conflict.severity === "high" ? "destructive" : conflict.severity === "medium" ? "default" : "secondary"
                              }
                              className="text-[10px]"
                            >
                              {conflict.severity}
                            </Badge>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              {typeLabel}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-foreground leading-relaxed">
                            {conflict.description}
                          </p>

                          {/* Fallback Suggestions */}
                          {conflict.fallbackSuggestions.length > 0 && (
                            <div className="mt-4 rounded-xl bg-muted/40 border border-border/40 p-4">
                              <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-primary">
                                <Lightbulb className="size-3.5" />
                                Fallback Recommendations
                              </div>
                              <div className="space-y-2">
                                {conflict.fallbackSuggestions.map((suggestion, j) => (
                                  <div key={j} className="flex items-start gap-2.5 rounded-lg bg-background p-2.5 border border-border/30">
                                    <ArrowRight className="size-3.5 mt-0.5 shrink-0 text-accent" />
                                    <span className="text-xs text-foreground/80 leading-relaxed">{suggestion}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="border-border/60">
                <CardContent className="py-16 text-center">
                  <CheckCircle2 className="mx-auto mb-4 size-12 text-accent" />
                  <p className="text-base font-semibold text-foreground">No conflicts detected</p>
                  <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                    All duties for {selectedDate} are properly scheduled without any overlapping
                    assignments, insufficient rest periods, or missing resources.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Fallback Panel */}
          <div className="space-y-4">
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Lightbulb className="size-4 text-primary" />
                  Fallback System
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground leading-relaxed">
                  <p className="font-medium text-foreground mb-2">
                    How fallbacks work:
                  </p>
                  <p>
                    When the ideal scheduling solution cannot be generated, the system
                    automatically suggests alternatives such as reassigning crew, adjusting
                    timing, or flagging for manual intervention.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    Example Fallback Response
                  </h4>
                  <div className="rounded-lg border border-border/50 p-3">
                    <p className="text-xs text-muted-foreground italic mb-2">
                      "No rested crew member is available for Route R-05 at 06:00."
                    </p>
                    <div className="space-y-1.5">
                      {[
                        "Assign another available crew member",
                        "Delay the duty to a later time slot",
                        "Move the duty to another bus",
                        "Flag the route for manual intervention",
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-foreground/80">
                          <CheckCircle2 className="size-3 shrink-0 text-accent" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                  <p className="text-xs text-primary font-medium">
                    ✓ The system never silently creates an invalid assignment.
                    A defined fallback is explicitly provided for conflict scenarios.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Detection Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { icon: Users, label: "Crew double-booking", color: "text-destructive" },
                  { icon: Bus, label: "Bus double-booking", color: "text-chart-4" },
                  { icon: Clock, label: "Insufficient rest", color: "text-primary" },
                  { icon: Route, label: "Route overlap", color: "text-accent" },
                  { icon: AlertTriangle, label: "Time conflicts", color: "text-muted-foreground" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 rounded-lg p-2 hover:bg-muted/30 transition-colors">
                    <item.icon className={`size-4 ${item.color}`} />
                    <span className="text-xs text-foreground/80">{item.label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
