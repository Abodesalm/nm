"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Eye, EyeOff } from "lucide-react";
import { StorageTable } from "@/components/storage/StorageTable";
import { StorageDrawer } from "@/components/storage/StorageDrawer";
import { ActionDrawer } from "@/components/storage/ActionDrawer";

export default function StoragePage() {
  const [defaultExchange, setDefaultExchange] = useState(15000);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const [addDrawer, setAddDrawer] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [actionItem, setActionItem] = useState<any>(null);

  useEffect(() => {
    fetchMeta();
  }, [refresh]);

  async function fetchMeta() {
    const [settingsRes, storageRes] = await Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/storage?limit=1").then((r) => r.json()),
    ]);
    setDefaultExchange(settingsRes.data?.defaultExchangeRate ?? 15000);
    setCategories(storageRes.data?.categories ?? []);
  }

  async function handleDelete(id: string) {
    if (id === "__refresh__") {
      setRefresh((r) => r + 1);
      return;
    }
    await fetch(`/api/storage/${id}`, { method: "DELETE" });
    setRefresh((r) => r + 1);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1
            className="font-title font-bold"
            style={{ fontSize: 22, color: "var(--text)" }}
          >
            التخزين
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            إدارة المخزون والحركات
          </p>
        </div>
        <button
          onClick={() => setAddDrawer(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            height: 40,
            padding: "0 18px",
            borderRadius: 9,
            border: "none",
            background: "#f97316",
            color: "#fff",
            fontSize: 14,
            fontFamily: "'Tajawal', sans-serif",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(249,115,22,0.3)",
          }}
        >
          <Plus size={16} /> إضافة عنصر
        </button>
      </div>

      {/* Filters */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 14,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search
            size={15}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            style={{
              height: 38,
              padding: "0 36px 0 12px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text)",
              fontSize: 13.5,
              fontFamily: "'Tajawal', sans-serif",
              outline: "none",
              width: "100%",
            }}
            placeholder="بحث بالاسم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = "#f97316")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </div>

        <select
          style={{
            height: 38,
            padding: "0 10px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg)",
            color: "var(--text)",
            fontSize: 13,
            fontFamily: "'Tajawal', sans-serif",
            outline: "none",
            cursor: "pointer",
          }}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">كل الفئات</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          style={{
            height: 38,
            padding: "0 10px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg)",
            color: "var(--text)",
            fontSize: 13,
            fontFamily: "'Tajawal', sans-serif",
            outline: "none",
            cursor: "pointer",
          }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">كل الحالات</option>
          <option value="in-stock">متوفر</option>
          <option value="low-stock">مخزون منخفض</option>
          <option value="out-of-stock">نفد المخزون</option>
        </select>

        <button
          onClick={() => setShowHidden((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            height: 38,
            padding: "0 12px",
            borderRadius: 8,
            border: `1px solid ${showHidden ? "#f97316" : "var(--border)"}`,
            background: showHidden ? "rgba(249,115,22,0.08)" : "transparent",
            color: showHidden ? "#f97316" : "var(--text-muted)",
            fontSize: 13,
            fontFamily: "'Tajawal', sans-serif",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          {showHidden ? <EyeOff size={14} /> : <Eye size={14} />}
          {showHidden ? "إخفاء المخفية" : "عرض المخفية"}
        </button>

        {(search || filterCategory || filterStatus) && (
          <button
            onClick={() => {
              setSearch("");
              setFilterCategory("");
              setFilterStatus("");
            }}
            style={{
              height: 38,
              padding: "0 14px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-muted)",
              fontSize: 13,
              fontFamily: "'Tajawal', sans-serif",
              cursor: "pointer",
            }}
          >
            مسح الفلاتر
          </button>
        )}
      </div>

      {/* Table */}
      <StorageTable
        search={search}
        filterCategory={filterCategory}
        filterStatus={filterStatus}
        showHidden={showHidden}
        refresh={refresh}
        onEdit={setEditItem}
        onAction={setActionItem}
        onDelete={handleDelete}
      />

      {/* Drawers */}
      <StorageDrawer
        open={addDrawer}
        onClose={() => setAddDrawer(false)}
        onSaved={() => setRefresh((r) => r + 1)}
        defaultExchange={defaultExchange}
      />
      <StorageDrawer
        open={!!editItem}
        onClose={() => setEditItem(null)}
        onSaved={() => setRefresh((r) => r + 1)}
        item={editItem}
        defaultExchange={defaultExchange}
      />
      {actionItem && (
        <ActionDrawer
          open={!!actionItem}
          onClose={() => setActionItem(null)}
          onSaved={() => setRefresh((r) => r + 1)}
          item={actionItem}
        />
      )}
    </div>
  );
}
