import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

export const Route = createFileRoute("/api/public/jobs/daily-summary")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const fail = await authenticateCronRequest(request);
        if (fail) return fail;
        const { sendDailySummary } = await import("@/lib/bot.server");
        try {
          return Response.json(await sendDailySummary());
        } catch (e) {
          console.error("daily summary failed", e);
          return Response.json({ ok: false }, { status: 500 });
        }
      },
    },
  },
});
