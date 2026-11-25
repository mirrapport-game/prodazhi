// CRM funnel stages — browser-safe, shared by bot and dashboard.
export const STAGES = [
  { id: "first_touch", label: "Первое касание" },
  { id: "replied", label: "Ответили" },
  { id: "booked", label: "Записались" },
  { id: "rescheduled", label: "Перенесли" },
  { id: "came", label: "Пришли" },
  { id: "bought_5000", label: "Купили за 5000" },
  { id: "bought_game", label: "Купили игру" },
] as const;
export type StageId = (typeof STAGES)[number]["id"];
export const stageLabel = (id: string) => STAGES.find((s) => s.id === id)?.label ?? id;
export const stageIndex = (id: string) => STAGES.findIndex((s) => s.id === id);

export const CABINETS = [
  { id: "psychologists", label: "Психологи", purpose: "Живая встреча" },
  { id: "beauty_salons", label: "Салоны красоты", purpose: "Рассылка салонам красоты" },
  { id: "medical_clinics", label: "Медицинские клиники", purpose: "Рассылка медицинским клиникам" },
  { id: "singles", label: "Свободные", purpose: "Приглашение свободных" },
  { id: "relationships", label: "В отношениях", purpose: "Приглашение тех, кто в отношениях" },
] as const;
export type CabinetId = (typeof CABINETS)[number]["id"];
export type CabinetView = string;
export const cabinetLabel = (id: string | null) => CABINETS.find((c) => c.id === id)?.label ?? "Нераспределённые";
export function contactsForCabinet<T extends { audience_id: string | null }>(contacts: T[], view: CabinetView): T[] {
  return contacts.filter((c) => view === "unassigned" ? c.audience_id === null : c.audience_id === view);
}
