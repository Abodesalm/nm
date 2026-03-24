// ── Response helpers ──────────────────────────────────────────────────────────

export const get = async (url: string, queries?: Record<string, string>) => {
  const params = queries ? "?" + new URLSearchParams(queries).toString() : "";
  const res = await fetch(`${url}${params}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "GET failed");
  return data;
};

export const post = async (url: string, body: Record<string, any>) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "POST failed");
  return data;
};

export const patch = async (url: string, body: Record<string, any>) => {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "PATCH failed");
  return data;
};

export const del = async (url: string, body?: Record<string, any>) => {
  const res = await fetch(url, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "DELETE failed");
  return data;
};
