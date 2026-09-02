import { useState, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogoDropdown } from "@/components/LogoDropdown";
import {
  LayoutDashboard,
  Route,
  Users,
  Bus,
  CalendarClock,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  Bell,
  AlertCircle,
  ChevronDown,
  Search,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
  { icon: Route, label: "Routes", path: "/dashboard/routes" },
  { icon: Users, label: "Crew", path: "/dashboard/crew" },
  { icon: Bus, label: "Buses", path: "/dashboard/buses" },
  { icon: CalendarClock, label: "Scheduling", path: "/dashboard/scheduling" },
  { icon: ShieldAlert, label: "Conflicts", path: "/dashboard/conflicts" },
];

const emergencyNavItems = [
  { icon: Bell, label: "Emergency Alerts", path: "/dashboard/emergency" },
  { icon: AlertCircle, label: "Incident Reporting", path: "/dashboard/incidents" },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-background font-body">
      {/* Desktop Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground lg:flex">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5">
          <LogoDropdown />
          <div>
            <div className="text-sm font-bold tracking-tight font-display">BusFlow AI</div>
            <div className="text-[10px] font-medium text-sidebar-foreground/50">
              Control Room
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 mb-2">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
            <Search className="size-3.5 shrink-0" />
            <span className="truncate">Search...</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 px-3 py-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                isActive(item.path)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </button>
          ))}
          <div className="my-2 border-t border-sidebar-border/40" />
          <div className="px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">Operations</div>
          {emergencyNavItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                isActive(item.path)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* User & Sign Out */}
        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3 text-[10px] text-sidebar-foreground/40">
            Signed in as{" "}
            <span className="font-medium text-sidebar-foreground/70">
              {user?.name || user?.email || "User"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start gap-2 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <LogOut className="size-3.5" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex flex-1 flex-col lg:hidden">
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="size-9"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Bus className="size-3.5" />
              </div>
              <span className="text-sm font-bold font-display">BusFlow AI</span>
            </div>
          </div>
          <LogoDropdown />
        </header>

        {mobileOpen && (
          <div className="border-b border-border bg-card px-4 py-2 max-h-[70vh] overflow-y-auto">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive(item.path) ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </button>
            ))}
            <div className="my-1 border-t border-border/40" />
            <div className="px-3 py-1 text-[10px] font-semibold uppercase text-muted-foreground/50">Operations</div>
            {emergencyNavItems.map((item) => (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive(item.path) ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </button>
            ))}
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>

      {/* Desktop Content */}
      <main className="hidden flex-1 overflow-y-auto p-6 lg:block">{children}</main>
    </div>
  );
}
