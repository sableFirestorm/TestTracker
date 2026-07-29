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

export default async (req) => {
  const key = process.env.TEAM_KEY;
  if (key && req.headers.get("x-team-key") !== key) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" }
    });
  }
  const store = getStore({ name: "tb2-requests", consistency: "strong" });

  if (req.method === "GET") {
    const v = await store.get("requests", { type: "json" });
    return Response.json(v || { savedAt: null, data: null });
  }
  if (req.method === "PUT" || req.method === "POST") {
    let body;
    try { body = await req.json(); } catch { return new Response("bad json", { status: 400 }); }
    if (!validData(body.data)) return new Response("unexpected data shape", { status: 400 });
    const rec = { savedAt: new Date().toISOString(), data: body.data };
    await store.setJSON("requests", rec);
    return Response.json(rec);
  }
  return new Response("method not allowed", { status: 405 });
};

export const config = { path: "/api/requests" };
