import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Route,
  Users,
  Bus,
  Shield,
  Clock,
  BarChart3,
  ArrowRight,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Play,
  Link2,
  Unlink,
  ShieldAlert,
  ChevronDown,
  Bell,
  AlertCircle,
  Search,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const heroFade = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.3 + i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const features = [
  {
    icon: Route,
    title: "Smart Route Planning",
    description:
      "Create, modify, and visualize bus routes on an interactive map. Draw new routes and compare them against the existing network.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Shield,
    title: "Automatic Conflict Detection",
    description:
      "The system automatically detects route overlaps, crew double-bookings, and scheduling conflicts before deployment.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Users,
    title: "Crew & Bus Scheduling",
    description:
      "Support both linked and unlinked duty assignments with mandatory rest-period validation and smart fallback recommendations.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: BarChart3,
    title: "Operational Dashboard",
    description:
      "A unified view combining route coverage, crew utilization, conflict alerts, and key statistics in real time.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Clock,
    title: "Rest Period Validation",
    description:
      "Automatically checks whether crew members have received the required rest period before confirming assignments.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Zap,
    title: "Fallback Handling",
    description:
      "When the ideal scheduling solution cannot be generated, the system suggests actionable alternatives for resolution.",
    color: "bg-accent/10 text-accent",
  },
];

const stats = [
  { value: "98%", label: "Route coverage" },
  { value: "82%", label: "Crew utilization" },
  { value: "< 1s", label: "Conflict detection" },
  { value: "0", label: "Silent failures" },
];

const workflow = [
  { icon: MapPin, step: "1", label: "Add buses, crew & routes" },
  { icon: Route, step: "2", label: "Draw new routes on the map" },
  { icon: Shield, step: "3", label: "Auto-detect overlaps & conflicts" },
  { icon: Users, step: "4", label: "Assign crews & buses to duties" },
  { icon: CheckCircle2, step: "5", label: "Validate rest periods" },
  { icon: Activity, step: "6", label: "Publish the schedule" },
];

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-background overflow-hidden"
    >
      {/* ── Navbar ─────────────────────────────────────── */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 lg:px-20 py-5 font-body">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Bus className="size-5" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-foreground font-display">BusFlow AI</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</button>
          <button onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</button>
          <button onClick={() => navigate("/auth")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign In</button>
        </div>
        <Button
          onClick={() => navigate("/auth?returnTo=/dashboard")}
          size="sm"
          className="rounded-full px-5 text-sm font-medium"
        >
          Get Started
        </Button>
      </nav>

      {/* ── Hero Section ───────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center" style={{ height: "calc(100vh - 72px)" }}>
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1920' height='1080'%3E%3Crect fill='%23f0f4f8' width='1920' height='1080'/%3E%3C/svg%3E"
          >
            <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center w-full px-6">
          {/* Badge */}
          <motion.div initial="hidden" animate="visible" variants={heroFade} custom={0}>
            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-1.5 text-sm text-muted-foreground font-body">
              <span className="size-1.5 rounded-full bg-accent animate-pulse" />
              Chennai City Bus Control Room
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={heroFade}
            custom={1}
            className="text-center font-display text-5xl md:text-6xl lg:text-[5rem] leading-[0.95] tracking-tight text-foreground max-w-xl"
          >
            The Future of{" "}
            <span className="italic">Smarter</span>{" "}
            Transit Operations
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial="hidden"
            animate="visible"
            variants={heroFade}
            custom={2}
            className="mt-4 text-center text-base md:text-lg text-muted-foreground max-w-[650px] leading-relaxed font-body"
          >
            Plan routes, assign crews, detect conflicts, and publish schedules
            from a single operational picture. No more disconnected spreadsheets.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={heroFade}
            custom={3}
            className="mt-5 flex items-center gap-3"
          >
            <Button
              size="lg"
              onClick={() => navigate("/auth?returnTo=/dashboard")}
              className="rounded-full px-6 py-5 text-sm font-medium font-body gap-2"
            >
              Open Control Room
              <ArrowRight className="size-4" />
            </Button>
            <button
              onClick={() => navigate("/auth")}
              className="h-11 w-11 rounded-full border-0 bg-background shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:bg-background/80 flex items-center justify-center transition-colors"
            >
              <Play className="h-4 w-4 fill-foreground text-foreground" />
            </button>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={heroFade}
            custom={4}
            className="mt-8 w-full max-w-5xl"
          >
            <div
              className="rounded-2xl overflow-hidden p-3 md:p-4"
              style={{
                background: "rgba(255, 255, 255, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.5)",
                boxShadow: "var(--shadow-dashboard)",
              }}
            >
              {/* Dashboard Mockup — BusFlow AI Control Room */}
              <div className="rounded-xl overflow-hidden bg-white border border-border/50 select-none pointer-events-none">
                {/* Top Bar */}
                <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5 bg-background">
                  <div className="flex items-center gap-2">
                    <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-[10px] font-bold">B</div>
                    <span className="text-[11px] font-semibold text-foreground">BusFlow AI</span>
                    <ChevronDown className="size-3 text-muted-foreground" />
                  </div>
                  <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border/50 bg-muted/50 px-3 py-1.5 max-w-xs w-full">
                    <Search className="size-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Search routes, buses, crew...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bell className="size-3.5 text-muted-foreground" />
                    <div className="flex size-6 items-center justify-center rounded-full bg-accent text-accent-foreground text-[9px] font-bold">AI</div>
                  </div>
                </div>

                <div className="flex">
                  {/* Sidebar */}
                  <div className="hidden md:block w-40 border-r border-border/50 bg-muted/20 p-2">
                    <div className="space-y-0.5">
                      {[
                        { label: "Overview", active: true },
                        { label: "Routes", badge: "20" },
                        { label: "Crew", badge: "40" },
                        { label: "Buses", badge: "20" },
                        { label: "Scheduling" },
                        { label: "Conflicts" },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-[10px] ${
                            item.active
                              ? "bg-accent/10 text-accent font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[8px] font-medium">{item.badge}</span>
                          )}
                        </div>
                      ))}
                      <div className="my-1 border-t border-border/30" />
                      <div className="px-2.5 py-1 text-[8px] font-semibold uppercase tracking-wider text-muted-foreground/50">Operations</div>
                      <div className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] text-muted-foreground">
                        <Bell className="size-2.5" /> Emergency
                      </div>
                      <div className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] text-muted-foreground">
                        <AlertCircle className="size-2.5" /> Incidents
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 p-3 bg-secondary/30">
                    <div className="mb-3 text-sm font-semibold text-foreground">Welcome, Operator</div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[
                        { label: "Routes", value: "20", color: "text-accent" },
                        { label: "Active Buses", value: "18", color: "text-green-600" },
                        { label: "On Duty", value: "36", color: "text-accent" },
                        { label: "Conflicts", value: "2", color: "text-red-500" },
                      ].map((s) => (
                        <div key={s.label} className="rounded-lg border border-border/50 bg-card p-2 text-center">
                          <div className={`text-base font-bold ${s.color}`}>{s.value}</div>
                          <div className="text-[8px] text-muted-foreground">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Map + Table Row */}
                    <div className="flex gap-2">
                      {/* Map Preview */}
                      <div className="flex-1 rounded-lg border border-border/50 bg-card overflow-hidden">
                        <div className="p-2 border-b border-border/30">
                          <span className="text-[10px] font-semibold text-foreground">Chennai Network Map</span>
                        </div>
                        <div className="h-24 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center relative">
                          <svg viewBox="0 0 200 80" className="w-full h-full opacity-60">
                            <path d="M20,60 Q40,20 80,35 T140,25 T180,45" fill="none" stroke="hsl(239,84%,67%)" strokeWidth="2" />
                            <path d="M10,40 Q50,10 90,30 T160,20 T190,35" fill="none" stroke="hsl(160,60%,45%)" strokeWidth="2" />
                            <path d="M30,70 Q60,30 100,50 T150,35 T190,55" fill="none" stroke="hsl(38,92%,50%)" strokeWidth="2" />
                            <circle cx="80" cy="35" r="3" fill="hsl(239,84%,67%)" />
                            <circle cx="140" cy="25" r="3" fill="hsl(239,84%,67%)" />
                            <circle cx="90" cy="30" r="3" fill="hsl(160,60%,45%)" />
                            <circle cx="100" cy="50" r="3" fill="hsl(38,92%,50%)" />
                          </svg>
                        </div>
                      </div>

                      {/* Recent Table */}
                      <div className="flex-1 rounded-lg border border-border/50 bg-card overflow-hidden">
                        <div className="p-2 border-b border-border/30">
                          <span className="text-[10px] font-semibold text-foreground">Route + Schedule View</span>
                        </div>
                        <div className="p-1.5">
                          <table className="w-full text-[9px]">
                            <thead>
                              <tr className="border-b border-border/30">
                                <th className="text-left py-1 text-muted-foreground font-medium">Route</th>
                                <th className="text-left py-1 text-muted-foreground font-medium">Bus</th>
                                <th className="text-left py-1 text-muted-foreground font-medium">Link</th>
                                <th className="text-left py-1 text-muted-foreground font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[
                                { route: "21G", bus: "Bus 001", link: "linked", status: "On Time" },
                                { route: "29C", bus: "Bus 002", link: "linked", status: "On Time" },
                                { route: "51", bus: "Bus 003", link: "partial", status: "Delayed" },
                                { route: "60A", bus: "Bus 004", link: "linked", status: "On Time" },
                              ].map((r) => (
                                <tr key={r.route} className="border-b border-border/20">
                                  <td className="py-1 font-bold text-accent">{r.route}</td>
                                  <td className="py-1 text-foreground/80">{r.bus}</td>
                                  <td className="py-1">
                                    <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[7px] font-medium ${
                                      r.link === "linked" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                                    }`}>
                                      {r.link === "linked" ? <Link2 className="size-1.5" /> : <AlertTriangle className="size-1.5" />}
                                      {r.link === "linked" ? "LINKED" : "PARTIAL"}
                                    </span>
                                  </td>
                                  <td className="py-1 text-foreground/80">{r.status}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats Bar ──────────────────────────────────── */}
      <section className="border-t border-border/40 bg-muted/30 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border/50 bg-card/80 px-4 py-5 text-center backdrop-blur-sm"
              >
                <div className="text-2xl font-bold text-foreground font-display">{stat.value}</div>
                <div className="mt-1 text-xs font-medium text-muted-foreground font-body">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Workflow Section ────────────────────────────── */}
      <section className="border-t border-border/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={0}
            className="text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground font-display">
              Complete operational workflow
            </h2>
            <p className="mt-3 text-muted-foreground font-body">
              From route creation to schedule publication in six clear steps
            </p>
          </motion.div>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {workflow.map((item, i) => (
              <motion.div
                key={item.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                custom={i + 1}
                className="group relative flex flex-col items-center rounded-xl border border-border/50 bg-card p-5 text-center transition-all hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5"
              >
                <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <item.icon className="size-5" />
                </div>
                <span className="mb-1 text-xs font-bold text-accent">Step {item.step}</span>
                <span className="text-xs font-medium text-foreground/80 leading-snug font-body">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ───────────────────────────────── */}
      <section className="border-t border-border/40 bg-muted/20 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={0}
            className="text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground font-display">
              Built for transport operators
            </h2>
            <p className="mt-3 text-muted-foreground font-body">
              Every feature designed to solve real challenges in city bus operations
            </p>
          </motion.div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                custom={i + 1}
                className="group rounded-2xl border border-border/50 bg-card p-6 transition-all hover:border-accent/20 hover:shadow-xl hover:shadow-accent/[0.03]"
              >
                <div className={`mb-4 flex size-11 items-center justify-center rounded-xl ${feature.color}`}>
                  <feature.icon className="size-5" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground font-body">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground font-body">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem Statement Banner ─────────────────────── */}
      <section className="border-t border-border/40 py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <AlertTriangle className="mx-auto mb-4 size-8 text-chart-4" />
            <h2 className="text-3xl font-bold tracking-tight text-foreground font-display">
              No more operational blind spots
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground leading-relaxed font-body">
              When route planning, crew scheduling, and bus assignment happen in separate
              systems, planners overlook conflicts and create schedules that are inefficient
              or operationally impossible. BusFlow AI connects everything.
            </p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="mt-8 flex justify-center"
          >
            <Button
              size="lg"
              onClick={() => navigate("/auth?returnTo=/dashboard")}
              className="rounded-full gap-2 px-8 text-sm font-semibold"
            >
              Open Control Room
              <ArrowRight className="size-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-border/40 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bus className="size-3.5" />
            </div>
            <span className="text-sm font-bold text-foreground font-display">BusFlow AI</span>
          </div>
          <p className="text-xs text-muted-foreground font-body">
            Smart Scheduling and Route Management for City Bus Networks
          </p>
        </div>
      </footer>
    </motion.div>
  );
}
