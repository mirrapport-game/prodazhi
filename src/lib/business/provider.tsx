import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { dateMsk, deadlineAt, expertOfDay, seed, settle, type State } from './model';
import { archive, restore, STORAGE_KEY } from './storage';
import { toast } from 'sonner';
const Context = createContext<{ state: State; update: (fn: (s: State) => State) => void } | undefined>(undefined);
export function BusinessProvider({ children }: { children: ReactNode }) {
 const [state, setState] = useState<State>(() => seed());
 const [ready, setReady] = useState(false);
 const current = useRef(state);
 useEffect(() => { let active = true; (async () => { let saved: State | undefined; try { const raw = localStorage.getItem(STORAGE_KEY); saved = raw ? JSON.parse(raw) : await restore(); } catch { toast.error('Не удалось прочитать сохранение'); } if (!active) return; const next = settle(saved?.version === 1 ? saved : seed()); current.current = next; setState(next); setReady(true); })(); return () => { active = false; }; }, []);
 useEffect(() => { if (!ready) return; try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { toast.error('Память устройства заполнена. Сохранение в архиве.'); } archive(state).catch(() => toast.error('Не удалось сохранить архив на устройстве')); }, [state, ready]);
 const update = (fn: (s: State) => State) => { try { const next = fn(current.current); current.current = next; setState(next); } catch (e) { toast.error(e instanceof Error ? e.message : 'Не удалось выполнить действие'); } };
 useEffect(() => { if (!ready) return; const timer = window.setInterval(() => { const next = settle(current.current); if (next !== current.current) { current.current = next; setState(next); } }, 15000); return () => window.clearInterval(timer); }, [ready]);
 useEffect(() => {
  if (!ready) return;
  const check = () => {
   const s = current.current;
   const now = Date.now();
   const added: State['notifications'] = [];
   for (const task of s.tasks.filter(t => t.status === 'todo')) {
    const left = deadlineAt(task, 'deadline') - now;
    const id = `reminder-${task.id}`;
    if (left > 0 && left <= 1800000 && !s.notifications.some(n => n.id === id)) added.push({ id, text: `Дедлайн через 30 минут: ${task.title}. Залог ${task.amount} ₽`, read: false });
   }
   const expert = expertOfDay(s);
   const dailyId = `expert-${dateMsk()}`;
   if (expert && !s.notifications.some(n => n.id === dailyId)) added.push({ id: dailyId, text: `Эксперт дня в банде: ${expert.name}`, read: false });
   if (!added.length) return;
   update(old => ({ ...old, notifications: [...old.notifications, ...added] }));
   if (s.settings.notifications && 'Notification' in window && Notification.permission === 'granted') for (const n of added) new Notification('Бизнес-Тиндер + Бадди', { body: n.text });
  };
  check(); const timer = window.setInterval(check, 30000); return () => window.clearInterval(timer);
 }, [ready]);
 if (!ready) return <div className="business-theme grid min-h-screen place-items-center bg-background text-foreground">Загрузка…</div>;
 return <Context.Provider value={{ state, update }}>{children}</Context.Provider>;
}
export function useBusiness() { const context = useContext(Context); if (!context) throw new Error('Business provider missing'); return context; }
