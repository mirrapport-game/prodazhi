import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { webhookSecret, handleUpdate } = await import("@/lib/bot.server");
        const { timingSafeEqual } = await import("node:crypto");
        const expected = Buffer.from(webhookSecret());
        const actual = Buffer.from(request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "");
        if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
          return new Response("Unauthorized", { status: 401 });
        }
        const update = await request.json().catch(() => null);
        if (!update || typeof update.update_id !== "number") return Response.json({ ok: true });
        try {
          await handleUpdate(update);
        } catch (e) {
          console.error("webhook error", e);
        }
        return Response.json({ ok: true });
      },
    },
  },
});
