import { createFileRoute } from '@tanstack/react-router';
import { TasksPage } from '@/components/business/tasks';
export const Route = createFileRoute('/business/')({
 head: () => ({ meta: [{ title: 'Задание дня — Бизнес-Тиндер + Бадди' }, { name: 'description', content: 'Ежедневные дела, залоги и отчёты для бадди.' }, { property: 'og:title', content: 'Задание дня — Бизнес-Тиндер + Бадди' }, { property: 'og:description', content: 'Ежедневные дела, залоги и отчёты для бадди.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }], links: [{ rel: 'manifest', href: '/manifest.webmanifest' }, { rel: 'apple-touch-icon', href: '/business-icon-192.png' }] }),
 component: TasksPage,
});
