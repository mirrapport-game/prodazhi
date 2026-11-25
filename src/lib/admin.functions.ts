import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertOwner(supabase: any) {
  const { data } = await supabase.rpc("is_owner");
  if (!data) throw new Error("Доступ только для владельца");
}

export const getBotStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context.supabase);
    const { tg, getOwnerId } = await import("./bot.server");
    const ownerId = await getOwnerId();
    try {
      const [me, info] = await Promise.all([tg("getMe", {}), tg("getWebhookInfo", {})]);
      return {
        ownerId,
        botUsername: me.username as string,
        webhookUrl: (info.url as string) || null,
        pending: (info.pending_update_count as number) ?? 0,
        lastError: (info.last_error_message as string) ?? null,
      };
    } catch {
      return { ownerId, botUsername: null, webhookUrl: null, pending: 0, lastError: "Не удалось связаться с Telegram" };
    }
  });

export const sendTestSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context.supabase);
    const { sendDailySummary } = await import("./bot.server");
    try {
      return await sendDailySummary({ force: true });
    } catch (e) {
      console.error(e);
      return { sent: false, reason: "Ошибка отправки" };
    }
  });
