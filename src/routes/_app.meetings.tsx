import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { fmtDay, mskDate } from "@/lib/msk";

export const Route = createFileRoute("/_app/meetings")({
  head: () => ({ meta: [{ title: "Встречи — Rapport" }, { name: "description", content: "Встречи на сегодня, завтра и неделю." }, { property: "og:title", content: "Встречи — Rapport" }, { property: "og:description", content: "Расписание встреч и напоминания по московскому времени." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Meetings,
});

type M = { id: string; date: string; time: string | null; with_whom: string | null; topic: string | null; prepare: string | null; status: string };
const RANGES = { today: [0, 0, "Сегодня"], tomorrow: [1, 1, "Завтра"], week: [0, 6, "Неделя"], all: [-30, 365, "Все"] } as const;

function Meetings() {
  const qc = useQueryClient();
  const [range, setRange] = useState<keyof typeof RANGES>("week");
  const [edit, setEdit] = useState<Partial<M> | null>(null);
  const [from, to] = RANGES[range];
  const { data = [], isLoading } = useQuery({
    queryKey: ["meetings", range],
    queryFn: async () => {
      const { data, error } = await supabase.from("meetings").select("*").gte("date", mskDate(from)).lte("date", mskDate(to)).order("date").order("time");
      if (error) throw error;
      return data as M[];
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["meetings"] });

  async function save() {
    if (!edit?.date) { toast.error("Укажите дату"); return; }
    const row = { date: edit.date, time: edit.time || null, with_whom: edit.with_whom || null, topic: edit.topic || null, prepare: edit.prepare || null, status: "confirmed" };
    const { error } = edit.id ? await supabase.from("meetings").update(row).eq("id", edit.id) : await supabase.from("meetings").insert(row);
    if (error) { toast.error("Не удалось сохранить"); return; }
    setEdit(null);
    refresh();
  }
  async function remove(id: string) {
    await supabase.from("meetings").delete().eq("id", id);
    refresh();
  }

  const groups = data.reduce<Record<string, M[]>>((acc, m) => ((acc[m.date] ??= []).push(m), acc), {});

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Встречи</h1>
        <Button onClick={() => setEdit({ date: mskDate(0) })}><Plus className="h-4 w-4" /> Добавить</Button>
      </div>
      <div className="mb-6 flex gap-2">
        {Object.entries(RANGES).map(([k, v]) => (
          <Button key={k} size="sm" variant={range === k ? "default" : "secondary"} onClick={() => setRange(k as keyof typeof RANGES)}>{v[2]}</Button>
        ))}
      </div>
      {isLoading ? <p className="text-muted-foreground">Загрузка…</p> : !data.length ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">Встреч нет. Напишите боту, например: «завтра в 15:00 с Иваном».</p>
      ) : (
        <div className="space-y-8">
          {Object.entries(groups).map(([date, ms]) => (
            <section key={date}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{fmtDay(date)}</h2>
              <ul className="space-y-2">
                {ms.map((m) => (
                  <li key={m.id} className="flex gap-4 rounded-xl border bg-card p-4">
                    <div className="w-14 shrink-0 font-display text-lg text-primary">{m.time?.slice(0, 5) ?? "—"}</div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{m.with_whom ?? "Без участника"} {m.status === "pending" && <Badge variant="secondary" className="ml-1">не подтверждена</Badge>}</div>
                      {m.topic && <div className="text-sm">{m.topic}</div>}
                      {m.prepare && <div className="mt-1 text-sm text-muted-foreground">📋 {m.prepare}</div>}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setEdit(m)} aria-label="Изменить"><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(m.id)} aria-label="Удалить"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.id ? "Изменить встречу" : "Новая встреча"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Дата</Label><Input type="date" value={edit?.date ?? ""} onChange={(e) => setEdit({ ...edit, date: e.target.value })} /></div>
              <div><Label>Время (МСК)</Label><Input type="time" value={edit?.time?.slice(0, 5) ?? ""} onChange={(e) => setEdit({ ...edit, time: e.target.value })} /></div>
            </div>
            <div><Label>С кем</Label><Input value={edit?.with_whom ?? ""} onChange={(e) => setEdit({ ...edit, with_whom: e.target.value })} /></div>
            <div><Label>Тема</Label><Input value={edit?.topic ?? ""} onChange={(e) => setEdit({ ...edit, topic: e.target.value })} /></div>
            <div><Label>Что подготовить</Label><Input value={edit?.prepare ?? ""} onChange={(e) => setEdit({ ...edit, prepare: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={save}>Сохранить</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
