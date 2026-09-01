import { useEffect, useRef, useState } from "react";
import type { LatLngExpression } from "leaflet";

// Dynamic import of leaflet to avoid SSR issues
let L: typeof import("leaflet") | null = null;

const ROUTE_COLORS = [
  "#1e40af", // blue-800
  "#0891b2", // cyan-600
  "#059669", // emerald-600
  "#d97706", // amber-600
  "#7c3aed", // violet-600
  "#dc2626", // red-600
  "#2563eb", // blue-600
  "#16a34a", // green-600
];

interface RouteData {
  routeId: string;
  name: string;
  coordinates: Array<{ lat: number; lng: number }>;
  status: string;
  stops: string[];
}

interface NetworkMapProps {
  routes: RouteData[];
  onRouteClick?: (routeId: string) => void;
  drawingMode?: boolean;
  onDrawComplete?: (coordinates: Array<{ lat: number; lng: number }>) => void;
  height?: string;
}

export function NetworkMap({
  routes,
  onRouteClick,
  drawingMode = false,
  onDrawComplete,
  height = "500px",
}: NetworkMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<ReturnType<typeof L.map> | null>(null);
  const drawnPoints = useRef<Array<{ lat: number; lng: number }>>([]);
  const drawnPolyline = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Dynamically import leaflet CSS and JS
    if (!L) {
      import("leaflet").then((leaflet) => {
        L = leaflet;
        // Fix default marker icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });
        setLeafletLoaded(true);
      });
    } else {
      setLeafletLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstance.current) return;

    // Import leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const map = L!.map(mapRef.current, {
      center: [40.7128, -74.006],
      zoom: 12,
      zoomControl: true,
      attributionControl: true,
    });

    L!.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstance.current = map;

    // Invalidate size after a short delay to handle layout shifts
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [leafletLoaded]);

  // Render routes
  useEffect(() => {
    if (!mapInstance.current || !L) return;
    const map = mapInstance.current;

    // Clear existing route layers
    map.eachLayer((layer: any) => {
      if (layer._busflowRoute || layer._busflowMarker) {
        map.removeLayer(layer);
      }
    });

    routes.forEach((route, index) => {
      if (route.coordinates.length < 2) return;
      const color = ROUTE_COLORS[index % ROUTE_COLORS.length];
      const latLngs: LatLngExpression[] = route.coordinates.map((c) => [c.lat, c.lng]);

      const polyline = L!.polyline(latLngs, {
        color,
        weight: 4,
        opacity: route.status === "active" ? 0.9 : 0.5,
        dashArray: route.status === "proposed" ? "8, 8" : undefined,
      }).addTo(map);
      (polyline as any)._busflowRoute = true;

      // Route label at midpoint
      const midIdx = Math.floor(route.coordinates.length / 2);
      const midPoint = route.coordinates[midIdx];
      const label = L!.marker([midPoint.lat, midPoint.lng], {
        icon: L!.divIcon({
          className: "",
          html: `<div style="
            background: ${color};
            color: white;
            font-size: 11px;
            font-weight: 600;
            padding: 2px 8px;
            border-radius: 12px;
            white-space: nowrap;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            font-family: system-ui, sans-serif;
          ">${route.routeId}: ${route.name}</div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
      }).addTo(map);
      (label as any)._busflowMarker = true;

      // Click handler
      polyline.on("click", () => {
        onRouteClick?.(route.routeId);
      });
    });
  }, [routes, onRouteClick]);

  // Drawing mode
  useEffect(() => {
    if (!mapInstance.current || !L) return;
    const map = mapInstance.current;

    if (!drawingMode) {
      map.getContainer().style.cursor = "";
      return;
    }

    map.getContainer().style.cursor = "crosshair";
    drawnPoints.current = [];

    const onClick = (e: any) => {
      const { lat, lng } = e.latlng;
      drawnPoints.current.push({ lat, lng });

      // Add marker
      const marker = L!.circleMarker([lat, lng], {
        radius: 5,
        fillColor: "#1e40af",
        fillOpacity: 1,
        color: "white",
        weight: 2,
      }).addTo(map);
      (marker as any)._busflowDrawing = true;

      // Update polyline
      if (drawnPolyline.current) {
        map.removeLayer(drawnPolyline.current);
      }
      if (drawnPoints.current.length >= 2) {
        const latLngs = drawnPoints.current.map((p) => [p.lat, p.lng] as LatLngExpression);
        drawnPolyline.current = L!.polyline(latLngs, {
          color: "#1e40af",
          weight: 3,
          dashArray: "6, 6",
          opacity: 0.8,
        }).addTo(map);
        (drawnPolyline.current as any)._busflowDrawing = true;
      }
    };

    const onDoubleClick = () => {
      if (drawnPoints.current.length >= 2) {
        onDrawComplete?.([...drawnPoints.current]);
      }
      // Clear drawing
      map.eachLayer((layer: any) => {
        if (layer._busflowDrawing) map.removeLayer(layer);
      });
      drawnPoints.current = [];
      drawnPolyline.current = null;
    };

    map.on("click", onClick);
    map.on("dblclick", onDoubleClick);

    return () => {
      map.off("click", onClick);
      map.off("dblclick", onDoubleClick);
      map.getContainer().style.cursor = "";
      // Clear drawing layers
      map.eachLayer((layer: any) => {
        if (layer._busflowDrawing) map.removeLayer(layer);
      });
    };
  }, [drawingMode, onDrawComplete]);

  return (
    <div
      ref={mapRef}
      style={{ height, width: "100%" }}
      className="rounded-xl border border-border bg-muted overflow-hidden"
    />
  );
}
