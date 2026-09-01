import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ── Verify current database state ─────────────────────────────────────────
export const verify = query({
  args: {},
  handler: async (ctx) => {
    const routes = (await ctx.db.query("routes").collect()).length;
    const crew = (await ctx.db.query("crew").collect()).length;
    const buses = (await ctx.db.query("buses").collect()).length;
    const schedules = (await ctx.db.query("schedules").collect()).length;
    const conflicts = (await ctx.db.query("conflicts").collect()).length;
    return { routes, crew, buses, schedules, conflicts };
  },
});

// ── Full migration: wipe old data, insert everything ───────────────────────
export const migrate = mutation({
  args: {},
  handler: async (ctx) => {
    // Helper: delete all docs in a table
    async function clearTable(table: string) {
      const all = await ctx.db.query(table as any).collect();
      for (const doc of all) await ctx.db.delete(doc._id);
    }

    // Clear tables that will be re-populated
    await clearTable("crew");
    await clearTable("buses");
    await clearTable("schedules");
    await clearTable("conflicts");

    // ── 20 BUSES ─────────────────────────────────────────────────────────
    const busData = [
      { busId: "Bus 001", registrationNumber: "TN-01-AB-0001", routeId: "21G", origin: "Tambaram", destination: "Broadway", busType: "Ordinary", capacity: 50, currentStatus: "on_route" as const, fuelLevel: 78, mileage: 142300, notes: "" },
      { busId: "Bus 002", registrationNumber: "TN-01-AB-0002", routeId: "29C", origin: "Perambur", destination: "Besant Nagar", busType: "Ordinary", capacity: 50, currentStatus: "on_route" as const, fuelLevel: 65, mileage: 128900, notes: "" },
      { busId: "Bus 003", registrationNumber: "TN-01-AB-0003", routeId: "51", origin: "Tambaram", destination: "Velachery", busType: "Ordinary", capacity: 45, currentStatus: "available" as const, fuelLevel: 92, mileage: 98400, notes: "" },
      { busId: "Bus 004", registrationNumber: "TN-01-AB-0004", routeId: "60A", origin: "Royapuram", destination: "Kundrathur", busType: "Ordinary", capacity: 50, currentStatus: "on_route" as const, fuelLevel: 55, mileage: 156200, notes: "" },
      { busId: "Bus 005", registrationNumber: "TN-01-AC-0005", routeId: "102", origin: "Island Ground", destination: "Kelambakkam", busType: "Express", capacity: 45, currentStatus: "on_route" as const, fuelLevel: 42, mileage: 178300, notes: "" },
      { busId: "Bus 006", registrationNumber: "TN-01-AC-0006", routeId: "M70", origin: "Thiruvanmiyur", destination: "Koyambedu", busType: "M-Series Express", capacity: 45, currentStatus: "maintenance" as const, fuelLevel: 30, mileage: 201500, notes: "Engine overhaul scheduled" },
      { busId: "Bus 007", registrationNumber: "TN-01-AC-0007", routeId: "E18", origin: "Tambaram", destination: "Broadway", busType: "Express", capacity: 45, currentStatus: "on_route" as const, fuelLevel: 70, mileage: 134600, notes: "" },
      { busId: "Bus 008", registrationNumber: "TN-01-AD-0008", routeId: "147B", origin: "Mogappair West", destination: "T. Nagar", busType: "Ordinary", capacity: 40, currentStatus: "available" as const, fuelLevel: 88, mileage: 87200, notes: "" },
      { busId: "Bus 009", registrationNumber: "TN-01-AD-0009", routeId: "147C", origin: "T. Nagar", destination: "Ambattur OT", busType: "Ordinary", capacity: 40, currentStatus: "on_route" as const, fuelLevel: 60, mileage: 112400, notes: "" },
      { busId: "Bus 010", registrationNumber: "TN-01-AD-0010", routeId: "57F", origin: "Broadway", destination: "Karanodai", busType: "Ordinary", capacity: 45, currentStatus: "off_duty" as const, fuelLevel: 45, mileage: 165800, notes: "Retiring end of month" },
      { busId: "Bus 011", registrationNumber: "TN-01-AE-0011", routeId: "64C", origin: "Manali", destination: "Broadway", busType: "Ordinary", capacity: 45, currentStatus: "on_route" as const, fuelLevel: 72, mileage: 119300, notes: "" },
      { busId: "Bus 012", registrationNumber: "TN-01-AE-0012", routeId: "95", origin: "Tambaram", destination: "Thiruvanmiyur", busType: "Ordinary", capacity: 45, currentStatus: "available" as const, fuelLevel: 95, mileage: 76800, notes: "" },
      { busId: "Bus 013", registrationNumber: "TN-01-AE-0013", routeId: "99", origin: "Tambaram", destination: "Adyar", busType: "Ordinary", capacity: 50, currentStatus: "maintenance" as const, fuelLevel: 50, mileage: 189200, notes: "Tyre replacement pending" },
      { busId: "Bus 014", registrationNumber: "TN-01-AF-0014", routeId: "101", origin: "Poonamallee", destination: "Thiruvotriyur", busType: "Ordinary", capacity: 50, currentStatus: "on_route" as const, fuelLevel: 58, mileage: 143700, notes: "" },
      { busId: "Bus 015", registrationNumber: "TN-01-AF-0015", routeId: "121F", origin: "Tambaram", destination: "Kannagi Nagar", busType: "Ordinary", capacity: 45, currentStatus: "available" as const, fuelLevel: 82, mileage: 92100, notes: "" },
      { busId: "Bus 016", registrationNumber: "TN-01-AF-0016", routeId: "25G", origin: "Poonamallee", destination: "Kodambakkam", busType: "Ordinary", capacity: 40, currentStatus: "on_route" as const, fuelLevel: 68, mileage: 108500, notes: "" },
      { busId: "Bus 017", registrationNumber: "TN-01-AG-0017", routeId: "28", origin: "Egmore", destination: "Thiruvotriyur", busType: "Ordinary", capacity: 50, currentStatus: "maintenance" as const, fuelLevel: 20, mileage: 210400, notes: "AC unit replacement" },
      { busId: "Bus 018", registrationNumber: "TN-01-AG-0018", routeId: "D70", origin: "Velachery", destination: "Ambattur Industrial Estate", busType: "Deluxe", capacity: 40, currentStatus: "off_duty" as const, fuelLevel: 35, mileage: 195600, notes: "Pending fitness certificate" },
      { busId: "Bus 019", registrationNumber: "TN-01-AG-0019", routeId: "M1", origin: "Keelkattalai", destination: "Thiruvanmiyur", busType: "M-Series", capacity: 40, currentStatus: "available" as const, fuelLevel: 90, mileage: 65400, notes: "" },
      { busId: "Bus 020", registrationNumber: "TN-01-AH-0020", routeId: "588", origin: "Adyar", destination: "Mamallapuram", busType: "Express", capacity: 45, currentStatus: "on_route" as const, fuelLevel: 62, mileage: 152800, notes: "" },
    ];

    for (const b of busData) {
      await ctx.db.insert("buses", {
        ...b,
        assignedDriver: undefined,
        assignedConductor: undefined,
        currentLocation: b.origin,
        lastMaintenance: undefined,
        nextMaintenance: undefined,
        operatingHours: "06:00–22:00",
        lastInspection: undefined,
      });
    }

    // ── 40 CREW — 20 Drivers + 20 Conductors ────────────────────────────
    const driverNames = [
      "Arul", "Karthik", "Suresh", "Murugan", "Prakash",
      "Senthil", "Vignesh", "Dinesh", "Rajesh", "Saravanan",
      "Manikandan", "Gokul", "Balaji", "Naveen", "Ramesh",
      "Arun", "Vijay", "Bharath", "Santhosh", "Ashwin",
    ];
    const conductorNames = [
      "Kumar", "Siva", "Mohan", "Ajith", "Hari",
      "Kannan", "Pradeep", "Anand", "Shankar", "Surya",
      "Muthu", "Ilango", "Jegan", "Vinoth", "Tamilselvan",
      "Selvam", "Devaraj", "Kathir", "Jeeva", "Nataraj",
    ];
    const lastNames = ["", "", "", "", "", "", "", "", "", ""];
    const shifts = ["Morning", "Morning", "Morning", "Afternoon", "Afternoon", "Evening", "Evening", "Morning", "Morning", "Afternoon", "Afternoon", "Evening", "Morning", "Morning", "Afternoon", "Afternoon", "Evening", "Evening", "Morning", "Morning"];
    const statuses = ["on_duty", "on_duty", "on_duty", "on_duty", "on_duty", "on_duty", "on_duty", "available", "available", "on_duty", "on_duty", "available", "available", "on_duty", "on_duty", "on_duty", "available", "off_duty", "available", "on_duty"];
    const attendance = ["Present", "Present", "Present", "Present", "Present", "Present", "Present", "Present", "Present", "Present", "Present", "Present", "Present", "Present", "Present", "Present", "Present", "Absent", "Present", "Present"];
    const safety = ["Certified", "Certified", "Certified", "Certified", "Certified", "Certified", "Certified", "Certified", "Due", "Certified", "Certified", "Certified", "Certified", "Certified", "Certified", "Certified", "Certified", "Due", "Certified", "Certified"];
    const emergencyNames = ["Meena", "Lakshmi", "Kavitha", "Priya", "Revathi", "Sumathi", "Geetha", "Saroja", "Vasantha", "Kamala", "Rajini", "Deepa", "Parvathi", "Latha", "Uma", "Thilagavathi", "Jeyanthi", "Shanthi", "Malathi", "Amudha"];
    const emergencyPhones = ["98401-20001", "98401-20002", "98401-20003", "98401-20004", "98401-20005", "98401-20006", "98401-20007", "98401-20008", "98401-20009", "98401-20010", "98401-20011", "98401-20012", "98401-20013", "98401-20014", "98401-20015", "98401-20016", "98401-20017", "98401-20018", "98401-20019", "98401-20020"];
    const licenseClasses = ["HV", "HV", "HV", "HV", "HV", "HV", "HV", "HV", "HV", "HV", "HV", "HV", "HV", "HV", "HV", "HV", "HV", "HV", "HV", "HV"];
    const expYears = [15, 12, 18, 8, 10, 14, 7, 11, 16, 9, 13, 6, 20, 8, 12, 15, 5, 17, 10, 11];
    const ages = [45, 38, 48, 30, 35, 42, 28, 37, 46, 32, 40, 27, 50, 31, 39, 44, 26, 47, 34, 36];
    const joiningDates = ["2010-03-15", "2012-07-20", "2008-01-10", "2018-06-05", "2015-09-12", "2011-02-28", "2019-04-18", "2013-11-22", "2009-08-01", "2016-12-14", "2012-05-30", "2020-01-08", "2006-11-25", "2017-03-16", "2013-08-09", "2011-06-21", "2021-02-14", "2008-04-03", "2014-10-27", "2013-01-19"];

    // Drivers
    for (let i = 0; i < 20; i++) {
      const bus = busData[i];
      await ctx.db.insert("crew", {
        crewId: `DRV-${String(i + 1).padStart(3, "0")}`,
        name: driverNames[i],
        gender: "Male",
        age: ages[i],
        role: "Driver",
        phone: `98401-${10001 + i}`,
        employeeId: `MTC-DRV-${String(2001 + i).padStart(4, "0")}`,
        licenseNumber: `TN${bus.registrationNumber.slice(3, 6)}${1000 + i}`,
        licenseClass: licenseClasses[i],
        yearsOfExperience: expYears[i],
        assignedBus: bus.busId,
        assignedRoute: bus.routeId,
        shift: shifts[i],
        dutyStatus: statuses[i],
        joiningDate: joiningDates[i],
        currentLocation: bus.origin,
        attendanceStatus: attendance[i],
        safetyStatus: safety[i],
        emergencyContactName: emergencyNames[i],
        emergencyContactPhone: emergencyPhones[i],
        notes: "",
      });
    }

    // Conductors
    for (let i = 0; i < 20; i++) {
      const bus = busData[i];
      await ctx.db.insert("crew", {
        crewId: `CON-${String(i + 1).padStart(3, "0")}`,
        name: conductorNames[i],
        gender: "Male",
        age: ages[(i + 3) % 20],
        role: "Conductor",
        phone: `98401-${20001 + i}`,
        employeeId: `MTC-CON-${String(3001 + i).padStart(4, "0")}`,
        licenseNumber: undefined,
        licenseClass: undefined,
        yearsOfExperience: expYears[(i + 5) % 20],
        assignedBus: bus.busId,
        assignedRoute: bus.routeId,
        shift: shifts[(i + 2) % 20],
        dutyStatus: statuses[(i + 7) % 20],
        joiningDate: joiningDates[(i + 4) % 20],
        currentLocation: bus.origin,
        attendanceStatus: attendance[(i + 6) % 20],
        safetyStatus: safety[(i + 8) % 20],
        emergencyContactName: emergencyNames[(i + 10) % 20],
        emergencyContactPhone: emergencyPhones[(i + 10) % 20],
        notes: "",
      });
    }

    // ── 20 SCHEDULES ─────────────────────────────────────────────────────
    const scheduleData = [
      { busId: "Bus 001", routeId: "21G", shift: "Morning", start: "05:30", end: "14:00", breakTime: "09:30–10:00", freq: "15 min", trips: 8, delay: 0 },
      { busId: "Bus 002", routeId: "29C", shift: "Morning", start: "06:00", end: "14:30", breakTime: "10:00–10:30", freq: "20 min", trips: 7, delay: 5 },
      { busId: "Bus 003", routeId: "51", shift: "Morning", start: "05:45", end: "13:45", breakTime: "09:15–09:45", freq: "20 min", trips: 7, delay: 0 },
      { busId: "Bus 004", routeId: "60A", shift: "Morning", start: "05:15", end: "14:15", breakTime: "09:45–10:15", freq: "25 min", trips: 6, delay: 12 },
      { busId: "Bus 005", routeId: "102", shift: "Morning", start: "06:00", end: "14:30", breakTime: "10:00–10:30", freq: "30 min", trips: 5, delay: 0 },
      { busId: "Bus 006", routeId: "M70", shift: "Morning", start: "05:30", end: "13:30", breakTime: "09:00–09:30", freq: "20 min", trips: 7, delay: 0 },
      { busId: "Bus 007", routeId: "E18", shift: "Morning", start: "05:45", end: "14:15", breakTime: "10:00–10:30", freq: "25 min", trips: 6, delay: 8 },
      { busId: "Bus 008", routeId: "147B", shift: "Morning", start: "06:00", end: "14:00", breakTime: "09:30–10:00", freq: "15 min", trips: 8, delay: 0 },
      { busId: "Bus 009", routeId: "147C", shift: "Morning", start: "05:30", end: "13:30", breakTime: "09:00–09:30", freq: "20 min", trips: 7, delay: 10 },
      { busId: "Bus 010", routeId: "57F", shift: "Morning", start: "05:15", end: "14:15", breakTime: "09:45–10:15", freq: "30 min", trips: 5, delay: 0 },
      { busId: "Bus 011", routeId: "64C", shift: "Morning", start: "05:45", end: "13:45", breakTime: "09:15–09:45", freq: "20 min", trips: 7, delay: 3 },
      { busId: "Bus 012", routeId: "95", shift: "Morning", start: "06:00", end: "14:00", breakTime: "09:30–10:00", freq: "25 min", trips: 6, delay: 0 },
      { busId: "Bus 013", routeId: "99", shift: "Morning", start: "05:30", end: "14:00", breakTime: "09:30–10:00", freq: "20 min", trips: 7, delay: 0 },
      { busId: "Bus 014", routeId: "101", shift: "Morning", start: "05:00", end: "14:00", breakTime: "09:30–10:00", freq: "30 min", trips: 5, delay: 15 },
      { busId: "Bus 015", routeId: "121F", shift: "Morning", start: "05:30", end: "13:30", breakTime: "09:00–09:30", freq: "25 min", trips: 6, delay: 0 },
      { busId: "Bus 016", routeId: "25G", shift: "Morning", start: "06:00", end: "14:00", breakTime: "09:30–10:00", freq: "15 min", trips: 8, delay: 0 },
      { busId: "Bus 017", routeId: "28", shift: "Morning", start: "05:45", end: "13:45", breakTime: "09:15–09:45", freq: "20 min", trips: 7, delay: 0 },
      { busId: "Bus 018", routeId: "D70", shift: "Morning", start: "06:00", end: "14:30", breakTime: "10:00–10:30", freq: "30 min", trips: 5, delay: 0 },
      { busId: "Bus 019", routeId: "M1", shift: "Morning", start: "05:30", end: "13:00", breakTime: "09:00–09:30", freq: "15 min", trips: 8, delay: 0 },
      { busId: "Bus 020", routeId: "588", shift: "Morning", start: "05:45", end: "14:15", breakTime: "09:45–10:15", freq: "30 min", trips: 5, delay: 7 },
    ];

    for (let i = 0; i < scheduleData.length; i++) {
      const s = scheduleData[i];
      const driver = `DRV-${String(i + 1).padStart(3, "0")}`;
      const conductor = `CON-${String(i + 1).padStart(3, "0")}`;
      await ctx.db.insert("schedules", {
        scheduleId: `SCH-${String(i + 1).padStart(3, "0")}`,
        busId: s.busId,
        routeId: s.routeId,
        driverId: driver,
        conductorId: conductor,
        startTime: s.start,
        endTime: s.end,
        shift: s.shift,
        breakTime: s.breakTime,
        departureFrequency: s.freq,
        scheduledTrips: s.trips,
        status: s.delay > 15 ? "delayed" : s.delay > 0 ? "on_time" : "on_time",
        delayMinutes: s.delay,
        notes: "",
      });
    }

    // ── SCHEDULE CONFLICTS (10 conflicts) ────────────────────────────────
    const scheduleConflicts = [
      {
        conflictId: "SCF-001", category: "schedule", conflictType: "Driver Shift Overlap", severity: "Critical",
        busId: "Bus 004", routeId: "60A", crewMember: "DRV-004", scheduleId: "SCH-004",
        detectedTime: "06:00", description: "Driver Murugan (DRV-004) is scheduled on Bus 004 (Route 60A) starting 05:15 and also assigned to Bus 007 (Route E18) for afternoon shift starting 14:15 — only 0 minutes turnaround.",
        impact: "Driver fatigue risk; potential violation of mandatory rest period between shifts.", recommendedAction: "Reschedule one assignment or assign a backup driver.", status: "Open",
      },
      {
        conflictId: "SCF-002", category: "schedule", conflictType: "Conductor Shift Overlap", severity: "High",
        busId: "Bus 001", routeId: "21G", crewMember: "CON-001", scheduleId: "SCH-001",
        detectedTime: "06:15", description: "Conductor Kumar (CON-001) is scheduled on Bus 001 (Route 21G) from 05:30–14:00 and also appears on Bus 008 (Route 147B) for the same morning shift.",
        impact: "Conductor cannot be in two places; one route will lack a conductor.", recommendedAction: "Remove duplicate assignment from Bus 008.", status: "Open",
      },
      {
        conflictId: "SCF-003", category: "schedule", conflictType: "Bus Double Booking", severity: "Critical",
        busId: "Bus 003", routeId: "51", crewMember: "DRV-003", scheduleId: "SCH-003",
        detectedTime: "05:45", description: "Bus 003 is assigned to Route 51 from 05:45–13:45 AND appears in a maintenance slot starting 06:00. Bus cannot operate on both.",
        impact: "One service will be cancelled; passengers affected.", recommendedAction: "Move maintenance to afternoon slot or assign Bus 012 as replacement.", status: "Under Review",
      },
      {
        conflictId: "SCF-004", category: "schedule", conflictType: "Maintenance Conflict", severity: "High",
        busId: "Bus 006", routeId: "M70", crewMember: "DRV-006", scheduleId: "SCH-006",
        detectedTime: "05:30", description: "Bus 006 (Route M70) is marked as Maintenance but has an active schedule assigned for morning shift 05:30–13:30.",
        impact: "Scheduled trip cannot operate; passengers stranded.", recommendedAction: "Cancel schedule or reassign to available bus.", status: "Open",
      },
      {
        conflictId: "SCF-005", category: "schedule", conflictType: "Off-Duty Conflict", severity: "High",
        busId: "Bus 010", routeId: "57F", crewMember: "DRV-010", scheduleId: "SCH-010",
        detectedTime: "05:15", description: "Bus 010 (Route 57F) is marked Off Duty but has an active morning schedule assigned.",
        impact: "Route 57F service disruption.", recommendedAction: "Reassign route to another available bus or mark bus as on_route.", status: "Open",
      },
      {
        conflictId: "SCF-006", category: "schedule", conflictType: "Crew Availability Conflict", severity: "Medium",
        busId: "Bus 018", routeId: "D70", crewMember: "DRV-018", scheduleId: "SCH-018",
        detectedTime: "06:00", description: "Driver Ajith (DRV-018) is marked Off Duty but is assigned to Bus 018 (Route D70) morning schedule.",
        impact: "Bus 018 may depart without a driver.", recommendedAction: "Confirm driver availability or assign substitute.", status: "Open",
      },
      {
        conflictId: "SCF-007", category: "schedule", conflictType: "Insufficient Turnaround Time", severity: "Medium",
        busId: "Bus 014", routeId: "101", crewMember: "DRV-014", scheduleId: "SCH-014",
        detectedTime: "05:00", description: "Bus 014 (Route 101) finishes at 14:00 and next trip starts at 14:00 — zero turnaround. Route 101 is 35km/90min; bus needs at least 30min buffer.",
        impact: "Bus cannot start next trip on time; cascading delays.", recommendedAction: "Adjust schedule to start next trip at 14:30.", status: "Under Review",
      },
      {
        conflictId: "SCF-008", category: "schedule", conflictType: "Delay Propagation", severity: "Medium",
        busId: "Bus 004", routeId: "60A", crewMember: "DRV-004", scheduleId: "SCH-004",
        detectedTime: "06:30", description: "Bus 004 (Route 60A) already has a 12-minute delay at departure. Three subsequent trips will cascade delays to downstream stops.",
        impact: "Estimated 35min cumulative delay by end of shift.", recommendedAction: "Notify control room; adjust departure of subsequent trips.", status: "Open",
      },
      {
        conflictId: "SCF-009", category: "schedule", conflictType: "Crew Rest Violation", severity: "Critical",
        busId: "Bus 014", routeId: "101", crewMember: "DRV-014", scheduleId: "SCH-014",
        detectedTime: "05:00", description: "Driver Naveen (DRV-014) completed an evening shift ending 22:00 last night. Minimum 8h rest required — only 7h available before 05:00 start.",
        impact: "Legal and safety violation; fatigue-related incident risk.", recommendedAction: "Assign substitute driver for morning shift.", status: "Open",
      },
      {
        conflictId: "SCF-010", category: "schedule", conflictType: "Route Capacity Strain", severity: "Low",
        busId: "Bus 011", routeId: "64C", crewMember: "DRV-011", scheduleId: "SCH-011",
        detectedTime: "05:45", description: "Route 64C has only one bus (Bus 011) scheduled. Any breakdown or delay will leave no backup on this route.",
        impact: "No operational resilience for Route 64C.", recommendedAction: "Assign a standby bus or cross-route backup.", status: "Under Review",
      },
    ];

    for (const c of scheduleConflicts) {
      await ctx.db.insert("conflicts", { ...c });
    }

    // ── OPERATIONAL CONFLICTS (10 conflicts) ─────────────────────────────
    const operationalConflicts = [
      {
        conflictId: "OCF-001", category: "operational", conflictType: "Route Segment Overlap", severity: "High",
        busId: "Bus 001", bus2Id: "Bus 007", routeId: "21G", crewMember: "DRV-001",
        scheduleId: undefined, location: "Guindy–Saidapet corridor",
        detectedTime: "07:15", description: "Bus 001 (Route 21G) and Bus 007 (Route E18) both operate through Guindy–Saidapet within 10 minutes of each other. Both are full Express-type routes from Tambaram to Broadway.",
        impact: "Passenger confusion; both buses competing for same corridor passengers; operational redundancy.", recommendedAction: "Stagger departures by 30+ minutes or reassign Bus 007 to a different corridor.", status: "Open",
      },
      {
        conflictId: "OCF-002", category: "operational", conflictType: "Delayed Bus Behind Another", severity: "Medium",
        busId: "Bus 004", bus2Id: "Bus 001", routeId: "60A", crewMember: "DRV-004",
        scheduleId: "SCH-004", location: "Saidapet junction",
        detectedTime: "07:45", description: "Bus 004 (Route 60A, 12min delay) is now running behind Bus 001 (Route 21G) on the shared Saidapet stretch. Delay causing bunching.",
        impact: "Passengers at intermediate stops see two buses arrive together; wasted capacity.", recommendedAction: "Hold Bus 004 at Guindy for 5 minutes to restore spacing.", status: "Open",
      },
      {
        conflictId: "OCF-003", category: "operational", conflictType: "Insufficient Bus Spacing", severity: "Medium",
        busId: "Bus 001", bus2Id: "Bus 015", routeId: "21G", crewMember: "DRV-001",
        scheduleId: undefined, location: "Tambaram terminal",
        detectedTime: "06:00", description: "Bus 001 and Bus 015 (Route 121F) depart from Tambaram within 5 minutes. Both serve the same Pallikaranai–Velachery stretch.",
        impact: "Operational redundancy on shared segment; unnecessary fuel consumption.", recommendedAction: "Delay Bus 015 departure by 20 minutes.", status: "Under Review",
      },
      {
        conflictId: "OCF-004", category: "operational", conflictType: "Maintenance Bus on Active Route", severity: "Critical",
        busId: "Bus 006", bus2Id: undefined, routeId: "M70", crewMember: "DRV-006",
        scheduleId: "SCH-006", location: "Thiruvanmiyur depot",
        detectedTime: "05:25", description: "Bus 006 is undergoing engine overhaul (Maintenance status) but has an active schedule on Route M70 departing at 05:30.",
        impact: "Safety risk — bus may not be roadworthy. Service disruption if bus breaks down mid-route.", recommendedAction: "Immediately cancel Bus 006's schedule and assign Bus 019 as replacement.", status: "Open",
      },
      {
        conflictId: "OCF-005", category: "operational", conflictType: "Low Fuel on Long Route", severity: "Medium",
        busId: "Bus 005", bus2Id: undefined, routeId: "102", crewMember: "DRV-005",
        scheduleId: "SCH-005", location: "Island Ground depot",
        detectedTime: "05:50", description: "Bus 005 fuel level is 42%. Route 102 (Island Ground to Kelambakkam) is 35km — requires estimated 60% fuel for round trip. Risk of running out mid-route.",
        impact: "Bus may require mid-route refuelling; passengers delayed.", recommendedAction: "Refuel Bus 005 before departure.", status: "Open",
      },
      {
        conflictId: "OCF-006", category: "operational", conflictType: "Upcoming Maintenance Deadline", severity: "Low",
        busId: "Bus 013", bus2Id: undefined, routeId: "99", crewMember: "DRV-013",
        scheduleId: "SCH-013", location: "Tambaram depot",
        detectedTime: "06:00", description: "Bus 013 has a scheduled tyre replacement (currently in maintenance) but is also assigned to Route 99. Two conflicting needs: repair vs. operation.",
        impact: "Operating bus with pending maintenance may violate safety standards.", recommendedAction: "Complete tyre replacement before reassigning to route.", status: "Under Review",
      },
      {
        conflictId: "OCF-007", category: "operational", conflictType: "Bus Exceeded Operating Hours", severity: "Medium",
        busId: "Bus 014", bus2Id: undefined, routeId: "101", crewMember: "DRV-014",
        scheduleId: "SCH-014", location: "Central terminal",
        detectedTime: "08:00", description: "Bus 014 has accumulated 187,000 km since last major service. Manufacturer recommends 200,000 km service. Bus is approaching limit.",
        impact: "Increased breakdown risk; may require emergency maintenance.", recommendedAction: "Schedule major service within next 13,000 km.", status: "Open",
      },
      {
        conflictId: "OCF-008", category: "operational", conflictType: "No Assigned Crew", severity: "High",
        busId: "Bus 008", bus2Id: undefined, routeId: "147B", crewMember: undefined,
        scheduleId: "SCH-008", location: "Mogappair West depot",
        detectedTime: "05:55", description: "Bus 008 is available and scheduled for Route 147B, but Driver Gokul (DRV-008) is on leave today. No substitute driver assigned.",
        impact: "Route 147B will not have a driver at departure time.", recommendedAction: "Call standby driver or reassign from available pool.", status: "Open",
      },
      {
        conflictId: "OCF-009", category: "operational", conflictType: "Wrong Bus Assignment", severity: "Medium",
        busId: "Bus 018", bus2Id: undefined, routeId: "D70", crewMember: "DRV-018",
        scheduleId: "SCH-018", location: "Velachery depot",
        detectedTime: "05:30", description: "Bus 018 (Deluxe type, 40 seats) is assigned to Route D70 but Bus 018 is Off Duty. Should be Bus 019 (available, same route type) or another bus.",
        impact: "Service may not operate; wrong bus type assigned.", recommendedAction: "Reassign to Bus 019 or change Bus 018 status to available.", status: "Open",
      },
      {
        conflictId: "OCF-010", category: "operational", conflictType: "Off-Duty Bus on Active Route", severity: "Critical",
        busId: "Bus 018", bus2Id: undefined, routeId: "D70", crewMember: "DRV-018",
        scheduleId: "SCH-018", location: "Velachery depot",
        detectedTime: "06:00", description: "Bus 018 is marked Off Duty (pending fitness certificate) but has an active schedule for Route D70 morning shift. Bus cannot legally operate.",
        impact: "Legal compliance violation; safety risk to passengers.", recommendedAction: "Obtain fitness certificate before activating bus or cancel schedule.", status: "Open",
      },
    ];

    for (const c of operationalConflicts) {
      await ctx.db.insert("conflicts", { ...c });
    }

    // Summary
    const crewCount = (await ctx.db.query("crew").collect()).length;
    const busCount = (await ctx.db.query("buses").collect()).length;
    const scheduleCount = (await ctx.db.query("schedules").collect()).length;
    const conflictCount = (await ctx.db.query("conflicts").collect()).length;
    return `Migration complete: ${busCount} buses, ${crewCount} crew, ${scheduleCount} schedules, ${conflictCount} conflicts`;
  },
});
