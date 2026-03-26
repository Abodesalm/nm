"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, MapPin, Server } from "lucide-react";

export default function PointsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<any>(null);
  const [points, setPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/points").then((r) => r.json()),
    ]).then(([s, p]) => {
      setSettings(s.data);
      setPoints(p.data ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
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
    );
  }

  const mainRegions = settings?.mainRegions ?? [];
  const regions = settings?.regions ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div>
        <h1
          className="font-title font-bold"
          style={{ fontSize: 22, color: "var(--text)" }}
        >
          النقاط
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
          إدارة نقاط الشبكة والتوزيع
        </p>
      </div>

      {mainRegions.length === 0 && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 48,
            textAlign: "center",
            color: "var(--text-muted)",
            fontFamily: "'Tajawal', sans-serif",
            fontSize: 13,
          }}
        >
          لا توجد مناطق رئيسية. أضف مناطق من الإعدادات أولاً.
        </div>
      )}

      {/* Accordion per mainRegion */}
      {mainRegions.map((mr: any) => {
        const mrRegions = regions.filter((r: any) => r.mainRegion === mr.name);
        const isCollapsed = collapsed[mr._id];

        return (
          <div
            key={mr._id}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              overflow: "visible",
            }}
          >
            {/* Main region header */}
            <button
              onClick={() =>
                setCollapsed((c) => ({ ...c, [mr._id]: !c[mr._id] }))
              }
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 18px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Tajawal', sans-serif",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <MapPin size={15} color="#f97316" />
                <span
                  className="font-title font-semibold"
                  style={{ fontSize: 15, color: "var(--text)" }}
                >
                  {mr.name}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    padding: "1px 8px",
                    borderRadius: 99,
                  }}
                >
                  {mrRegions.length} منطقة
                </span>
              </div>
              {isCollapsed ? (
                <ChevronDown size={16} color="var(--text-muted)" />
              ) : (
                <ChevronUp size={16} color="var(--text-muted)" />
              )}
            </button>

            {/* Divider */}
            {!isCollapsed && (
              <div
                style={{
                  height: 1,
                  background: "var(--border)",
                  margin: "0 18px",
                }}
              />
            )}

            {/* Region cards */}
            {!isCollapsed && (
              <div
                style={{
                  padding: "16px 18px 18px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: 12,
                }}
              >
                {mrRegions.length === 0 && (
                  <p
                    style={{
                      gridColumn: "1 / -1",
                      textAlign: "center",
                      padding: "24px 0",
                      color: "var(--text-muted)",
                      fontFamily: "'Tajawal', sans-serif",
                      fontSize: 13,
                    }}
                  >
                    لا توجد مناطق في {mr.name}
                  </p>
                )}
                {mrRegions.map((region: any) => {
                  const rPoints = points.filter(
                    (p) => p.region === region.name && p.mainRegion === mr.name,
                  );
                  const online = rPoints.filter(
                    (p) => p.status === "online",
                  ).length;
                  const offline = rPoints.filter(
                    (p) => p.status === "offline",
                  ).length;
                  const maintenance = rPoints.filter(
                    (p) => p.status === "maintenance",
                  ).length;

                  return (
                    <div
                      key={region._id}
                      onClick={() =>
                        router.push(`/points/region/${region._id}`)
                      }
                      style={{
                        background: "var(--bg)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        padding: "14px 16px",
                        cursor: "pointer",
                        transition: "border-color 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLDivElement).style.borderColor =
                          "#f97316")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLDivElement).style.borderColor =
                          "var(--border)")
                      }
                    >
                      {/* Card header */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 10,
                        }}
                      >
                        <Server size={14} color="#f97316" />
                        <span
                          className="font-title font-semibold"
                          style={{
                            fontSize: 13,
                            color: "var(--text)",
                          }}
                        >
                          {region.name}
                        </span>
                      </div>

                      {/* Count */}
                      <p
                        style={{
                          fontSize: 26,
                          fontWeight: 700,
                          color: "var(--text)",
                          fontFamily: "'Tajawal', sans-serif",
                          marginBottom: 10,
                          lineHeight: 1,
                        }}
                      >
                        {rPoints.length}
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 400,
                            color: "var(--text-muted)",
                            marginRight: 4,
                          }}
                        >
                          نقطة
                        </span>
                      </p>

                      {/* Status pills */}
                      <div
                        style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            padding: "2px 8px",
                            borderRadius: 99,
                            background: "rgba(34,197,94,0.1)",
                            color: "#16a34a",
                          }}
                        >
                          {online} متصل
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            padding: "2px 8px",
                            borderRadius: 99,
                            background: "rgba(239,68,68,0.1)",
                            color: "#dc2626",
                          }}
                        >
                          {offline} غير متصل
                        </span>
                        {maintenance > 0 && (
                          <span
                            style={{
                              fontSize: 11,
                              padding: "2px 8px",
                              borderRadius: 99,
                              background: "rgba(249,115,22,0.1)",
                              color: "#ea580c",
                            }}
                          >
                            {maintenance} صيانة
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
