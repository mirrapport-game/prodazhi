import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Brain, Scissors, Stethoscope, UserRound, Heart, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STAGES, stageLabel, contactsForCabinet, type CabinetView } from "@/lib/crm";
import { fmtMskDateTime } from "@/lib/msk";

export const Route = createFileRoute("/_app/crm")({
  head: () => ({ meta: [{ title: "Кабинеты CRM — Rapport" }, { name: "description", content: "Пять отдельных воронок рассылок: психологи, салоны красоты, медицинские клиники, свободные и люди в отношениях." }, { property: "og:title", content: "Кабинеты CRM — Rapport" }, { property: "og:description", content: "Контакты, этапы и история общения по пяти аудиториям рассылок." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Crm,
});

type C = { id: string; name: string; username: string | null; phone: string | null; audience_id: string | null; source: string; vk_user_id: number | null; vk_group_id: number | null; stage: string; note: string | null; last_message: string | null; last_contact_at: string };
const SOURCES = [{ id: "telegram", label: "ТГ" }, { id: "vk", label: "ВК" }, { id: "instagram", label: "Instagram" }] as const;
const sourceLabel = (id: string) => SOURCES.find((s) => s.id === id)?.label ?? id;
const CABINET_ICONS = [Brain, Scissors, Stethoscope, UserRound, Heart];

function Crm() {
  const qc = useQueryClient();
  const [open, setOpen] = useState<C | null>(null);
  const [adding, setAdding] = useState(false);
  const [addingCabinet, setAddingCabinet] = useState(false);
  const [cabinetDraft, setCabinetDraft] = useState({ name: "", purpose: "" });
  const [cabinet, setCabinet] = useState<CabinetView>("psychologists");
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState("all");
  const [draft, setDraft] = useState({ name: "", username: "", phone: "", source: "telegram" });
  const { data: cabinets = [], isError: cabinetsError } = useQuery({
    queryKey: ["crm-cabinets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_cabinets").select("*").order("created_at").order("id");
      if (error) throw error;
      return data ?? [];
    },
  });
  const cabinetLabel = (id: string | null) => cabinets.find((c) => c.id === id)?.name ?? "Нераспределённые";
  async function addCabinet() {
    if (!cabinetDraft.name.trim()) { toast.error("Укажите название кабинета"); return; }
    setBusy(true);
    const id = crypto.randomUUID();
    const { error } = await supabase.from("crm_cabinets").insert({ id, name: cabinetDraft.name.trim(), purpose: cabinetDraft.purpose.trim() });
    setBusy(false);
    if (error) { toast.error("Не удалось создать кабинет"); return; }
    await qc.invalidateQueries({ queryKey: ["crm-cabinets"] });
    setCabinet(id);
    setAddingCabinet(false);
    setCabinetDraft({ name: "", purpose: "" });
    toast.success("Кабинет создан");
  }
  const { data: contacts = [], isLoading, isError } = useQuery({
    queryKey: ["crm"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_contacts").select("*").order("last_contact_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as C[];
    },
  });
  const { data: events = [] } = useQuery({
    queryKey: ["crm-events", open?.id],
    enabled: !!open,
    queryFn: async () => {
      if (!open) return [];
      const { data, error } = await supabase.from("crm_events").select("*").eq("contact_id", open.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["crm"] });

  async function setStage(c: C, stage: string) {
    const { error } = await supabase.from("crm_contacts").update({ stage }).eq("id", c.id);
    if (error) { toast.error("Не удалось изменить этап"); return; }
    await supabase.from("crm_events").insert({ contact_id: c.id, kind: "stage", text: `${stageLabel(c.stage)} → ${stageLabel(stage)}` });
    setOpen({ ...c, stage });
    refresh();
    qc.invalidateQueries({ queryKey: ["crm-events"] });
  }
  async function add() {
    if (!draft.name.trim()) { toast.error("Укажите имя"); return; }
    setBusy(true);
    const { error } = await supabase.from("crm_contacts").insert({ name: draft.name.trim(), source: draft.source, username: draft.username.replace(/^@/, "").trim() || null, phone: draft.phone || null, audience_id: cabinet === "unassigned" ? null : cabinet });
    setBusy(false);
    if (error) { toast.error("Не удалось добавить"); return; }
    setAdding(false);
    setDraft({ name: "", username: "", phone: "", source: "telegram" });
    refresh();
  }
  async function saveNote(c: C, note: string) {
    const { error } = await supabase.from("crm_contacts").update({ note }).eq("id", c.id);
    if (error) { toast.error("Не удалось сохранить заметку"); return; }
    setOpen((current) => current?.id === c.id ? { ...current, note } : current);
    refresh();
  }

  async function moveContact(c: C, target: string) {
    const value = target === "unassigned" ? null : target;
    const { error } = await supabase.from("crm_contacts").update({ audience_id: value }).eq("id", c.id);
    if (error) { toast.error("Не удалось сменить кабинет"); return; }
    const { error: historyError } = await supabase.from("crm_events").insert({ contact_id: c.id, kind: "note", text: `Кабинет: ${cabinetLabel(c.audience_id)} → ${cabinetLabel(value)}` });
    setOpen({ ...c, audience_id: value });
    refresh();
    qc.invalidateQueries({ queryKey: ["crm-events", c.id] });
    if (historyError) toast.error("Кабинет изменён, но запись в историю не сохранена");
    else toast.success("Кабинет изменён");
  }

  const visibleContacts = contactsForCabinet(contacts, cabinet).filter((c) => source === "all" || c.source === source);
  const selected = cabinets.find((c) => c.id === cabinet);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">CRM</h1>
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setAddingCabinet(true)}><Plus className="h-4 w-4" /> Кабинет</Button><Button onClick={() => setAdding(true)} disabled={cabinet !== "unassigned" && !selected}><Plus className="h-4 w-4" /> Клиент</Button></div>
      </div>
      <nav aria-label="Кабинеты CRM" className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {cabinets.map((item, i) => {
          const Icon = CABINET_ICONS[i] ?? Inbox;
          return <Button key={item.id} variant={cabinet === item.id ? "default" : "outline"} aria-pressed={cabinet === item.id} onClick={() => { setCabinet(item.id); setOpen(null); }} className="h-auto min-h-16 justify-start gap-3 whitespace-normal px-3 py-3 text-left">
            <Icon className="h-5 w-5 shrink-0" />
            <span className="min-w-0 flex-1 break-words">{item.name}</span>
            <span className="shrink-0 tabular-nums">{contactsForCabinet(contacts, item.id).length}</span>
          </Button>;
        })}
      </nav>
      {cabinetsError && <p className="mb-4 text-destructive">Не удалось загрузить кабинеты.</p>}
      <Button variant={cabinet === "unassigned" ? "secondary" : "ghost"} className="mb-6" aria-pressed={cabinet === "unassigned"} onClick={() => { setCabinet("unassigned"); setOpen(null); }}><Inbox className="h-4 w-4" /> Нераспределённые · {contactsForCabinet(contacts, "unassigned").length}</Button>
      <header className="mb-5 border-b pb-4">
        <h2 className="break-words text-xl font-semibold">{selected?.name ?? "Нераспределённые"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{selected?.purpose ?? "Без выбранной аудитории"} · {visibleContacts.length} контактов</p>
      </header>
      <div aria-label="Площадки" className="mb-5 flex flex-wrap gap-2">
        {[{ id: "all", label: "Все площадки" }, ...SOURCES].map((s) => <Button key={s.id} size="sm" variant={source === s.id ? "default" : "outline"} aria-pressed={source === s.id} onClick={() => setSource(s.id)}>{s.label}</Button>)}
      </div>
      {isLoading ? <p className="text-muted-foreground">Загрузка…</p> : isError ? <div><p className="text-destructive">Не удалось загрузить контакты.</p><Button variant="outline" onClick={() => refresh()}>Повторить</Button></div> : <div aria-label="Воронка кабинета" className="flex max-w-full gap-3 overflow-x-auto pb-4">
        {STAGES.map((s) => {
          const list = visibleContacts.filter((c) => c.stage === s.id);
          return (
            <section key={s.id} className="w-64 shrink-0 border-t-2 border-border px-1 pt-3">
              <h2 className="mb-3 flex justify-between px-1 font-sans text-sm font-semibold">{s.label}<span className="text-muted-foreground">{list.length}</span></h2>
              <ul className="space-y-2">
                {list.map((c) => (
                  <li key={c.id}>
                    <Button variant="outline" onClick={() => setOpen(c)} className="h-auto w-full flex-col items-stretch gap-0 whitespace-normal rounded-lg bg-card p-3 text-left">
                      <div className="break-words font-semibold">{c.name}</div>
                      <div className="mt-1 text-xs text-primary">{sourceLabel(c.source)}</div>
                      {c.last_message && <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.last_message}</div>}
                      <div className="mt-2 text-[11px] text-muted-foreground">{fmtMskDateTime(c.last_contact_at)}</div>
                    </Button>
                  </li>
                ))}
              </ul>
              {!list.length && <p className="py-5 text-center text-xs text-muted-foreground">Нет контактов</p>}
            </section>
          );
        })}
      </div>}

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          {open && (
            <>
              <DialogHeader><DialogTitle>{open.name}</DialogTitle></DialogHeader>
              <div className="text-sm text-muted-foreground">
                <span>{sourceLabel(open.source)} · </span>
                {open.username && open.source !== "vk" && <a className="text-primary underline" href={open.source === "instagram" ? `https://www.instagram.com/${encodeURIComponent(open.username)}/` : `https://t.me/${encodeURIComponent(open.username)}`} target="_blank" rel="noreferrer">@{open.username}</a>} {open.phone}
                {open.vk_user_id && <a className="text-primary underline" href={`https://vk.com/gim${open.vk_group_id}?sel=${open.vk_user_id}`} target="_blank" rel="noreferrer">Открыть диалог ВК</a>}
              </div>
              <div><Label>Кабинет</Label>
                <Select value={open.audience_id ?? "unassigned"} onValueChange={(v) => moveContact(open, v)}>
                  <SelectTrigger aria-label="Кабинет клиента"><SelectValue /></SelectTrigger>
                  <SelectContent>{cabinets.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}<SelectItem value="unassigned">Нераспределённые</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Этап</Label>
                <Select value={open.stage} onValueChange={(v) => setStage(open, v)}>
                  <SelectTrigger aria-label="Этап клиента"><SelectValue /></SelectTrigger>
                  <SelectContent>{STAGES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Заметка</Label><Textarea defaultValue={open.note ?? ""} onBlur={(e) => saveNote(open, e.target.value)} /></div>
              <div>
                <Label>История</Label>
                <ul className="mt-2 space-y-2">
                  {events.map((e) => (
                    <li key={e.id} className="rounded-lg border p-2 text-sm">
                      <div className="text-[11px] text-muted-foreground">{fmtMskDateTime(e.created_at)} · {e.kind === "reply" ? "ответ" : e.kind === "stage" ? "этап" : "заметка"}</div>
                      <div className="whitespace-pre-wrap">{e.text}</div>
                    </li>
                  ))}
                  {!events.length && <li className="text-sm text-muted-foreground">Пока пусто.</li>}
                </ul>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={addingCabinet} onOpenChange={setAddingCabinet}>
        <DialogContent><DialogHeader><DialogTitle>Новый кабинет</DialogTitle></DialogHeader>
          <div className="grid gap-3"><div><Label htmlFor="cabinet-name">Название</Label><Input id="cabinet-name" maxLength={100} value={cabinetDraft.name} onChange={(e) => setCabinetDraft({ ...cabinetDraft, name: e.target.value })} /></div><div><Label htmlFor="cabinet-purpose">Цель рассылки</Label><Input id="cabinet-purpose" value={cabinetDraft.purpose} onChange={(e) => setCabinetDraft({ ...cabinetDraft, purpose: e.target.value })} /></div></div>
          <DialogFooter><Button disabled={busy} onClick={addCabinet}>{busy ? "Сохранение…" : "Создать"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader><DialogTitle>Новый клиент · {cabinetLabel(cabinet)}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Площадка</Label><Select value={draft.source} onValueChange={(v) => setDraft({ ...draft, source: v })}><SelectTrigger aria-label="Площадка клиента"><SelectValue /></SelectTrigger><SelectContent>{SOURCES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent></Select></div>
            <div><Label htmlFor="client-name">Имя</Label><Input id="client-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
            <div><Label>Ник</Label><Input placeholder="без @" value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} /></div>
            <div><Label>Телефон</Label><Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></div>
          </div>
          <DialogFooter><Button disabled={busy} onClick={add}>{busy ? "Сохранение…" : "Добавить"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
