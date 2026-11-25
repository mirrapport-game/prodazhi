<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Business + Buddy lives under /business with browser-local demo data and a dedicated provider; it never reads or changes CRM data, and live buddies, social publication and real payments require a later connected implementation.
- The generated PWA worker registers through one preview-guarded wrapper and caches only /business navigations with NetworkFirst; CRM, authentication and API responses must never be cached.
- CRM audiences live in owner-managed crm_cabinets and contacts reference them through nullable audience_id; unassigned contacts remain outside audience funnels until the owner assigns them, permitting custom cabinets without guessed attribution.
- Contact source and audience cabinet are independent fields; each cabinet can contain all supported channels, with channel filters rather than separate channel funnels.
- VK CRM contacts are keyed by community and sender separately from Telegram; incoming messages append reply history without resetting advanced stages or assigned cabinets, avoiding cross-platform identity collisions.
- VK API reads use the linked custom connector gateway and its server-only credentials — keeps provider tokens out of application URLs and source.
- Telegram bot logic lives in `src/lib/bot.server.ts`; webhook and cron entry points are thin routes under `src/routes/api/public/` — keeps one server-only module for all bot behavior.
- All date/time math uses fixed Moscow time (UTC+3) helpers, never the server's local zone — the bot owner works in MSK.
- Bot owner = first Telegram user to send /start (`users` table); dashboard owner = first auth signup (`app_owner`, RLS via `is_owner()`) — single-owner app.
