import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

export const Route = createFileRoute("/api/public/jobs/meeting-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const fail = await authenticateCronRequest(request);
        if (fail) return fail;
        const { sendMeetingReminders } = await import("@/lib/bot.server");
        try {
          return Response.json(await sendMeetingReminders());
        } catch (e) {
          console.error("reminders failed", e);
          return Response.json({ ok: false }, { status: 500 });
        }
      },
    },
  },
});
