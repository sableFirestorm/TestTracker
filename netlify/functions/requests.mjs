import { getStore } from "@netlify/blobs";

export default async (req) => {
  // Optional shared-key gate: set TEAM_KEY in Netlify env vars to enable.
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
    if (!Array.isArray(body.data)) return new Response("data must be an array", { status: 400 });
    const rec = { savedAt: new Date().toISOString(), data: body.data };
    await store.setJSON("requests", rec);
    return Response.json(rec);
  }
  return new Response("method not allowed", { status: 405 });
};

export const config = { path: "/api/requests" };
