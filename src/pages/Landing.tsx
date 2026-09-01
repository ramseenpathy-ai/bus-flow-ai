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
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const features = [
  {
    icon: Route,
    title: "Smart Route Planning",
    description:
      "Create, modify, and visualize bus routes on an interactive map. Draw new routes and compare them against the existing network.",
    color: "bg-primary/10 text-primary",
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
    color: "bg-chart-3/10 text-chart-3",
  },
  {
    icon: BarChart3,
    title: "Operational Dashboard",
    description:
      "A unified view combining route coverage, crew utilization, conflict alerts, and key statistics in real time.",
    color: "bg-chart-4/10 text-chart-4",
  },
  {
    icon: Clock,
    title: "Rest Period Validation",
    description:
      "Automatically checks whether crew members have received the required rest period before confirming assignments.",
    color: "bg-chart-5/10 text-chart-5",
  },
  {
    icon: Zap,
    title: "Fallback Handling",
    description:
      "When the ideal scheduling solution cannot be generated, the system suggests actionable alternatives for resolution.",
    color: "bg-primary/10 text-primary",
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
      className="min-h-screen bg-background"
    >
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Bus className="size-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">BusFlow AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
              className="text-sm font-medium"
            >
              {isAuthenticated ? "Dashboard" : "Sign In"}
            </Button>
            <Button
              onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth?returnTo=/dashboard")}
              size="sm"
              className="gap-1.5 text-sm font-medium"
            >
              Get Started
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent" />
        <div className="absolute top-20 right-1/4 size-72 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute top-40 left-1/4 size-96 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-24 text-center lg:pt-28 lg:pb-32">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-accent animate-pulse" />
              Smart Scheduling & Route Management
            </div>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            One intelligent workspace for{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              city bus operations
            </span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Plan routes, assign crews, detect conflicts, and publish schedules
            from a single operational picture. No more disconnected spreadsheets.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button
              size="lg"
              onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth?returnTo=/dashboard")}
              className="gap-2 px-8 text-sm font-semibold shadow-lg shadow-primary/20"
            >
              Launch Dashboard
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="gap-2 px-8 text-sm font-medium"
            >
              Sign In
            </Button>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={4}
            className="mx-auto mt-16 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border/50 bg-card/60 px-4 py-4 backdrop-blur-sm"
              >
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="mt-1 text-xs font-medium text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="border-t border-border/40 bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={0}
            className="text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Complete operational workflow
            </h2>
            <p className="mt-3 text-muted-foreground">
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
                className="group relative flex flex-col items-center rounded-xl border border-border/50 bg-card p-5 text-center transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <item.icon className="size-5" />
                </div>
                <span className="mb-1 text-xs font-bold text-primary">Step {item.step}</span>
                <span className="text-xs font-medium text-foreground/80 leading-snug">
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={0}
            className="text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Built for transport operators
            </h2>
            <p className="mt-3 text-muted-foreground">
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
                className="group rounded-2xl border border-border/50 bg-card p-6 transition-all hover:border-primary/20 hover:shadow-xl hover:shadow-primary/[0.03]"
              >
                <div className={`mb-4 flex size-11 items-center justify-center rounded-xl ${feature.color}`}>
                  <feature.icon className="size-5" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Statement Banner */}
      <section className="border-t border-border/40 bg-gradient-to-b from-primary/[0.03] to-transparent py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <AlertTriangle className="mx-auto mb-4 size-8 text-chart-4" />
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              No more operational blind spots
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground leading-relaxed">
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
              onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth?returnTo=/dashboard")}
              className="gap-2 px-8 text-sm font-semibold shadow-lg shadow-primary/20"
            >
              See it in action
              <ArrowRight className="size-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bus className="size-3.5" />
            </div>
            <span className="text-sm font-bold text-foreground">BusFlow AI</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Smart Scheduling and Route Management for City Bus Networks
          </p>
        </div>
      </footer>
    </motion.div>
  );
}
