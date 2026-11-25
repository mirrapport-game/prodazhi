import { createFileRoute } from "@tanstack/react-router";

// VK Callback API: community messages. Caller verified by the shared secret configured in VK.
export const Route = createFileRoute("/api/public/vk/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as any;
        if (!body || typeof body.type !== "string") return new Response("ok");
        const { timingSafeEqual } = await import("node:crypto");
        const expected = Buffer.from(process.env["VK_SECRET"] ?? "");
        const actual = Buffer.from(String(body.secret ?? ""));
        if (!expected.length || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
          return new Response("forbidden", { status: 403 });
        }
        if (body.type === "confirmation") return new Response(process.env["VK_CONFIRMATION_CODE"] ?? "");

        if (body.type === "message_new") {
          const msg = body.object?.message ?? body.object;
          const text: string = msg?.text ?? "";
          const groupId = Number(body.group_id);
          if (text.trim() && msg?.from_id > 0) {
            try {
              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
              // event_id dedupe (VK retries)
              const { error: dup } = await supabaseAdmin.from("notifications_log").insert({ type: "vk_event", ref_id: String(body.event_id ?? `${groupId}:${msg.id}`) });
              if (dup) return new Response("ok");
              let name = `id${msg.from_id}`;
              let groupName = "Сообщество ВК";
              const connectionKey = process.env["UDC_CONNECTOR_API_KEY"];
              const gatewayKey = process.env["LOVABLE_API_KEY"];
              if (connectionKey && gatewayKey) {
                const gatewayUrl = "https://connector-gateway.lovable.dev/udc_connector";
                const headers = { Authorization: `Bearer ${gatewayKey}`, "X-Connection-Api-Key": connectionKey };
                const readVk = async (path: string) => {
                  const response = await fetch(`${gatewayUrl}${path}`, { headers });
                  if (!response.ok) {
                    const body = await response.text();
                    console.error(`VK request failed [${response.status}]: ${body}`);
                    throw new Error(`VK request failed [${response.status}]: ${body}`);
                  }
                  const data = await response.json();
                  if (data.error) {
                    console.error(`VK request failed [${response.status}]: ${JSON.stringify(data.error)}`);
                    throw new Error(`VK request failed [${response.status}]: ${JSON.stringify(data.error)}`);
                  }
                  return data;
                };
                const [u, g] = await Promise.all([
                  readVk(`/method/users.get?user_ids=${msg.from_id}&v=5.199`).catch(() => null),
                  readVk(`/method/groups.getById?group_id=${groupId}&v=5.199`).catch(() => null),
                ]);
                const p = u?.response?.[0];
                if (p) name = `${p.first_name} ${p.last_name}`;
                const gr = g?.response?.groups?.[0] ?? g?.response?.[0];
                if (gr?.name) groupName = gr.name;
              }
              const chatId = -(1_000_000_000_000 + groupId); // namespace VK communities apart from Telegram ids
              await supabaseAdmin.from("chat_sources").upsert({ chat_id: chatId, title: groupName, type: "vk_community", source: "vk" });
              const { ingestMessage } = await import("@/lib/bot.server");
              await ingestMessage({
                source: "vk", chat_id: chatId, chat_title: groupName, chat_type: "vk",
                sender_id: msg.from_id, sender_name: name, text,
                message_link: `https://vk.com/gim${groupId}?sel=${msg.from_id}`,
              });
            } catch (e) {
              console.error("vk callback error", e);
            }
          }
        }
        return new Response("ok");
      },
    },
  },
});
