import { getStore } from "@netlify/blobs";

// Accepts either the legacy payload (data = array of requests, tool v1.2–v1.4)
// or the current payload (data = {reqs, addBase, removals, statusEv, jira}, tool v1.5+).
function validData(d) {
  if (Array.isArray(d)) return true;
  if (d && typeof d === "object") {
    const arrays = ["reqs", "addBase", "removals", "statusEv"];
    if (!arrays.every(k => d[k] === undefined || Array.isArray(d[k]))) return false;
    if (d.jira !== undefined && (typeof d.jira !== "object" || Array.isArray(d.jira))) return false;
    return true;
  }
  return false;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,PUT,POST,OPTIONS",
  "Access-Control-Allow-Headers": "content-type,x-team-key"
};
function resp(body, status, extra) {
  return new Response(body, { status, headers: Object.assign({}, CORS, extra || {}) });
}

export default async (req) => {
  if (req.method === "OPTIONS") return resp(null, 204);
  const key = process.env.TEAM_KEY;
  if (key && req.headers.get("x-team-key") !== key) {
    return resp(JSON.stringify({ error: "unauthorized" }), 401, { "Content-Type": "application/json" });
  }
  const store = getStore({ name: "tb2-requests", consistency: "strong" });

  if (req.method === "GET") {
    const v = await store.get("requests", { type: "json" });
    return resp(JSON.stringify(v || { savedAt: null, data: null }), 200, { "Content-Type": "application/json" });
  }
  if (req.method === "PUT" || req.method === "POST") {
    let body;
    try { body = await req.json(); } catch { return resp("bad json", 400); }
    if (!validData(body.data)) return resp("unexpected data shape", 400);
    const rec = { savedAt: new Date().toISOString(), data: body.data };
    await store.setJSON("requests", rec);
    return resp(JSON.stringify(rec), 200, { "Content-Type": "application/json" });
  }
  return resp("method not allowed", 405);
};

export const config = { path: "/api/requests" };
