import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

// Duty assignment modes
export const DUTY_MODES = {
  LINKED: "linked",
  UNLINKED: "unlinked",
} as const;

export const dutyModeValidator = v.union(
  v.literal(DUTY_MODES.LINKED),
  v.literal(DUTY_MODES.UNLINKED),
);

// Route status
export const ROUTE_STATUS = {
  ACTIVE: "active",
  PROPOSED: "proposed",
  INACTIVE: "inactive",
} as const;

export const routeStatusValidator = v.union(
  v.literal(ROUTE_STATUS.ACTIVE),
  v.literal(ROUTE_STATUS.PROPOSED),
  v.literal(ROUTE_STATUS.INACTIVE),
);

// Bus status
export const BUS_STATUS = {
  AVAILABLE: "available",
  ON_ROUTE: "on_route",
  MAINTENANCE: "maintenance",
  OFF_DUTY: "off_duty",
} as const;

export const busStatusValidator = v.union(
  v.literal(BUS_STATUS.AVAILABLE),
  v.literal(BUS_STATUS.ON_ROUTE),
  v.literal(BUS_STATUS.MAINTENANCE),
  v.literal(BUS_STATUS.OFF_DUTY),
);

// Crew availability
export const CREW_AVAILABILITY = {
  AVAILABLE: "available",
  ON_DUTY: "on_duty",
  RESTING: "resting",
  OFF_DUTY: "off_duty",
} as const;

export const crewAvailabilityValidator = v.union(
  v.literal(CREW_AVAILABILITY.AVAILABLE),
  v.literal(CREW_AVAILABILITY.ON_DUTY),
  v.literal(CREW_AVAILABILITY.RESTING),
  v.literal(CREW_AVAILABILITY.OFF_DUTY),
);

// Duty status
export const DUTY_STATUS = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export const dutyStatusValidator = v.union(
  v.literal(DUTY_STATUS.SCHEDULED),
  v.literal(DUTY_STATUS.IN_PROGRESS),
  v.literal(DUTY_STATUS.COMPLETED),
  v.literal(DUTY_STATUS.CANCELLED),
);

// Conflict severity
export const CONFLICT_SEVERITY = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
} as const;

export const conflictSeverityValidator = v.union(
  v.literal(CONFLICT_SEVERITY.HIGH),
  v.literal(CONFLICT_SEVERITY.MEDIUM),
  v.literal(CONFLICT_SEVERITY.LOW),
);

// Conflict status
export const CONFLICT_STATUS = {
  OPEN: "open",
  RESOLVED: "resolved",
  IGNORED: "ignored",
} as const;

export const conflictStatusValidator = v.union(
  v.literal(CONFLICT_STATUS.OPEN),
  v.literal(CONFLICT_STATUS.RESOLVED),
  v.literal(CONFLICT_STATUS.IGNORED),
);

const schema = defineSchema(
  {
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
    }).index("email", ["email"]),

    // Bus routes
    routes: defineTable({
      routeId: v.string(), // e.g. "R-01"
      name: v.string(), // e.g. "Downtown Express"
      startPoint: v.string(),
      endPoint: v.string(),
      stops: v.array(v.string()),
      estimatedTravelTime: v.number(), // minutes
      operatingHours: v.object({
        start: v.string(), // "06:00"
        end: v.string(),   // "22:00"
      }),
      assignedBus: v.optional(v.string()),
      assignedCrew: v.optional(v.string()),
      status: routeStatusValidator,
      coordinates: v.array(v.object({
        lat: v.number(),
        lng: v.number(),
      })),
      overlapPercentage: v.optional(v.number()),
      createdBy: v.optional(v.string()),
    })
      .index("by_routeId", ["routeId"])
      .index("by_status", ["status"]),

    // Crew members
    crew: defineTable({
      crewId: v.string(), // e.g. "C-104"
      name: v.string(),
      role: v.string(), // Driver, Conductor, etc.
      assignedDepot: v.string(),
      availability: crewAvailabilityValidator,
      dutyStartTime: v.optional(v.string()), // "06:00"
      dutyEndTime: v.optional(v.string()),   // "14:00"
      lastCompletedDuty: v.optional(v.number()), // timestamp
      requiredRestPeriod: v.number(), // hours, default 8
      currentAssignment: v.optional(v.string()),
      phone: v.optional(v.string()),
    })
      .index("by_crewId", ["crewId"])
      .index("by_availability", ["availability"]),

    // Buses
    buses: defineTable({
      busId: v.string(), // e.g. "B-001"
      capacity: v.number(),
      currentStatus: busStatusValidator,
      assignedRoute: v.optional(v.string()),
      assignedDuty: v.optional(v.string()),
      availabilityTime: v.optional(v.string()),
      maintenanceStatus: v.optional(v.string()),
      depot: v.string(),
      lastMaintenance: v.optional(v.number()),
    })
      .index("by_busId", ["busId"])
      .index("by_status", ["currentStatus"]),

    // Duties (assignments)
    duties: defineTable({
      routeId: v.string(),
      busId: v.optional(v.string()),
      crewId: v.optional(v.string()),
      startTime: v.string(), // "06:00"
      endTime: v.string(),   // "14:00"
      mode: dutyModeValidator,
      status: dutyStatusValidator,
      date: v.string(), // "2026-09-01"
      notes: v.optional(v.string()),
    })
      .index("by_route", ["routeId"])
      .index("by_crew", ["crewId"])
      .index("by_bus", ["busId"])
      .index("by_date", ["date"]),

    // Conflicts detected
    conflicts: defineTable({
      type: v.string(), // "route_overlap", "crew_double_booking", "bus_double_booking", "insufficient_rest", "time_conflict"
      description: v.string(),
      severity: conflictSeverityValidator,
      relatedRoutes: v.array(v.string()),
      relatedDuties: v.array(v.id("duties")),
      status: conflictStatusValidator,
      fallbackSuggestions: v.array(v.string()),
      detectedAt: v.number(),
    })
      .index("by_status", ["status"])
      .index("by_severity", ["severity"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
