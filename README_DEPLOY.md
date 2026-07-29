# TB2 Evidence Tree — Netlify Deploy (shared state)

Marking: FIRESTORM PROPRIETARY — INTERNAL USE ONLY (no CUI/ITAR content).

## Deploy (~5 minutes)
1. Push this folder to a Git repo (or drag-drop won't work here — Functions require a
   repo or CLI deploy). CLI route: `npm i -g netlify-cli && netlify deploy --prod`.
2. Netlify auto-detects the function at netlify/functions/requests.mjs → served at /api/requests.
3. Netlify Blobs needs no setup — the function uses store "tb2-requests" automatically.

## Access control (recommended)
- Set env var `TEAM_KEY` (Site settings → Environment variables) to any shared secret.
  Visitors are prompted once for the key; it's stored in their browser. Without TEAM_KEY
  the endpoint is open to anyone with the URL.
- For stronger control use Netlify's site-wide password / SSO on top.

## How shared state works
- Every visitor GETs /api/requests on load → same request queue for everyone.
- Submissions/dispositions autosave ~1.5s after each change (PUT), with a conflict prompt
  if someone else saved in between (last write wins after explicit confirmation).
- The tree + 189-row execution registry are embedded read-only in index.html; they change
  only at controlled Tracker seed merges — redeploy index.html at each merge point.
- The same index.html still works as a Confluence attachment (Confluence mode takes
  priority) and standalone (local mode + EXPORT/IMPORT).

## Updating at a seed merge
Replace index.html with the regenerated tool and redeploy. The requests blob is untouched
by redeploys, so the queue survives.
