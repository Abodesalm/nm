"use client";

import { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { EmployeeDrawer } from "@/components/employees/EmployeeDrawer";
import { AbsentsDrawer } from "@/components/employees/AbsentsDrawer";
import { SalariesDrawer } from "@/components/employees/SalariesDrawer";
import { LoansDrawer } from "@/components/employees/LoansDrawer";

export default function EmployeesPage() {
  const [settings, setSettings] = useState<any>({
    departments: [],
    roles: [],
    defaultExchangeRate: 15000,
  });
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [refresh, setRefresh] = useState(0);

  const [addDrawer, setAddDrawer] = useState(false);
  const [editEmployee, setEditEmployee] = useState<any>(null);
  const [absentsEmployee, setAbsentsEmployee] = useState<any>(null);
  const [salariesEmployee, setSalariesEmployee] = useState<any>(null);
  const [loansEmployee, setLoansEmployee] = useState<any>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    const [settingsRes, hrRes] = await Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/settings/hr").then((r) => r.json()),
    ]);
    setSettings({
      departments: hrRes.data?.departments ?? [],
      roles: hrRes.data?.roles ?? [],
      defaultExchangeRate: settingsRes.data?.defaultExchangeRate ?? 15000,
    });
  }

  async function handleDelete(id: string) {
    await fetch(`/api/employees/${id}`, { method: "DELETE" });
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
            الموظفين
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            إدارة بيانات الموظفين
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
          <Plus size={16} /> إضافة موظف
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
              width: "90%",
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
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="">كل المسميات</option>
          {settings.roles.map((r: any) => (
            <option key={r._id} value={r.name}>
              {r.name}
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
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
        >
          <option value="">كل الأقسام</option>
          {settings.departments.map((d: any) => (
            <option key={d._id} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>
        {(search || filterRole || filterDept) && (
          <button
            onClick={() => {
              setSearch("");
              setFilterRole("");
              setFilterDept("");
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
      <EmployeeTable
        search={search}
        filterRole={filterRole}
        filterDept={filterDept}
        refresh={refresh}
        onEdit={setEditEmployee}
        onAbsents={setAbsentsEmployee}
        onSalaries={setSalariesEmployee}
        onLoans={setLoansEmployee}
        onDelete={handleDelete}
      />

      {/* Drawers */}
      <EmployeeDrawer
        open={addDrawer}
        onClose={() => setAddDrawer(false)}
        onSaved={() => setRefresh((r) => r + 1)}
        settings={settings}
      />
      <EmployeeDrawer
        open={!!editEmployee}
        onClose={() => setEditEmployee(null)}
        onSaved={() => setRefresh((r) => r + 1)}
        employee={editEmployee}
        settings={settings}
      />
      {absentsEmployee && (
        <AbsentsDrawer
          open={!!absentsEmployee}
          onClose={() => setAbsentsEmployee(null)}
          employee={absentsEmployee}
        />
      )}
      {salariesEmployee && (
        <SalariesDrawer
          open={!!salariesEmployee}
          onClose={() => setSalariesEmployee(null)}
          employee={salariesEmployee}
          defaultExchange={settings.defaultExchangeRate}
          onUpdate={() => setRefresh((r) => r + 1)}
        />
      )}
      {loansEmployee && (
        <LoansDrawer
          open={!!loansEmployee}
          onClose={() => setLoansEmployee(null)}
          employee={loansEmployee}
          defaultExchange={settings.defaultExchangeRate}
          onUpdate={() => setRefresh((r) => r + 1)}
        />
      )}
    </div>
  );
}
