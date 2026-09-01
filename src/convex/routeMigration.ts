import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Force-replace all routes with Chennai MTC routes.
// This is the migration entry point: it deletes EVERYTHING in routes
// and inserts the 20 Chennai routes.
export const migrateToChennai = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Delete all existing routes
    const allRoutes = await ctx.db.query("routes").collect();
    for (const route of allRoutes) {
      await ctx.db.delete(route._id);
    }

    // 2. Insert the 20 Chennai MTC routes
    const chennaiRoutes = [
      { routeId: "21G", name: "Tambaram – Broadway", startPoint: "Tambaram", endPoint: "Broadway", stops: ["Tambaram", "Chromepet", "Pallavaram", "Guindy", "Saidapet", "T. Nagar", "Broadway"], estimatedTravelTime: 75, estimatedDistance: 30, routeType: "Ordinary", passengerLoad: "High", busCount: 12, coordinates: [{ lat: 12.9249, lng: 80.1000 }, { lat: 12.9500, lng: 80.1130 }, { lat: 12.9670, lng: 80.1350 }, { lat: 12.9825, lng: 80.1640 }, { lat: 13.0010, lng: 80.1900 }, { lat: 13.0390, lng: 80.2340 }, { lat: 13.0878, lng: 80.2785 }] },
      { routeId: "29C", name: "Perambur – Besant Nagar", startPoint: "Perambur", endPoint: "Besant Nagar", stops: ["Perambur", "Ayanavaram", "Egmore", "Central", "Saidapet", "Adyar", "Besant Nagar"], estimatedTravelTime: 65, estimatedDistance: 20, routeType: "Ordinary", passengerLoad: "High", busCount: 9, coordinates: [{ lat: 13.1136, lng: 80.2337 }, { lat: 13.1020, lng: 80.2350 }, { lat: 13.0790, lng: 80.2550 }, { lat: 13.0800, lng: 80.2700 }, { lat: 13.0010, lng: 80.1900 }, { lat: 13.0062, lng: 80.2570 }, { lat: 12.9988, lng: 80.2676 }] },
      { routeId: "51", name: "Tambaram – Velachery", startPoint: "Tambaram", endPoint: "Velachery", stops: ["Tambaram", "Camp Road", "Medavakkam", "Pallikaranai", "Velachery"], estimatedTravelTime: 55, estimatedDistance: 20, routeType: "Ordinary", passengerLoad: "Medium", busCount: 8, coordinates: [{ lat: 12.9249, lng: 80.1000 }, { lat: 12.9390, lng: 80.1200 }, { lat: 12.9600, lng: 80.1500 }, { lat: 12.9750, lng: 80.1800 }, { lat: 12.9815, lng: 80.2180 }] },
      { routeId: "60A", name: "Royapuram – Kundrathur", startPoint: "Royapuram", endPoint: "Kundrathur", stops: ["Royapuram", "Parrys", "Central", "Saidapet", "Guindy", "St Thomas Mount", "Pallavaram", "Pammal", "Kundrathur"], estimatedTravelTime: 85, estimatedDistance: 30, routeType: "Ordinary", passengerLoad: "High", busCount: 10, coordinates: [{ lat: 13.1067, lng: 80.2866 }, { lat: 13.0890, lng: 80.2870 }, { lat: 13.0800, lng: 80.2700 }, { lat: 13.0010, lng: 80.1900 }, { lat: 12.9825, lng: 80.1640 }, { lat: 12.9870, lng: 80.1500 }, { lat: 12.9670, lng: 80.1350 }, { lat: 12.9480, lng: 80.1100 }, { lat: 12.9550, lng: 80.0790 }] },
      { routeId: "102", name: "Island Ground – Kelambakkam", startPoint: "Island Ground", endPoint: "Kelambakkam", stops: ["Island Ground", "Secretariat", "Chepauk", "Adyar", "Indira Nagar", "SRP Tools", "Thoraipakkam", "Karapakkam", "Sholinganallur", "Semmancheri", "Navalur", "Kelambakkam"], estimatedTravelTime: 85, estimatedDistance: 35, routeType: "Express", passengerLoad: "High", busCount: 8, coordinates: [{ lat: 13.0820, lng: 80.2838 }, { lat: 13.0800, lng: 80.2800 }, { lat: 13.0680, lng: 80.2780 }, { lat: 13.0062, lng: 80.2570 }, { lat: 13.0030, lng: 80.2480 }, { lat: 12.9890, lng: 80.2460 }, { lat: 12.9700, lng: 80.2430 }, { lat: 12.9580, lng: 80.2420 }, { lat: 12.9100, lng: 80.2400 }, { lat: 12.8920, lng: 80.2430 }, { lat: 12.8780, lng: 80.2480 }, { lat: 12.8480, lng: 80.2550 }] },
      { routeId: "M70", name: "Thiruvanmiyur – Koyambedu", startPoint: "Thiruvanmiyur", endPoint: "Koyambedu", stops: ["Thiruvanmiyur", "Adyar", "Guindy", "Ashok Nagar", "Vadapalani", "Koyambedu"], estimatedTravelTime: 55, estimatedDistance: 18, routeType: "M-Series / Express", passengerLoad: "High", busCount: 7, coordinates: [{ lat: 12.9828, lng: 80.2641 }, { lat: 13.0062, lng: 80.2570 }, { lat: 12.9825, lng: 80.1640 }, { lat: 13.0350, lng: 80.2110 }, { lat: 13.0490, lng: 80.2130 }, { lat: 13.0690, lng: 80.2230 }] },
      { routeId: "E18", name: "Tambaram – Broadway (Express)", startPoint: "Tambaram", endPoint: "Broadway", stops: ["Tambaram", "Pallavaram", "Guindy", "Saidapet", "T. Nagar", "Broadway"], estimatedTravelTime: 70, estimatedDistance: 28, routeType: "Express", passengerLoad: "High", busCount: 9, coordinates: [{ lat: 12.9249, lng: 80.1000 }, { lat: 12.9670, lng: 80.1350 }, { lat: 12.9825, lng: 80.1640 }, { lat: 13.0010, lng: 80.1900 }, { lat: 13.0390, lng: 80.2340 }, { lat: 13.0878, lng: 80.2785 }] },
      { routeId: "147B", name: "Mogappair West – T. Nagar", startPoint: "Mogappair West", endPoint: "T. Nagar", stops: ["Mogappair West", "Anna Nagar", "Aminjikarai", "Vadapalani", "Ashok Nagar", "T. Nagar"], estimatedTravelTime: 50, estimatedDistance: 15, routeType: "Ordinary", passengerLoad: "Medium", busCount: 6, coordinates: [{ lat: 13.0830, lng: 80.2050 }, { lat: 13.0730, lng: 80.2110 }, { lat: 13.0620, lng: 80.2140 }, { lat: 13.0490, lng: 80.2130 }, { lat: 13.0350, lng: 80.2110 }, { lat: 13.0390, lng: 80.2340 }] },
      { routeId: "147C", name: "T. Nagar – Ambattur OT", startPoint: "T. Nagar", endPoint: "Ambattur OT", stops: ["T. Nagar", "Vadapalani", "Anna Nagar", "Mogappair", "Ambattur"], estimatedTravelTime: 55, estimatedDistance: 18, routeType: "Ordinary", passengerLoad: "Medium", busCount: 7, coordinates: [{ lat: 13.0390, lng: 80.2340 }, { lat: 13.0490, lng: 80.2130 }, { lat: 13.0730, lng: 80.2110 }, { lat: 13.0830, lng: 80.2050 }, { lat: 13.0970, lng: 80.1930 }] },
      { routeId: "57F", name: "Broadway – Karanodai", startPoint: "Broadway", endPoint: "Karanodai", stops: ["Broadway", "Central", "Perambur", "Madhavaram", "Red Hills", "Karanodai"], estimatedTravelTime: 80, estimatedDistance: 30, routeType: "Ordinary", passengerLoad: "Medium", busCount: 6, coordinates: [{ lat: 13.0878, lng: 80.2785 }, { lat: 13.0800, lng: 80.2700 }, { lat: 13.1136, lng: 80.2337 }, { lat: 13.1350, lng: 80.2150 }, { lat: 13.1580, lng: 80.2000 }, { lat: 13.1900, lng: 80.1850 }] },
      { routeId: "64C", name: "Manali – Broadway", startPoint: "Manali", endPoint: "Broadway", stops: ["Manali", "Madhavaram", "Tondiarpet", "Royapuram", "Broadway"], estimatedTravelTime: 60, estimatedDistance: 22, routeType: "Ordinary", passengerLoad: "High", busCount: 7, coordinates: [{ lat: 13.1550, lng: 80.2600 }, { lat: 13.1350, lng: 80.2150 }, { lat: 13.1130, lng: 80.2780 }, { lat: 13.1067, lng: 80.2866 }, { lat: 13.0878, lng: 80.2785 }] },
      { routeId: "95", name: "Tambaram – Thiruvanmiyur", startPoint: "Tambaram", endPoint: "Thiruvanmiyur", stops: ["Tambaram", "Pallikaranai", "Velachery", "Taramani", "Thiruvanmiyur"], estimatedTravelTime: 65, estimatedDistance: 24, routeType: "Ordinary", passengerLoad: "Medium", busCount: 6, coordinates: [{ lat: 12.9249, lng: 80.1000 }, { lat: 12.9750, lng: 80.1800 }, { lat: 12.9815, lng: 80.2180 }, { lat: 12.9880, lng: 80.2440 }, { lat: 12.9828, lng: 80.2641 }] },
      { routeId: "99", name: "Tambaram – Adyar", startPoint: "Tambaram", endPoint: "Adyar", stops: ["Tambaram", "Chromepet", "Pallavaram", "Guindy", "Saidapet", "Adyar"], estimatedTravelTime: 65, estimatedDistance: 25, routeType: "Ordinary", passengerLoad: "High", busCount: 8, coordinates: [{ lat: 12.9249, lng: 80.1000 }, { lat: 12.9500, lng: 80.1130 }, { lat: 12.9670, lng: 80.1350 }, { lat: 12.9825, lng: 80.1640 }, { lat: 13.0010, lng: 80.1900 }, { lat: 13.0062, lng: 80.2570 }] },
      { routeId: "101", name: "Poonamallee – Thiruvotriyur", startPoint: "Poonamallee", endPoint: "Thiruvotriyur", stops: ["Poonamallee", "Porur", "Vadapalani", "Koyambedu", "Central", "Broadway", "Tondiarpet", "Thiruvotriyur"], estimatedTravelTime: 90, estimatedDistance: 35, routeType: "Ordinary", passengerLoad: "High", busCount: 9, coordinates: [{ lat: 13.0470, lng: 80.0970 }, { lat: 13.0380, lng: 80.1520 }, { lat: 13.0490, lng: 80.2130 }, { lat: 13.0690, lng: 80.2230 }, { lat: 13.0800, lng: 80.2700 }, { lat: 13.0878, lng: 80.2785 }, { lat: 13.1130, lng: 80.2780 }, { lat: 13.1270, lng: 80.2860 }] },
      { routeId: "121F", name: "Tambaram – Kannagi Nagar", startPoint: "Tambaram", endPoint: "Kannagi Nagar", stops: ["Tambaram", "Pallikaranai", "Velachery", "Sholinganallur", "Semmancheri", "Kannagi Nagar"], estimatedTravelTime: 75, estimatedDistance: 30, routeType: "Ordinary", passengerLoad: "High", busCount: 7, coordinates: [{ lat: 12.9249, lng: 80.1000 }, { lat: 12.9750, lng: 80.1800 }, { lat: 12.9815, lng: 80.2180 }, { lat: 12.9100, lng: 80.2400 }, { lat: 12.8920, lng: 80.2430 }, { lat: 12.8750, lng: 80.2380 }] },
      { routeId: "25G", name: "Poonamallee – Kodambakkam", startPoint: "Poonamallee", endPoint: "Kodambakkam", stops: ["Poonamallee", "Porur", "Valasaravakkam", "Saligramam", "Kodambakkam"], estimatedTravelTime: 55, estimatedDistance: 18, routeType: "Ordinary", passengerLoad: "Medium", busCount: 6, coordinates: [{ lat: 13.0470, lng: 80.0970 }, { lat: 13.0380, lng: 80.1520 }, { lat: 13.0350, lng: 80.1800 }, { lat: 13.0430, lng: 80.1980 }, { lat: 13.0460, lng: 80.2080 }] },
      { routeId: "28", name: "Egmore – Thiruvotriyur", startPoint: "Egmore", endPoint: "Thiruvotriyur", stops: ["Egmore", "Central", "Washermenpet", "Tondiarpet", "Thiruvotriyur"], estimatedTravelTime: 50, estimatedDistance: 17, routeType: "Ordinary", passengerLoad: "High", busCount: 8, coordinates: [{ lat: 13.0790, lng: 80.2550 }, { lat: 13.0800, lng: 80.2700 }, { lat: 13.1000, lng: 80.2780 }, { lat: 13.1130, lng: 80.2780 }, { lat: 13.1270, lng: 80.2860 }] },
      { routeId: "D70", name: "Velachery – Ambattur Industrial Estate", startPoint: "Velachery", endPoint: "Ambattur Industrial Estate", stops: ["Velachery", "Guindy", "Ashok Nagar", "Vadapalani", "Anna Nagar", "Ambattur"], estimatedTravelTime: 70, estimatedDistance: 25, routeType: "Deluxe", passengerLoad: "Medium", busCount: 5, coordinates: [{ lat: 12.9815, lng: 80.2180 }, { lat: 12.9825, lng: 80.1640 }, { lat: 13.0350, lng: 80.2110 }, { lat: 13.0490, lng: 80.2130 }, { lat: 13.0730, lng: 80.2110 }, { lat: 13.0970, lng: 80.1930 }] },
      { routeId: "M1", name: "Keelkattalai – Thiruvanmiyur", startPoint: "Keelkattalai", endPoint: "Thiruvanmiyur", stops: ["Keelkattalai", "Madipakkam", "Velachery", "Taramani", "Thiruvanmiyur"], estimatedTravelTime: 45, estimatedDistance: 15, routeType: "M-Series", passengerLoad: "Medium", busCount: 5, coordinates: [{ lat: 12.9680, lng: 80.1900 }, { lat: 12.9730, lng: 80.2030 }, { lat: 12.9815, lng: 80.2180 }, { lat: 12.9880, lng: 80.2440 }, { lat: 12.9828, lng: 80.2641 }] },
      { routeId: "588", name: "Adyar – Mamallapuram", startPoint: "Adyar", endPoint: "Mamallapuram", stops: ["Adyar", "Thiruvanmiyur", "Sholinganallur", "Kelambakkam", "Kovalam", "Mamallapuram"], estimatedTravelTime: 90, estimatedDistance: 43, routeType: "Express", passengerLoad: "Medium", busCount: 4, coordinates: [{ lat: 13.0062, lng: 80.2570 }, { lat: 12.9828, lng: 80.2641 }, { lat: 12.9100, lng: 80.2400 }, { lat: 12.8480, lng: 80.2550 }, { lat: 12.8000, lng: 80.2400 }, { lat: 12.6167, lng: 80.1990 }] },
    ];

    for (const route of chennaiRoutes) {
      await ctx.db.insert("routes", {
        routeId: route.routeId,
        name: route.name,
        startPoint: route.startPoint,
        endPoint: route.endPoint,
        stops: route.stops,
        estimatedTravelTime: route.estimatedTravelTime,
        estimatedDistance: route.estimatedDistance,
        routeType: route.routeType,
        passengerLoad: route.passengerLoad,
        busCount: route.busCount,
        status: "active" as const,
        coordinates: route.coordinates,
        operatingHours: { start: "06:00", end: "22:00" },
        createdBy: "system",
      });
    }

    // 3. Verify count
    const finalCount = (await ctx.db.query("routes").collect()).length;
    return `Migration complete. ${finalCount} routes in database.`;
  },
});

// Verify the database state
export const verifyRoutes = query({
  args: {},
  handler: async (ctx) => {
    const routes = await ctx.db.query("routes").collect();
    const routeIds = routes.map((r) => r.routeId);
    const uniqueIds = new Set(routeIds);
    const hasDuplicates = routeIds.length !== uniqueIds.size;
    const has21G = routeIds.includes("21G");
    const has588 = routeIds.includes("588");
    return {
      totalRoutes: routes.length,
      routeIds: routeIds.sort(),
      hasDuplicates,
      hasChennaiRoutes: has21G && has588,
      firstRoute: routes[0] ? { routeId: routes[0].routeId, name: routes[0].name, startPoint: routes[0].startPoint, endPoint: routes[0].endPoint } : null,
      lastRoute: routes.length > 0 ? { routeId: routes[routes.length - 1].routeId, name: routes[routes.length - 1].name } : null,
    };
  },
});
