export const DEPOSITS = [2000, 5000, 10000, 50000] as const;
export const SOURCES = ['Telegram', 'Instagram', 'ВК', 'YouTube', 'Блог', 'Email'];
export const NICHES = ['Салон красоты', 'Тату', 'Массаж', 'Маркетинг', 'Юрист', 'Фитнес', 'Фотограф', 'Ремонт', 'Другое'];
export const PLANS = { free: { name: 'Бесплатно', price: 0, tasks: 1, band: 20 }, pro: { name: 'Про', price: 990, tasks: Infinity, band: 20 }, business: { name: 'Бизнес', price: 4900, tasks: Infinity, band: 50 } };
export type Task = { id: string; title: string; amount: number; source: string; date: string; deadline: string; status: 'todo' | 'pending' | 'done' | 'burned'; report?: string; link?: string; image?: string; submittedAt?: string; comment?: string };
export type Expert = { id: string; name: string; niche: string; city: string; initials: string; presentation: string; quote: string; advice: string; gift: string };
export type Post = { id: string; date: string; expertId: string; link: string; text: string; moderator: boolean; status: 'published' | 'draft' };
export type State = { version: 1; profile: { name: string; city: string; niche: string; bio: string; photo: string; telegram: string; instagram: string; vk: string; website: string }; points: number; money: number; burned: number; earnings: number; fund: number; buddyPoints: number; buddy: string; isBuddy: boolean; plan: keyof typeof PLANS; tasks: Task[]; experts: Expert[]; band: string[]; skipped: string[]; posts: Post[]; penalized: string[]; notifications: { id: string; text: string; read: boolean }[]; chat: { id: string; from: 'me' | 'buddy'; text: string }[]; events: { date: string; text: string }[]; settings: { weekends: number[]; focus: number; burnAt: 'deadline' | 'day'; notifications: boolean; repostCost: number; penalty: number }; paymentEmail: string };
export function dateMsk(now = Date.now()) { return new Date(now + 10800000).toISOString().slice(0, 10); }
export function dayOffset(date: string, offset: number) { return new Date(Date.parse(date + 'T12:00:00Z') + offset * 86400000).toISOString().slice(0, 10); }
export function weekday(date: string) { return new Date(date + 'T12:00:00Z').getUTCDay(); }
export function deadlineAt(task: Task, mode: 'deadline' | 'day') { return Date.parse(`${task.date}T${mode === 'day' ? '23:59:59' : task.deadline}:00+03:00`.replace('23:59:59:00', '23:59:59')); }
export function seed(now = Date.now()): State {
 const date = dateMsk(now);
 const names = ['Анна Соколова', 'Михаил Орлов', 'Мария Волкова', 'Александр Левин', 'Елена Миронова', 'Дмитрий Серов', 'Ольга Белова', 'Артём Ким', 'София Лебедева', 'Илья Морозов'];
 const niches = ['Маркетинг', 'Фитнес', 'Салон красоты', 'Юрист', 'Фотограф', 'Ремонт', 'Массаж', 'Тату', 'Маркетинг', 'Другое'];
 const gifts = ['Аудит вашего профиля в подарок', 'Персональная тренировка', 'Скидка 20% на первый визит', 'Консультация 30 минут', 'Чек-лист для фотосессии', 'Бесплатный замер', 'Скидка 20% на массаж', 'Эскиз в подарок', 'План контента на неделю', 'Разбор бизнес-идеи'];
 const experts = names.map((name, i) => ({ id: `expert-${i}`, name, niche: niches[i] ?? 'Другое', city: ['Москва', 'Санкт-Петербург', 'Казань'][i % 3] ?? 'Москва', initials: name.split(' ').map(x => x[0]).join(''), presentation: i === 0 ? 'Помогаю экспертам превращать личный бренд в стабильный поток клиентов. 8 лет практики, 120 успешных запусков.' : `Развиваю своё дело и помогаю людям в сфере «${(niches[i] ?? 'Другое').toLowerCase()}». Открыт к совместным проектам.`, quote: 'Сильное окружение — ваш следующий уровень.', advice: i === 0 ? 'Пишите о результатах клиентов, а не только о своих услугах. Доверие начинается с реальных историй.' : 'Покажите процесс своей работы: людям важно видеть, кто стоит за результатом.', gift: gifts[i] ?? 'Консультация в подарок' }));
 return { version: 1, profile: { name: 'Иван Предприниматель', city: 'Москва', niche: 'Маркетинг', bio: 'Строю своё дело. Развиваю личный бренд и ищу сильное окружение.', photo: '', telegram: '', instagram: '', vk: '', website: '' }, points: 250, money: 50000, burned: 0, earnings: 0, fund: 0, buddyPoints: 0, buddy: 'ai', isBuddy: false, plan: 'free', tasks: ['Написать пост', 'Снять рилс', 'Опубликовать статью'].map((title, i) => ({ id: `seed-${i}`, title, amount: DEPOSITS[i] ?? 2000, source: SOURCES[i] ?? 'Telegram', date, deadline: ['18:00', '20:00', '22:00'][i] ?? '18:00', status: 'todo' })), experts, band: ['expert-0', 'expert-1', 'expert-2'], skipped: [], posts: [], penalized: [], notifications: [], chat: [{ id: 'welcome', from: 'buddy', text: 'Привет, Иван! Что сегодня приблизит тебя к твоей цели?' }], events: [], settings: { weekends: [0, 6], focus: 25, burnAt: 'day', notifications: false, repostCost: 50, penalty: 1000 }, paymentEmail: '' };
}
export function expertOfDay(state: State, date = dateMsk()) { const index = Math.floor(Date.parse(date + 'T12:00:00Z') / 86400000); return state.experts.find(e => e.id === state.band[index % Math.max(1, state.band.length)]); }
export function postTemplate(expert: Expert) { return `Сегодня знакомлю вас с ${expert.name} — ${expert.niche.toLowerCase()}, ${expert.city}. ${expert.presentation}\nСовет: ${expert.advice}\nПодарок: ${expert.gift}\nНапишите мне, чтобы познакомиться!`; }
export function validUrl(value: string) { try { const u = new URL(value); return u.protocol === 'https:' || u.protocol === 'http:'; } catch { return false; } }
export function submitReport(state: State, id: string, text: string, link: string, image: string, now = Date.now()): State {
 const task = state.tasks.find(t => t.id === id);
 if (!task || task.status === 'done' || task.status === 'burned') throw new Error('Дело уже закрыто');
 if (now > deadlineAt(task, 'deadline')) throw new Error('Дедлайн отчёта уже прошёл');
 if (text.trim().length < 30) throw new Error('Напишите минимум 30 символов о результате');
 if (link && !validUrl(link)) throw new Error('Укажите полную ссылку https://');
 const done = state.buddy === 'ai';
 return { ...state, points: state.points + (done ? 10 : 0), tasks: state.tasks.map(t => t.id === id ? { ...t, report: text.trim(), link, image, submittedAt: new Date(now).toISOString(), status: done ? 'done' : 'pending' } : t), notifications: [...state.notifications, { id: `report-${id}`, text: done ? `Отчёт «${task.title}» принят. +10 баллов` : `Отчёт «${task.title}» ожидает проверки`, read: false }] };
}
export function addTask(state: State, task: Task): State {
 if (state.settings.weekends.includes(weekday(task.date))) throw new Error('На выходной задания не назначаются');
 if (state.tasks.filter(t => t.date === task.date).length >= PLANS[state.plan].tasks) throw new Error('Бесплатный тариф: 1 дело в день. Три стартовых дела — демонстрационные.');
 if (!DEPOSITS.includes(task.amount as typeof DEPOSITS[number])) throw new Error('Выберите залог из списка');
 if (!task.title.trim()) throw new Error('Укажите название дела');
 const reserved = state.tasks.filter(t => t.status === 'todo' || t.status === 'pending').reduce((s, t) => s + t.amount, 0);
 if (reserved + task.amount > state.money) throw new Error('Недостаточно демонстрационного баланса для залога');
 return { ...state, tasks: [...state.tasks, task] };
}
export function settle(state: State, now = Date.now()): State {
 let next = state;
 for (const task of state.tasks) {
  if (task.status !== 'todo' || now <= deadlineAt(task, state.settings.burnAt)) continue;
  next = { ...next, money: next.money - task.amount, burned: next.burned + task.amount, fund: next.fund + (state.buddy === 'ai' ? task.amount : 0), tasks: next.tasks.map(t => t.id === task.id ? { ...t, status: 'burned' } : t), events: [...next.events, { date: task.date, text: `Сгорел залог «${task.title}»: ${task.amount} ₽${state.buddy === 'ai' ? ' → фонд' : ' → демо-бадди'}` }], notifications: [...next.notifications, { id: `burn-${task.id}`, text: `Отчёт не сдан: сгорело ${task.amount} ₽`, read: false }] };
 }
 const today = dateMsk(now);
 const first = [...state.tasks.map(t => t.date), ...state.posts.map(p => p.date), today].sort()[0] ?? today;
 for (let date = first, count = 0; date < today && count < 90; date = dayOffset(date, 1), count++) {
  if (!state.band.length || state.settings.weekends.includes(weekday(date)) || next.penalized.includes(date) || next.posts.some(p => p.date === date && p.status === 'published')) continue;
  next = { ...next, money: next.money - state.settings.penalty, fund: next.fund + state.settings.penalty, penalized: [...next.penalized, date], events: [...next.events, { date, text: `Пропуск поста об эксперте: ${state.settings.penalty} ₽` }] };
 }
 return next;
}
export function repost(state: State): State { if (state.points < state.settings.repostCost) throw new Error('Недостаточно баллов'); return { ...state, points: state.points - state.settings.repostCost + 10 }; }
export function addBand(state: State, id: string): State { if (state.band.includes(id)) return state; if (state.band.length >= PLANS[state.plan].band) throw new Error(`В банде максимум ${PLANS[state.plan].band} экспертов`); return { ...state, band: [...state.band, id] }; }
export function publishPost(state: State, post: Post): State { if (!validUrl(post.link)) throw new Error('Укажите полную ссылку на публикацию'); if (state.posts.some(p => p.date === post.date && p.status === 'published' && !p.moderator)) throw new Error('Пост за этот день уже зачтён'); return { ...state, posts: [...state.posts, post], points: state.points + (post.moderator ? 0 : 50) }; }
