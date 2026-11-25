import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fmtMskDateTime } from "@/lib/msk";

export const Route = createFileRoute("/_app/leads")({
  head: () => ({ meta: [{ title: "Заявки — Rapport" }, { name: "description", content: "Заявки и вопросы из чатов." }, { property: "og:title", content: "Заявки — Rapport" }, { property: "og:description", content: "Новые и обработанные заявки из чатов." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Leads,
});

function Leads() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"new" | "processed" | "all">("new");
  const { data = [] } = useQuery({
    queryKey: ["leads", filter],
    queryFn: async () => {
      let q = supabase.from("leads").select("id, status, created_at, messages(chat_title, sender_name, text, category, message_link)").order("created_at", { ascending: false }).limit(200);
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
  async function done(id: string) {
    await supabase.from("leads").update({ status: "processed" }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["leads"] });
  }
  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-3xl font-bold">Заявки из чатов</h1>
      <div className="mb-6 flex gap-2">
        {([["new", "Новые"], ["processed", "Обработанные"], ["all", "Все"]] as const).map(([k, l]) => (
          <Button key={k} size="sm" variant={filter === k ? "default" : "secondary"} onClick={() => setFilter(k)}>{l}</Button>
        ))}
      </div>
      {!data.length ? <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">Заявок нет.</p> : (
        <ul className="space-y-3">
          {data.map((l) => (
            <li key={l.id} className="rounded-xl border bg-card p-4">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant={l.messages?.category === "lead" ? "default" : "secondary"}>{l.messages?.category === "lead" ? "Заявка" : "Вопрос"}</Badge>
                <span>{l.messages?.chat_title}</span>·<span>{l.messages?.sender_name}</span>·<span>{fmtMskDateTime(l.created_at)}</span>
              </div>
              <p className="whitespace-pre-wrap">{l.messages?.text}</p>
              <div className="mt-3 flex gap-2">
                {l.messages?.message_link && <Button size="sm" variant="secondary" asChild><a href={l.messages.message_link} target="_blank" rel="noreferrer">Открыть в Telegram</a></Button>}
                {l.status === "new" && <Button size="sm" onClick={() => done(l.id)}>Обработано</Button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
