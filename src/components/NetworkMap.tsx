import { useEffect, useRef, useState } from "react";
import type { LatLngExpression } from "leaflet";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let L: any = null;

const ROUTE_COLORS = [
  "#1e40af", "#0891b2", "#059669", "#d97706",
  "#7c3aed", "#dc2626", "#2563eb", "#16a34a",
  "#e11d48", "#0d9488", "#4338ca", "#c2410c",
  "#7e22ce", "#15803d", "#b91c1c", "#1d4ed8",
  "#a21caf", "#a16207", "#0f766e", "#6d28d9",
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
  focusRouteId?: string;
}

export function NetworkMap({
  routes,
  onRouteClick,
  drawingMode = false,
  onDrawComplete,
  height = "500px",
  focusRouteId,
}: NetworkMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstance = useRef<any>(null);
  const drawnPoints = useRef<Array<{ lat: number; lng: number }>>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drawnPolyline = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!L) {
      import("leaflet").then((leaflet) => {
        L = leaflet;
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
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    const map = L.map(mapRef.current, {
      center: [13.0827, 80.2707],
      zoom: 11,
      zoomControl: true,
      attributionControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19,
    }).addTo(map);
    mapInstance.current = map;
    setTimeout(() => map.invalidateSize(), 100);
    return () => { map.remove(); mapInstance.current = null; };
  }, [leafletLoaded]);

  // Render routes
  useEffect(() => {
    if (!mapInstance.current || !L) return;
    const map = mapInstance.current;
    map.eachLayer((layer: any) => {
      if (layer._busflowRoute || layer._busflowMarker) map.removeLayer(layer);
    });
    routes.forEach((route, index) => {
      if (route.coordinates.length < 2) return;
      const color = ROUTE_COLORS[index % ROUTE_COLORS.length];
      const isFocused = focusRouteId === route.routeId;
      const latLngs: LatLngExpression[] = route.coordinates.map((c) => [c.lat, c.lng]);
      const polyline = L.polyline(latLngs, {
        color,
        weight: isFocused ? 6 : 3,
        opacity: isFocused ? 1 : route.status === "active" ? 0.7 : 0.35,
        dashArray: route.status === "proposed" ? "8, 8" : undefined,
      }).addTo(map);
      (polyline as any)._busflowRoute = true;
      const midIdx = Math.floor(route.coordinates.length / 2);
      const midPoint = route.coordinates[midIdx];
      const label = L.marker([midPoint.lat, midPoint.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div style="background:${color};color:white;font-size:${isFocused ? 12 : 10}px;font-weight:600;padding:2px 8px;border-radius:12px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.2);font-family:system-ui,sans-serif;${isFocused ? "font-size:12px;padding:3px 10px;" : ""}">${route.routeId}</div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
      }).addTo(map);
      (label as any)._busflowMarker = true;
      polyline.on("click", () => onRouteClick?.(route.routeId));
      if (isFocused) {
        map.fitBounds(polyline.getBounds().pad(0.2));
      }
    });
  }, [routes, onRouteClick, focusRouteId]);

  // Drawing mode
  useEffect(() => {
    if (!mapInstance.current || !L) return;
    const map = mapInstance.current;
    if (!drawingMode) { map.getContainer().style.cursor = ""; return; }
    map.getContainer().style.cursor = "crosshair";
    drawnPoints.current = [];
    const onClick = (e: any) => {
      const { lat, lng } = e.latlng;
      drawnPoints.current.push({ lat, lng });
      const marker = L.circleMarker([lat, lng], {
        radius: 5, fillColor: "#1e40af", fillOpacity: 1, color: "white", weight: 2,
      }).addTo(map);
      (marker as any)._busflowDrawing = true;
      if (drawnPolyline.current) map.removeLayer(drawnPolyline.current);
      if (drawnPoints.current.length >= 2) {
        const ls = drawnPoints.current.map((p) => [p.lat, p.lng] as LatLngExpression);
        drawnPolyline.current = L.polyline(ls, {
          color: "#1e40af", weight: 3, dashArray: "6, 6", opacity: 0.8,
        }).addTo(map);
        (drawnPolyline.current as any)._busflowDrawing = true;
      }
    };
    const onDblClick = () => {
      if (drawnPoints.current.length >= 2) onDrawComplete?.([...drawnPoints.current]);
      map.eachLayer((layer: any) => { if (layer._busflowDrawing) map.removeLayer(layer); });
      drawnPoints.current = [];
      drawnPolyline.current = null;
    };
    map.on("click", onClick);
    map.on("dblclick", onDblClick);
    return () => {
      map.off("click", onClick);
      map.off("dblclick", onDblClick);
      map.getContainer().style.cursor = "";
      map.eachLayer((layer: any) => { if (layer._busflowDrawing) map.removeLayer(layer); });
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
