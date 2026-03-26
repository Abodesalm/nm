"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PointStatusBadge } from "./PointStatusBadge";
import { PointDrawer } from "./PointDrawer";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronLeft,
  Server,
  Wifi,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  points: any[];
  onRefresh: () => void;
  prefilledRegion?: { mainRegion: string; region: string };
}

function PointNode({
  point,
  allPoints,
  depth,
  onAdd,
  onEdit,
  onDelete,
  router,
}: {
  point: any;
  allPoints: any[];
  depth: number;
  onAdd: (provider: any) => void;
  onEdit: (p: any) => void;
  onDelete: (p: any) => void;
  router: any;
}) {
  const [expanded, setExpanded] = useState(true);
  const [hovered, setHovered] = useState(false);
  const children = allPoints.filter(
    (p) =>
      String(p.providerPoint?._id ?? p.providerPoint) === String(point._id),
  );

  const iconBg =
    point.status === "online"
      ? "rgba(34,197,94,0.1)"
      : point.status === "maintenance"
        ? "rgba(249,115,22,0.1)"
        : "var(--bg)";

  const iconColor =
    point.status === "online"
      ? "#16a34a"
      : point.status === "maintenance"
        ? "#f97316"
        : "var(--text-muted)";

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        {/* Expand toggle */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: 20,
            paddingTop: 10,
            flexShrink: 0,
          }}
        >
          {children.length > 0 ? (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              {expanded ? <ChevronDown size={14} /> : <ChevronLeft size={14} />}
            </button>
          ) : (
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                border: "2px solid var(--border)",
              }}
            />
          )}
        </div>

        {/* Node card */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 10,
            border: `1px solid ${hovered ? "#f97316" : "var(--border)"}`,
            background: "var(--surface)",
            cursor: "pointer",
            marginBottom: 8,
            maxWidth: 420,
            transition: "border-color 0.15s",
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => router.push(`/points/${point._id}`)}
        >
          {/* Icon */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {point.captivePortal?.hasRouter ? (
              <Wifi size={15} style={{ color: iconColor }} />
            ) : (
              <Server size={15} style={{ color: iconColor }} />
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: "#f97316",
                  fontWeight: 700,
                }}
              >
                #{point.point_number}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text)",
                  fontFamily: "'Tajawal', sans-serif",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {point.name}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 2,
              }}
            >
              <PointStatusBadge status={point.status} />
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  fontFamily: "'Tajawal', sans-serif",
                }}
              >
                {point.freePorts} منفذ حر
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "#6366f1",
                  fontFamily: "'Tajawal', sans-serif",
                }}
              >
                {point.customersCount ?? 0} زبون
              </span>
              {children.length > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    fontFamily: "'Tajawal', sans-serif",
                  }}
                >
                  {children.length} نقطة فرعية
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              opacity: hovered ? 1 : 0,
              transition: "opacity 0.15s",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {[
              {
                icon: <Plus size={13} />,
                title: "إضافة نقطة فرعية",
                hoverColor: "#f97316",
                action: () => onAdd(point),
              },
              {
                icon: <UserPlus size={13} />,
                title: "إضافة زبون",
                hoverColor: "#6366f1",
                action: () => router.push(`/customers?point=${point._id}`),
              },
              {
                icon: <Pencil size={13} />,
                title: "تعديل",
                hoverColor: "#3b82f6",
                action: () => onEdit(point),
              },
              {
                icon: <Trash2 size={13} />,
                title: "حذف",
                hoverColor: "#ef4444",
                action: () => onDelete(point),
              },
            ].map((btn, i) => (
              <ActionBtn key={i} {...btn} />
            ))}
          </div>
        </div>
      </div>

      {/* Children */}
      {expanded && children.length > 0 && (
        <div
          style={{
            marginRight: 32,
            borderRight: "2px dashed var(--border)",
            paddingRight: 16,
          }}
        >
          {children.map((child) => (
            <PointNode
              key={child._id}
              point={child}
              allPoints={allPoints}
              depth={depth + 1}
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
              router={router}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ActionBtn({
  icon,
  title,
  hoverColor,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  hoverColor: string;
  action: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      title={title}
      onClick={action}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 28,
        height: 28,
        borderRadius: 7,
        border: "none",
        background: hovered ? `${hoverColor}18` : "transparent",
        color: hovered ? hoverColor : "var(--text-muted)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.15s",
      }}
    >
      {icon}
    </button>
  );
}

export function PointsTreeView({ points, onRefresh, prefilledRegion }: Props) {
  const router = useRouter();
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [addProvider, setAddProvider] = useState<any>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [addRootHovered, setAddRootHovered] = useState(false);

  function openAddDrawer(provider: any) {
    setAddProvider(provider);
    setAddDrawerOpen(true);
  }

  function closeAddDrawer() {
    setAddDrawerOpen(false);
    setAddProvider(null);
  }

  const roots = points.filter(
    (p) => !p.providerPoint || p.providerPoint === null,
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/points/${deleteTarget._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("تم حذف النقطة");
      onRefresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleteTarget(null);
    }
  }

  const addDrawer = (
    <PointDrawer
      open={addDrawerOpen}
      onClose={closeAddDrawer}
      onSaved={() => { onRefresh(); closeAddDrawer(); }}
      prefilledProvider={addProvider}
      prefilledRegion={prefilledRegion}
    />
  );

  if (points.length === 0) {
    return (
      <>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "64px 0",
            gap: 12,
          }}
        >
          <Server size={40} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
          <p style={{ color: "var(--text-muted)", fontFamily: "'Tajawal', sans-serif", fontSize: 14 }}>
            لا توجد نقاط في هذه المنطقة
          </p>
          <button
            onClick={() => openAddDrawer(null)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              height: 36, padding: "0 16px", borderRadius: 8,
              border: "none", background: "#f97316", color: "#fff",
              fontSize: 13, fontFamily: "'Tajawal', sans-serif",
              fontWeight: 600, cursor: "pointer",
              boxShadow: "0 4px 12px rgba(249,115,22,0.3)",
            }}
          >
            <Plus size={13} /> إضافة أول نقطة
          </button>
        </div>
        {addDrawer}
      </>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Root header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 4,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: 8,
            background: "rgba(249,115,22,0.08)",
            border: "1px solid rgba(249,115,22,0.2)",
          }}
        >
          <Server size={15} style={{ color: "#f97316" }} />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#f97316",
              fontFamily: "'Tajawal', sans-serif",
            }}
          >
            MikroTik المركزي
          </span>
        </div>
        <button
          onClick={() => openAddDrawer(null)}
          onMouseEnter={() => setAddRootHovered(true)}
          onMouseLeave={() => setAddRootHovered(false)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            height: 32,
            padding: "0 12px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: addRootHovered ? "var(--bg)" : "transparent",
            color: "var(--text)",
            fontSize: 12,
            fontFamily: "'Tajawal', sans-serif",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
        >
          <Plus size={13} /> إضافة نقطة جذر
        </button>
      </div>

      {/* Tree */}
      <div
        style={{
          borderRight: "2px dashed rgba(249,115,22,0.4)",
          paddingRight: 16,
        }}
      >
        {roots.map((root) => (
          <PointNode
            key={root._id}
            point={root}
            allPoints={points}
            depth={0}
            onAdd={openAddDrawer}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
            router={router}
          />
        ))}
      </div>

      {/* Add Drawer */}
      {addDrawer}

      {/* Edit Drawer */}
      {editTarget && (
        <PointDrawer
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            onRefresh();
            setEditTarget(null);
          }}
          point={editTarget}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="حذف النقطة"
          message={`هل أنت متأكد من حذف النقطة "${deleteTarget.name}"؟`}
          confirmLabel="حذف"
          confirmColor="#ef4444"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
