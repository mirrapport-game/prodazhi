// Server-only Telegram bot logic. Imported only from server route handlers / server fn handlers.
import { createHash } from "node:crypto";
import { STAGES, stageIndex, stageLabel } from "./crm";

const TG = "https://connector-gateway.lovable.dev/telegram";
const AI = "https://ai.gateway.lovable.dev/v1";
const MODEL = "google/gemini-3-flash-preview";
const NEUTRAL = "Не получилось обработать запрос, попробуйте ещё раз чуть позже.";

type Admin = Awaited<ReturnType<typeof getAdmin>>;
async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// ---------- Moscow time (UTC+3, no DST) ----------
export function mskNow() {
  return new Date(Date.now() + 3 * 3600_000);
}
export function mskDate(offsetDays = 0) {
  const d = mskNow();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
const WD = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
function humanDate(date: string) {
  if (date === mskDate(0)) return "сегодня";
  if (date === mskDate(1)) return "завтра";
  const d = new Date(date + "T00:00:00Z");
  return `${d.getUTCDate().toString().padStart(2, "0")}.${(d.getUTCMonth() + 1).toString().padStart(2, "0")} (${WD[d.getUTCDay()]})`;
}
function esc(s: string | null | undefined) {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---------- Telegram ----------
export async function tg(method: string, body: Record<string, unknown>) {
  const key = process.env["LOVABLE_API_KEY"];
  const tgKey = process.env["TELEGRAM_API_KEY"];
  if (!key || !tgKey) throw new Error("Telegram keys not configured");
  const res = await fetch(`${TG}/${method}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "X-Connection-Api-Key": tgKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; result?: any; description?: string };
  if (!res.ok || !json.ok) {
    console.error(`Telegram ${method} failed [${res.status}]: ${JSON.stringify(json)}`);
    throw new Error(`Telegram ${method} failed [${res.status}]: ${json.description ?? ""}`);
  }
  return json.result;
}
export function send(chat_id: number, text: string, extra: Record<string, unknown> = {}) {
  return tg("sendMessage", { chat_id, text, parse_mode: "HTML", disable_web_page_preview: true, ...extra });
}
export function webhookSecret() {
  return createHash("sha256").update(`telegram-webhook:${process.env["TELEGRAM_API_KEY"] ?? ""}`).digest("base64url");
}

// ---------- AI ----------
async function aiJson<T>(system: string, user: string): Promise<T> {
  const key = process.env["LOVABLE_API_KEY"];
  const res = await fetch(`${AI}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system + "\nОтвечай строго JSON-объектом." },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error(`AI failed [${res.status}]: ${t}`);
    throw new Error(`AI failed [${res.status}]`);
  }
  const j = (await res.json()) as any;
  const txt: string = j.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(txt.replace(/^```json\s*|```$/g, "").trim()) as T;
}
async function aiText(system: string, user: string): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  const res = await fetch(`${AI}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
  });
  if (!res.ok) {
    console.error(`AI failed [${res.status}]: ${await res.text()}`);
    throw new Error("AI failed");
  }
  const j = (await res.json()) as any;
  return j.choices?.[0]?.message?.content ?? "";
}
async function transcribe(fileId: string): Promise<string> {
  const file = await tg("getFile", { file_id: fileId });
  const dl = await fetch(`${TG}/file/${file.file_path}`, {
    headers: { Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`, "X-Connection-Api-Key": process.env["TELEGRAM_API_KEY"]! },
  });
  if (!dl.ok) throw new Error(`voice download failed ${dl.status}`);
  const bytes = await dl.arrayBuffer();
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: "audio/ogg" }), "voice.ogg");
  form.append("model", "openai/gpt-transcribe");
  form.append("language", "ru");
  const res = await fetch(`${AI}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}` },
    body: form,
  });
  if (!res.ok) {
    console.error(`Transcribe failed [${res.status}]: ${await res.text()}`);
    throw new Error("transcribe failed");
  }
  const j = (await res.json()) as { text?: string };
  return j.text ?? "";
}

type Parsed = {
  intent: "meeting" | "question" | "other";
  date: string | null;
  time: string | null;
  with_whom: string | null;
  topic: string | null;
  prepare: string | null;
};
async function parseMeeting(text: string): Promise<Parsed> {
  const now = mskNow();
  const nowStr = `${now.toISOString().slice(0, 16).replace("T", " ")} (${WD[now.getUTCDay()]}), часовой пояс Москва UTC+3`;
  return aiJson<Parsed>(
    `Ты помощник-секретарь. Сейчас ${nowStr}.
Определи намерение сообщения: "meeting" — пользователь хочет записать/запланировать встречу, звонок, дело на дату; "question" — вопрос к боту (например, о чатах, заявках, встречах); "other" — иное.
Для meeting извлеки поля: date (YYYY-MM-DD, учитывай относительные даты: завтра, в пятницу, через час), time (HH:MM, 24ч, "в три часа" днём = 15:00, null если не указано), with_whom, topic, prepare (что подготовить, null если нет).
Формат: {"intent":"...","date":...,"time":...,"with_whom":...,"topic":...,"prepare":...}`,
    text,
  );
}

// ---------- Formatting ----------
type Meeting = { id: string; date: string; time: string | null; with_whom: string | null; topic: string | null; prepare: string | null; status: string };
function fmtMeeting(m: Meeting, withDate = true) {
  const parts = [
    withDate ? humanDate(m.date) : null,
    m.time ? m.time.slice(0, 5) : "время не указано",
    m.with_whom,
    m.topic,
  ].filter(Boolean);
  let s = parts.map((p) => esc(p as string)).join(", ");
  if (m.prepare) s += `\n   📋 Подготовить: ${esc(m.prepare)}`;
  return s;
}
const confirmKb = (id: string) => ({
  inline_keyboard: [[
    { text: "✅ Верно", callback_data: `ok:${id}` },
    { text: "✏️ Изменить", callback_data: `edit:${id}` },
    { text: "🗑 Удалить", callback_data: `del:${id}` },
  ]],
});

async function listMeetings(db: Admin, from: string, to: string) {
  const { data } = await db.from("meetings").select("*").gte("date", from).lte("date", to).order("date").order("time", { nullsFirst: true });
  return (data ?? []) as Meeting[];
}
async function meetingsText(db: Admin, title: string, from: string, to: string) {
  const ms = await listMeetings(db, from, to);
  if (!ms.length) return `<b>${title}</b>\nВстреч нет.`;
  return `<b>${title}</b>\n` + ms.map((m, i) => `${i + 1}. ${fmtMeeting(m, from !== to)}${m.status === "pending" ? " <i>(не подтверждена)</i>" : ""}`).join("\n");
}

// ---------- Owner ----------
export async function getOwnerId(db?: Admin): Promise<number | null> {
  db ??= await getAdmin();
  const { data } = await db.from("users").select("telegram_id").order("created_at").limit(1).maybeSingle();
  return data ? Number(data.telegram_id) : null;
}

// ---------- Chats summary ----------
function msgLink(chat: any, messageId: number) {
  if (chat.username) return `https://t.me/${chat.username}/${messageId}`;
  const id = String(chat.id).replace(/^-100/, "");
  return `https://t.me/c/${id}/${messageId}`;
}
async function chatsDigest(db: Admin, sinceIso: string): Promise<string> {
  const { data } = await db.from("messages").select("chat_title, sender_name, text, category, message_link, created_at").gte("created_at", sinceIso).order("created_at").limit(400);
  const msgs = data ?? [];
  if (!msgs.length) return "<b>Что было в чатах</b>\nНовых сообщений нет.";
  const leads = msgs.filter((m) => m.category === "lead");
  const qs = msgs.filter((m) => m.category === "question");
  let out = "<b>Что было в чатах</b>\n";
  if (leads.length) out += `\n💼 <b>Заявки (${leads.length}):</b>\n` + leads.slice(0, 15).map((m) => `• ${esc(m.sender_name)} (${esc(m.chat_title)}): ${esc((m.text ?? "").slice(0, 150))}`).join("\n") + "\n";
  if (qs.length) out += `\n❓ <b>Вопросы к вам (${qs.length}):</b>\n` + qs.slice(0, 15).map((m) => `• ${esc(m.sender_name)} (${esc(m.chat_title)}): ${esc((m.text ?? "").slice(0, 150))}`).join("\n") + "\n";
  try {
    const corpus = msgs.map((m) => `[${m.chat_title}] ${m.sender_name}: ${(m.text ?? "").slice(0, 300)}`).join("\n").slice(0, 30000);
    const summary = await aiText("Сделай очень краткую сводку по каждому чату (1-2 предложения на чат) на русском. Формат: «Название: сводка», каждая с новой строки. Без markdown.", corpus);
    out += `\n📝 <b>Кратко по чатам:</b>\n${esc(summary.trim())}`;
  } catch (e) {
    console.error("digest summary failed", e);
  }
  return out;
}

// ---------- Daily summary & reminders ----------
export async function sendDailySummary(opts: { force?: boolean } = {}) {
  const db = await getAdmin();
  const owner = await getOwnerId(db);
  if (!owner) return { sent: false, reason: "no owner" };
  const today = mskDate(0);
  if (!opts.force) {
    const { error } = await db.from("notifications_log").insert({ type: "daily_summary", ref_id: today });
    if (error) return { sent: false, reason: "already sent" };
  }
  const ms = await listMeetings(db, today, today);
  let text = `☀️ <b>Доброе утро! Сводка на ${humanDate(today)}</b>\n\n`;
  text += ms.length ? "<b>Встречи:</b>\n" + ms.map((m, i) => `${i + 1}. ${fmtMeeting(m, false)}`).join("\n") : "<b>Встречи:</b> на сегодня нет.";
  text += "\n\n" + (await chatsDigest(db, new Date(Date.now() - 24 * 3600_000).toISOString()));
  await send(owner, text.slice(0, 4000));
  return { sent: true };
}

export async function sendMeetingReminders() {
  const db = await getAdmin();
  const owner = await getOwnerId(db);
  if (!owner) return { sent: 0 };
  const now = mskNow();
  const end = new Date(now.getTime() + 60 * 60_000);
  const dates = Array.from(new Set([now.toISOString().slice(0, 10), end.toISOString().slice(0, 10)]));
  const { data } = await db.from("meetings").select("*").in("date", dates).not("time", "is", null);
  let sent = 0;
  for (const m of (data ?? []) as Meeting[]) {
    const at = new Date(`${m.date}T${m.time!.slice(0, 5)}:00Z`); // MSK clock expressed as UTC
    if (at > now && at <= end) {
      const { error } = await db.from("notifications_log").insert({ type: "meeting_reminder", ref_id: m.id });
      if (error) continue;
      await send(owner, `⏰ <b>Через час встреча</b>\n${fmtMeeting(m)}`);
      sent++;
    }
  }
  return { sent };
}

// ---------- Webhook handling ----------
export async function handleUpdate(update: any) {
  const db = await getAdmin();
  const { error: dup } = await db.from("telegram_updates").insert({ update_id: update.update_id });
  if (dup) return; // retry of already-processed update

  if (update.my_chat_member) return onMyChatMember(db, update.my_chat_member);
  if (update.callback_query) return onCallback(db, update.callback_query);
  const msg = update.message ?? update.channel_post ?? update.edited_message ?? update.edited_channel_post;
  if (!msg) return;
  if (msg.new_chat_members && msg.chat.type !== "private") {
    const me = await tg("getMe", {});
    if (msg.new_chat_members.some((u: any) => u.id === me.id)) await registerChat(db, msg.chat);
  }
  if (msg.chat.type === "private") return onPrivate(db, msg);
  return onGroupMessage(db, msg);
}

async function registerChat(db: Admin, chat: any) {
  const { data: existing } = await db.from("chat_sources").select("chat_id").eq("chat_id", chat.id).maybeSingle();
  await db.from("chat_sources").upsert({ chat_id: chat.id, title: chat.title ?? null, type: chat.type });
  if (!existing) {
    const owner = await getOwnerId(db);
    if (owner) await send(owner, `➕ Бот добавлен в чат <b>${esc(chat.title)}</b> (${chat.type === "channel" ? "канал" : "группа"}).`).catch(() => {});
  }
}

async function onMyChatMember(db: Admin, upd: any) {
  const status = upd.new_chat_member?.status;
  if (upd.chat.type === "private") return;
  if (status === "administrator" || status === "member") await registerChat(db, upd.chat);
  if (status === "left" || status === "kicked") {
    const owner = await getOwnerId(db);
    if (owner) await send(owner, `➖ Бота удалили из чата <b>${esc(upd.chat.title)}</b>.`).catch(() => {});
  }
}

async function onGroupMessage(db: Admin, msg: any) {
  const text: string = msg.text ?? msg.caption ?? "";
  if (!text.trim()) return;
  const chat = msg.chat;
  const sender = msg.from ? [msg.from.first_name, msg.from.last_name].filter(Boolean).join(" ") + (msg.from.username ? ` (@${msg.from.username})` : "") : (msg.author_signature ?? chat.title);
  await db.from("chat_sources").upsert({ chat_id: chat.id, title: chat.title ?? null, type: chat.type, source: "telegram" });
  await ingestMessage({
    source: "telegram", chat_id: chat.id, chat_title: chat.title ?? null, chat_type: chat.type === "channel" ? "channel" : "group",
    sender_id: msg.from?.id ?? null, sender_name: sender, text, message_link: msgLink(chat, msg.message_id),
  }, db);
}

const SOURCE_LABEL: Record<string, string> = { telegram: "Telegram", vk: "ВКонтакте", instagram: "Instagram" };

export async function ingestMessage(
  m: { source: string; chat_id: number; chat_title: string | null; chat_type: string; sender_id: number | null; sender_name: string; text: string; message_link: string | null },
  db?: Admin,
) {
  db ??= await getAdmin();
  let category = "normal" as "lead" | "question" | "important" | "normal";
  try {
    const r = await aiJson<{ category: string }>(
      `Классифицируй входящее сообщение для владельца бизнеса в одну категорию:
"lead" — заявка/заказ/желание купить или записаться;
"question" — вопрос владельцу/администратору, требующий ответа;
"important" — важная информация (сроки, проблемы, договорённости);
"normal" — обычное общение. Формат: {"category":"..."}`,
      `Источник: ${SOURCE_LABEL[m.source] ?? m.source}\nЧат: ${m.chat_title}\nАвтор: ${m.sender_name}\nТекст: ${m.text.slice(0, 2000)}`,
    );
    if (["lead", "question", "important", "normal"].includes(r.category)) category = r.category as typeof category;
  } catch (e) {
    console.error("classify failed", e);
  }
  const { data: saved, error: saveError } = await db.from("messages").insert({ ...m, category, processed: true }).select("id").single();
  if (saveError) throw saveError;
  if (saved && m.source === "vk" && m.sender_id !== null) {
    const groupId = -m.chat_id - 1_000_000_000_000;
    const { data: existing, error: lookupError } = await db.from("crm_contacts").select("id, stage").eq("vk_user_id", m.sender_id).eq("vk_group_id", groupId).maybeSingle();
    if (lookupError) throw lookupError;
    let contactId = existing?.id;
    if (!contactId) {
      const { data: created, error } = await db.from("crm_contacts").upsert({ name: m.sender_name, source: "vk", vk_user_id: m.sender_id, vk_group_id: groupId, stage: "replied" }, { onConflict: "vk_group_id,vk_user_id", ignoreDuplicates: true }).select("id").maybeSingle();
      if (error) throw error;
      contactId = created?.id;
      if (!contactId) {
        const { data: raced, error: raceError } = await db.from("crm_contacts").select("id").eq("vk_user_id", m.sender_id).eq("vk_group_id", groupId).single();
        if (raceError) throw raceError;
        contactId = raced?.id;
      }
    }
    if (contactId) {
      const patch = { last_message: m.text.slice(0, 500), last_contact_at: new Date().toISOString(), ...(existing?.stage === "first_touch" ? { stage: "replied" } : {}) };
      const { error } = await db.from("crm_contacts").update(patch).eq("id", contactId);
      if (error) throw error;
      const { error: eventError } = await db.from("crm_events").insert({ contact_id: contactId, kind: "reply", text: `ВК · ${m.text}` });
      if (eventError) throw eventError;
    }
  }
  if (saved && (category === "lead" || category === "question")) {
    await db.from("leads").insert({ message_id: saved.id });
    const { error } = await db.from("notifications_log").insert({ type: "lead_alert", ref_id: saved.id });
    const owner = await getOwnerId(db);
    if (!error && owner) {
      const head = category === "lead" ? "💼 <b>Новая заявка</b>" : "❓ <b>Вопрос к вам</b>";
      const link = m.message_link ? `\n\n<a href="${m.message_link}">Открыть сообщение</a>` : "";
      await send(owner, `${head} · ${SOURCE_LABEL[m.source] ?? m.source}\nЧат: ${esc(m.chat_title)}\nАвтор: ${esc(m.sender_name)}\n\n${esc(m.text.slice(0, 1500))}${link}`).catch((e) => console.error(e));
    }
  }
}

// ---------- CRM: owner forwards a client's reply to the bot ----------
const stageKb = (contactId: string) => ({
  inline_keyboard: [0, 2, 4, 6].map((i) => STAGES.slice(i, i + 2).map((s, j) => ({ text: s.label, callback_data: `st:${contactId}:${i + j}` }))),
});

async function onForwarded(db: Admin, from: number, msg: any) {
  const o = msg.forward_origin ?? {};
  const u = o.sender_user ?? msg.forward_from;
  const name: string = u ? [u.first_name, u.last_name].filter(Boolean).join(" ") : (o.sender_user_name ?? msg.forward_sender_name ?? "Без имени");
  const text: string = msg.text ?? msg.caption ?? "";
  let contact: any = null;
  if (u?.id) contact = (await db.from("crm_contacts").select("*").eq("telegram_id", u.id).maybeSingle()).data;
  if (!contact) contact = (await db.from("crm_contacts").select("*").eq("name", name).is("telegram_id", null).is("vk_user_id", null).limit(1).maybeSingle()).data;
  if (!contact) {
    contact = (await db.from("crm_contacts").insert({ name, username: u?.username ?? null, telegram_id: u?.id ?? null, stage: "replied" }).select("*").single()).data;
  }
  let suggested: string = contact.stage;
  try {
    const r = await aiJson<{ stage: string }>(
      `Ты CRM-ассистент. Воронка: ${STAGES.map((s) => `${s.id} — ${s.label}`).join("; ")}.
Текущий этап клиента: ${contact.stage}. По ответу клиента на рассылку определи этап. Не понижай этап без явной причины (кроме "rescheduled" при переносе). Формат: {"stage":"..."}`,
      text.slice(0, 2000),
    );
    if (stageIndex(r.stage) >= 0) suggested = r.stage;
  } catch (e) {
    console.error("crm stage failed", e);
  }
  if (contact.stage === "first_touch" && suggested === "first_touch") suggested = "replied";
  await db.from("crm_events").insert({ contact_id: contact.id, kind: "reply", text });
  await db.from("crm_contacts").update({ last_message: text.slice(0, 500), last_contact_at: new Date().toISOString(), stage: suggested }).eq("id", contact.id);
  if (suggested !== contact.stage) await db.from("crm_events").insert({ contact_id: contact.id, kind: "stage", text: `${stageLabel(contact.stage)} → ${stageLabel(suggested)}` });
  await send(from, `👤 <b>${esc(name)}</b>\nЭтап: <b>${stageLabel(suggested)}</b>\n\nОтвет сохранён в CRM. Сменить этап:`, { reply_markup: stageKb(contact.id) });
}

async function onCallback(db: Admin, cq: any) {
  const owner = await getOwnerId(db);
  if (!owner || cq.from.id !== owner) {
    await tg("answerCallbackQuery", { callback_query_id: cq.id, text: "Доступ запрещён" });
    return;
  }
  const [action, id = ""] = String(cq.data ?? "").split(":");
  const chatId = cq.message.chat.id;
  const msgId = cq.message.message_id;
  if (action === "st") {
    const idx = Number(String(cq.data).split(":")[2]);
    const st = STAGES[idx];
    if (st) {
      const { data: c } = await db.from("crm_contacts").select("name, stage").eq("id", id).maybeSingle();
      if (c && c.stage !== st.id) {
        await db.from("crm_contacts").update({ stage: st.id }).eq("id", id);
        await db.from("crm_events").insert({ contact_id: id, kind: "stage", text: `${stageLabel(c.stage)} → ${st.label}` });
      }
      await tg("answerCallbackQuery", { callback_query_id: cq.id, text: `Этап: ${st.label}` });
      if (c) await tg("editMessageText", { chat_id: chatId, message_id: msgId, parse_mode: "HTML", text: `👤 <b>${esc(c.name)}</b>\nЭтап: <b>${st.label}</b>`, reply_markup: stageKb(id) }).catch(() => {});
    }
    return;
  }
  if (action === "ok") {
    const { data } = await db.from("meetings").update({ status: "confirmed" }).eq("id", id).select("*").maybeSingle();
    await tg("answerCallbackQuery", { callback_query_id: cq.id, text: data ? "Подтверждено" : "Встреча не найдена" });
    if (data) await tg("editMessageText", { chat_id: chatId, message_id: msgId, parse_mode: "HTML", text: `✅ Записал: ${fmtMeeting(data as Meeting)}` });
  } else if (action === "edit") {
    await db.from("users").update({ pending_edit_meeting: id }).eq("telegram_id", owner);
    await tg("answerCallbackQuery", { callback_query_id: cq.id });
    await send(chatId, "Напишите новую формулировку встречи — я перезапишу её.");
  } else if (action === "del") {
    await db.from("meetings").delete().eq("id", id);
    await tg("answerCallbackQuery", { callback_query_id: cq.id, text: "Удалено" });
    await tg("editMessageText", { chat_id: chatId, message_id: msgId, text: "🗑 Встреча удалена." }).catch(() => {});
  }
}

const HELP = `Я ваш личный секретарь. Просто напишите или надиктуйте голосом, например:
«Завтра в 15:00 встреча с Иваном, подготовить договор».

Команды:
/today — встречи на сегодня
/tomorrow — на завтра
/week — на 7 дней
/delete — удалить встречу
/chats — сводка по чатам за сутки
/leads — заявки за 7 дней
/crm — воронка клиентов

Перешлите мне ответ клиента на рассылку — я занесу его в CRM и определю этап.

Также можно спросить: «что писали в группе Продажи вчера?»`;

async function onPrivate(db: Admin, msg: any) {
  const from = msg.from.id as number;
  const owner = await getOwnerId(db);
  let text: string = (msg.text ?? "").trim();

  if (text.startsWith("/start")) {
    if (!owner) {
      await db.from("users").insert({ telegram_id: from });
      await send(from, `Привет! Вы зарегистрированы как владелец бота (ID <code>${from}</code>).\n\n${HELP}`);
    } else if (owner === from) {
      await send(from, HELP);
    } else {
      await send(from, "Извините, этот бот приватный.");
    }
    return;
  }
  if (owner !== from) {
    await send(from, "Извините, этот бот приватный.");
    return;
  }

  try {
    if (msg.forward_origin || msg.forward_from || msg.forward_sender_name) return void (await onForwarded(db, from, msg));
    if (msg.voice || msg.audio) {
      text = await transcribe((msg.voice ?? msg.audio).file_id);
      if (!text) return void (await send(from, "Не удалось распознать голосовое сообщение."));
      await send(from, `🎙 <i>${esc(text)}</i>`);
    }
    if (!text) return;

    const cmd = (text.split(/[\s@]/)[0] ?? "").toLowerCase();
    if (cmd === "/help") return void (await send(from, HELP));
    if (cmd === "/today") return void (await send(from, await meetingsText(db, "Встречи сегодня", mskDate(0), mskDate(0))));
    if (cmd === "/tomorrow") return void (await send(from, await meetingsText(db, "Встречи завтра", mskDate(1), mskDate(1))));
    if (cmd === "/week") return void (await send(from, await meetingsText(db, "Встречи на неделю", mskDate(0), mskDate(6))));
    if (cmd === "/delete") {
      const ms = await listMeetings(db, mskDate(0), mskDate(60));
      if (!ms.length) return void (await send(from, "Предстоящих встреч нет."));
      return void (await send(from, "Выберите встречу для удаления:", {
        reply_markup: { inline_keyboard: ms.slice(0, 30).map((m) => [{ text: `🗑 ${humanDate(m.date)} ${m.time?.slice(0, 5) ?? ""} ${m.with_whom ?? m.topic ?? ""}`.slice(0, 60), callback_data: `del:${m.id}` }]) },
      }));
    }
    if (cmd === "/chats") return void (await send(from, (await chatsDigest(db, new Date(Date.now() - 24 * 3600_000).toISOString())).slice(0, 4000)));
    if (cmd === "/leads") {
      const { data } = await db.from("leads").select("status, created_at, messages(chat_title, sender_name, text, message_link)").gte("created_at", new Date(Date.now() - 7 * 86400_000).toISOString()).order("created_at", { ascending: false }).limit(30);
      if (!data?.length) return void (await send(from, "За 7 дней заявок нет."));
      return void (await send(from, "<b>Заявки и вопросы за 7 дней</b>\n" + data.map((l: any) => `${l.status === "new" ? "🆕" : "✔️"} ${esc(l.messages?.sender_name)} (${esc(l.messages?.chat_title)}): ${esc((l.messages?.text ?? "").slice(0, 120))} <a href="${l.messages?.message_link}">→</a>`).join("\n").slice(0, 4000)));
    }
    if (cmd === "/crm") {
      const { data } = await db.from("crm_contacts").select("stage");
      const counts = STAGES.map((st) => `${st.label}: <b>${(data ?? []).filter((c) => c.stage === st.id).length}</b>`);
      return void (await send(from, `<b>Воронка</b>\n${counts.join("\n")}\n\nПерешлите мне ответ клиента — я добавлю его в CRM.`));
    }
    if (cmd.startsWith("/")) return void (await send(from, "Неизвестная команда. /help — список команд."));

    // Editing an existing meeting
    const { data: u } = await db.from("users").select("pending_edit_meeting").eq("telegram_id", from).maybeSingle();
    const editId = u?.pending_edit_meeting ?? null;

    const p = await parseMeeting(text);
    if (editId || p.intent === "meeting") {
      if (!p.date) return void (await send(from, "Не понял дату встречи. Уточните, пожалуйста, например: «завтра в 15:00 с Иваном»."));
      const row = { date: p.date, time: p.time, with_whom: p.with_whom, topic: p.topic, prepare: p.prepare, raw_text: text, status: "pending", user_id: from };
      let m: Meeting | null = null;
      if (editId) {
        await db.from("users").update({ pending_edit_meeting: null }).eq("telegram_id", from);
        const { data } = await db.from("meetings").update(row).eq("id", editId).select("*").maybeSingle();
        m = data as Meeting | null;
      }
      if (!m) {
        const { data } = await db.from("meetings").insert(row).select("*").single();
        m = data as Meeting;
      }
      return void (await send(from, `Записал: ${fmtMeeting(m)}`, { reply_markup: confirmKb(m.id) }));
    }
    // Free question about chats / meetings
    const { data: msgs } = await db.from("messages").select("chat_title, sender_name, text, category, created_at").gte("created_at", new Date(Date.now() - 7 * 86400_000).toISOString()).order("created_at").limit(500);
    const ms = await listMeetings(db, mskDate(-7), mskDate(30));
    const ctx = `Сейчас (МСК): ${mskNow().toISOString().slice(0, 16).replace("T", " ")}\n\nСообщения из чатов за 7 дней (время UTC):\n` +
      (msgs ?? []).map((m) => `${m.created_at.slice(0, 16)} [${m.chat_title}] ${m.sender_name} (${m.category}): ${(m.text ?? "").slice(0, 300)}`).join("\n").slice(0, 40000) +
      `\n\nВстречи:\n` + ms.map((m) => `${m.date} ${m.time ?? ""} ${m.with_whom ?? ""} ${m.topic ?? ""}`).join("\n");
    const answer = await aiText("Ты личный ассистент. Отвечай кратко на русском, по данным ниже. Если данных нет — так и скажи. Время показывай по Москве (UTC+3). Без markdown.", `${ctx}\n\nВопрос: ${text}`);
    await send(from, esc(answer).slice(0, 4000));
  } catch (e) {
    console.error("private handler error", e);
    await send(from, NEUTRAL).catch(() => {});
  }
}
