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

    // ── Routes (20 Chennai MTC routes — unchanged) ──────────────────────
    routes: defineTable({
      routeId: v.string(),
      name: v.string(),
      startPoint: v.string(),
      endPoint: v.string(),
      stops: v.array(v.string()),
      estimatedTravelTime: v.number(),
      estimatedDistance: v.optional(v.number()),
      routeType: v.optional(v.string()),
      passengerLoad: v.optional(v.string()),
      busCount: v.optional(v.number()),
      operatingHours: v.object({ start: v.string(), end: v.string() }),
      assignedBus: v.optional(v.string()),
      assignedCrew: v.optional(v.string()),
      status: routeStatusValidator,
      coordinates: v.array(v.object({ lat: v.number(), lng: v.number() })),
      overlapPercentage: v.optional(v.number()),
      createdBy: v.optional(v.string()),
    })
      .index("by_routeId", ["routeId"])
      .index("by_status", ["status"]),

    // ── Crew (40 members — 20 drivers + 20 conductors) ─────────────────
    crew: defineTable({
      crewId: v.string(),
      name: v.string(),
      gender: v.string(),
      age: v.number(),
      role: v.string(),
      phone: v.optional(v.string()),
      employeeId: v.string(),
      licenseNumber: v.optional(v.string()),
      licenseClass: v.optional(v.string()),
      yearsOfExperience: v.optional(v.number()),
      assignedBus: v.optional(v.string()),
      assignedRoute: v.optional(v.string()),
      shift: v.string(),
      dutyStatus: v.string(),
      joiningDate: v.string(),
      currentLocation: v.optional(v.string()),
      attendanceStatus: v.optional(v.string()),
      safetyStatus: v.optional(v.string()),
      emergencyContactName: v.optional(v.string()),
      emergencyContactPhone: v.optional(v.string()),
      notes: v.optional(v.string()),
    })
      .index("by_crewId", ["crewId"])
      .index("by_role", ["role"])
      .index("by_bus", ["assignedBus"]),

    // ── Buses (20 Chennai MTC fleet) ────────────────────────────────────
    buses: defineTable({
      busId: v.string(),
      registrationNumber: v.string(),
      routeId: v.string(),
      origin: v.string(),
      destination: v.string(),
      busType: v.string(),
      capacity: v.number(),
      currentStatus: busStatusValidator,
      assignedDriver: v.optional(v.string()),
      assignedConductor: v.optional(v.string()),
      currentLocation: v.optional(v.string()),
      fuelLevel: v.number(),
      lastMaintenance: v.optional(v.string()),
      nextMaintenance: v.optional(v.string()),
      mileage: v.optional(v.number()),
      operatingHours: v.optional(v.string()),
      lastInspection: v.optional(v.string()),
      notes: v.optional(v.string()),
    })
      .index("by_busId", ["busId"])
      .index("by_status", ["currentStatus"])
      .index("by_route", ["routeId"]),

    // ── Schedules (daily operating schedules) ────────────────────────────
    schedules: defineTable({
      scheduleId: v.string(),
      busId: v.string(),
      routeId: v.string(),
      driverId: v.string(),
      conductorId: v.string(),
      startTime: v.string(),
      endTime: v.string(),
      shift: v.string(),
      breakTime: v.string(),
      departureFrequency: v.string(),
      scheduledTrips: v.number(),
      status: v.string(),
      delayMinutes: v.number(),
      notes: v.optional(v.string()),
    })
      .index("by_bus", ["busId"])
      .index("by_route", ["routeId"]),

    // ── Conflicts (schedule + operational conflicts) ─────────────────────
    conflicts: defineTable({
      conflictId: v.string(),
      category: v.string(),
      conflictType: v.string(),
      severity: v.string(),
      busId: v.optional(v.string()),
      routeId: v.optional(v.string()),
      crewMember: v.optional(v.string()),
      scheduleId: v.optional(v.string()),
      bus2Id: v.optional(v.string()),
      location: v.optional(v.string()),
      detectedTime: v.string(),
      description: v.string(),
      impact: v.optional(v.string()),
      recommendedAction: v.optional(v.string()),
      status: v.string(),
    })
      .index("by_category", ["category"])
      .index("by_severity", ["severity"])
      .index("by_status", ["status"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
