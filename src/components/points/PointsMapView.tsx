"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Props {
  points: any[];
  onEdit: (p: any) => void;
  onDelete: (p: any) => void;
}

export function PointsMapView({ points, onEdit, onDelete }: Props) {
  const mapRef        = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const router        = useRouter();

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    const init = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css" as any);

      // Fix default icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      // Destroy existing instance before re-creating
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const validPoints = points.filter((p) => p.location?.lat && p.location?.lng);
      const center: [number, number] = validPoints.length > 0
        ? [validPoints[0].location.lat, validPoints[0].location.lng]
        : [33.5138, 36.2765]; // Damascus fallback

      const map = L.map(mapRef.current!, { center, zoom: 14 });
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      // Connection lines
      validPoints.forEach((p) => {
        if (!p.providerPoint) return;
        const provider = validPoints.find(
          (pp) => String(pp._id) === String(p.providerPoint?._id ?? p.providerPoint),
        );
        if (provider?.location?.lat) {
          L.polyline(
            [[p.location.lat, p.location.lng], [provider.location.lat, provider.location.lng]],
            { color: "#f97316", weight: 2, opacity: 0.6, dashArray: "6,4" },
          ).addTo(map);
        }
      });

      // Markers
      const markerObjects: any[] = [];
      validPoints.forEach((p) => {
        const color =
          p.status === "online"      ? "#22c55e" :
          p.status === "maintenance" ? "#f97316" : "#ef4444";
        const statusLabel =
          p.status === "online"      ? "متصل" :
          p.status === "maintenance" ? "صيانة" : "غير متصل";

        const icon = L.divIcon({
          className: "",
          html: `<div style="
            width:30px;height:30px;border-radius:50%;
            background:${color};border:3px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,0.35);
            display:flex;align-items:center;justify-content:center;
            color:white;font-size:9px;font-weight:700;font-family:monospace;
          ">${p.point_number}</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          popupAnchor: [0, -18],
        });

        const marker = L.marker([p.location.lat, p.location.lng], { icon });

        marker.bindPopup(`
          <div style="direction:rtl;font-family:'Tajawal',sans-serif;min-width:190px;padding:4px 0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              <span style="background:${color}22;color:${color};padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700">
                #${p.point_number}
              </span>
              <span style="font-weight:700;font-size:13px;flex:1">${p.name || "—"}</span>
            </div>
            <div style="font-size:12px;color:#666;margin-bottom:4px">${p.location.address || ""}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">
              <span style="background:${color}22;color:${color};padding:1px 8px;border-radius:99px;font-size:11px;font-weight:600">${statusLabel}</span>
              <span style="font-size:11px;color:#888">${p.freePorts} منفذ حر</span>
            </div>
            <button onclick="window.__nmPointView('${p._id}')"
              style="width:100%;padding:6px;background:#f97316;color:white;border:none;border-radius:7px;cursor:pointer;font-family:'Tajawal',sans-serif;font-size:12px;font-weight:600">
              عرض الصفحة
            </button>
          </div>
        `);

        marker.addTo(map);
        markerObjects.push(marker);
      });

      // Global nav handler for popup buttons
      (window as any).__nmPointView = (id: string) => router.push(`/points/${id}`);

      if (validPoints.length > 1) {
        const group = L.featureGroup(markerObjects);
        map.fitBounds(group.getBounds().pad(0.2));
      }
    };

    init();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [points]); // re-run when points list changes

  const hasLocations = points.some((p) => p.location?.lat && p.location?.lng);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {!hasLocations && (
        <div style={{
          padding: "10px 14px",
          borderRadius: 8,
          background: "rgba(249,115,22,0.08)",
          border: "1px solid rgba(249,115,22,0.2)",
          fontSize: 13,
          color: "#f97316",
          fontFamily: "'Tajawal', sans-serif",
        }}>
          لا توجد نقاط بإحداثيات مسجلة. أضف خط العرض والطول عند تعديل النقاط لعرضها على الخريطة.
        </div>
      )}
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: 520,
          borderRadius: 10,
          overflow: "hidden",
          border: "1px solid var(--border)",
        }}
      />
    </div>
  );
}
