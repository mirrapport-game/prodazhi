import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fmtMskDateTime } from "@/lib/msk";

export const Route = createFileRoute("/_app/chats")({
  head: () => ({ meta: [{ title: "Чаты — Rapport" }, { name: "description", content: "Группы и каналы, где работает бот." }, { property: "og:title", content: "Чаты — Rapport" }, { property: "og:description", content: "Сообщения и заявки из подключённых чатов." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Chats,
});

const CATS = { all: "Все", lead: "Заявки", question: "Вопросы", important: "Важное", normal: "Обычные" } as const;

function Chats() {
  const [chat, setChat] = useState<number | null>(null);
  const [cat, setCat] = useState<keyof typeof CATS>("all");
  const { data: sources = [] } = useQuery({
    queryKey: ["chat_sources"],
    queryFn: async () => (await supabase.from("chat_sources").select("*").order("added_at", { ascending: false })).data ?? [],
  });
  const { data: msgs = [] } = useQuery({
    queryKey: ["messages", chat, cat],
    queryFn: async () => {
      let q = supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(200);
      if (chat) q = q.eq("chat_id", chat);
      if (cat !== "all") q = q.eq("category", cat);
      return (await q).data ?? [];
    },
  });
  return (
    <div className="max-w-4xl">
      <h1 className="mb-6 text-3xl font-bold">Чаты</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button size="sm" variant={chat === null ? "default" : "secondary"} onClick={() => setChat(null)}>Все чаты</Button>
        {sources.map((s) => (
          <Button key={s.chat_id} size="sm" variant={chat === s.chat_id ? "default" : "secondary"} onClick={() => setChat(s.chat_id)}>
            {s.title ?? s.chat_id} <span className="opacity-60">{s.source === "vk" ? "ВК" : s.source === "instagram" ? "Instagram" : s.type === "channel" ? "TG канал" : "TG группа"}</span>
          </Button>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {Object.entries(CATS).map(([k, l]) => (
          <Button key={k} size="sm" variant={cat === k ? "outline" : "ghost"} onClick={() => setCat(k as keyof typeof CATS)}>{l}</Button>
        ))}
      </div>
      {!sources.length && <p className="mb-6 rounded-2xl border border-dashed p-6 text-muted-foreground">Бот ещё не добавлен ни в одну группу или канал.</p>}
      <ul className="space-y-2">
        {msgs.map((m) => (
          <li key={m.id} className="rounded-xl border bg-card p-4">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant={m.category === "normal" ? "outline" : "default"}>{CATS[m.category as keyof typeof CATS]}</Badge>
              <span>{m.source === "vk" ? "ВК" : m.source === "instagram" ? "Instagram" : "TG"} · {m.chat_title}</span>·<span>{m.sender_name}</span>·<span>{fmtMskDateTime(m.created_at)}</span>
              {m.message_link && <a className="text-primary underline" href={m.message_link} target="_blank" rel="noreferrer">открыть</a>}
            </div>
            <p className="whitespace-pre-wrap text-sm">{m.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
