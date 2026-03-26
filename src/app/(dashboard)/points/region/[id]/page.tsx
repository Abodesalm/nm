"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, List, Network, Map } from "lucide-react";
import { PointsTable } from "@/components/points/PointsTable";
import { PointsTreeView } from "@/components/points/PointsTreeView";
import { PointsMapView } from "@/components/points/PointsMapView";
import { PointDrawer } from "@/components/points/PointDrawer";

type View = "tree" | "table" | "map";

export default function RegionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [view, setView] = useState<View>("tree");
  const [region, setRegion] = useState<any>(null);
  const [points, setPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [editTarget, setEditTarget] = useState<any>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        const found = (s.data?.regions ?? []).find(
          (r: any) => String(r._id) === id,
        );
        setRegion(found ?? null);
      });
  }, [id]);

  useEffect(() => {
    if (!region) return;
    setLoading(true);
    fetch(
      `/api/points?mainRegion=${encodeURIComponent(region.mainRegion)}&region=${encodeURIComponent(region.name)}`,
    )
      .then((r) => r.json())
      .then((d) => {
        setPoints(d.data ?? []);
        setLoading(false);
      });
  }, [region, refresh]);

  const views: { key: View; label: string; icon: React.ReactNode }[] = [
    { key: "tree", label: "الشجرة", icon: <Network size={14} /> },
    { key: "table", label: "الجدول", icon: <List size={14} /> },
    { key: "map", label: "الخريطة", icon: <Map size={14} /> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.push("/points")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 36,
              padding: "0 14px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text)",
              fontSize: 13,
              fontFamily: "'Tajawal', sans-serif",
              cursor: "pointer",
            }}
          >
            <ArrowRight size={14} /> رجوع
          </button>
          <div>
            <h1
              className="font-title font-bold"
              style={{ fontSize: 22, color: "var(--text)" }}
            >
              {region?.name ?? "..."}
            </h1>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                marginTop: 4,
              }}
            >
              {region?.mainRegion} · {points.length} نقطة
            </p>
          </div>
        </div>

        {/* View toggle */}
        <div
          style={{
            display: "flex",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 9,
            padding: 3,
            gap: 2,
          }}
        >
          {views.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                height: 32,
                padding: "0 14px",
                borderRadius: 7,
                border: "none",
                background: view === v.key ? "#f97316" : "transparent",
                color: view === v.key ? "#fff" : "var(--text-muted)",
                fontSize: 13,
                fontFamily: "'Tajawal', sans-serif",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {v.icon}
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 200,
            color: "var(--text-muted)",
            fontFamily: "'Tajawal', sans-serif",
          }}
        >
          جاري التحميل...
        </div>
      ) : (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            overflow: "visible",
            padding: 20,
          }}
        >
          {view === "tree" && (
            <PointsTreeView
              points={points}
              onRefresh={() => setRefresh((r) => r + 1)}
              prefilledRegion={
                region
                  ? { mainRegion: region.mainRegion, region: region.name }
                  : undefined
              }
            />
          )}
          {view === "table" && (
            <PointsTable
              points={points}
              onRefresh={() => setRefresh((r) => r + 1)}
              prefilledRegion={
                region
                  ? { mainRegion: region.mainRegion, region: region.name }
                  : undefined
              }
            />
          )}
          {view === "map" && (
            <PointsMapView
              points={points}
              onEdit={setEditTarget}
              onDelete={() => setRefresh((r) => r + 1)}
            />
          )}
        </div>
      )}

      {editTarget && (
        <PointDrawer
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setRefresh((r) => r + 1);
            setEditTarget(null);
          }}
          point={editTarget}
        />
      )}
    </div>
  );
}
