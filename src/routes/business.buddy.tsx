import { createFileRoute } from '@tanstack/react-router';
import { BuddyPage } from '@/components/business/buddy';
export const Route = createFileRoute('/business/buddy')({
 head: () => ({ meta: [{ title: 'Бадди-центр — Бизнес-Тиндер + Бадди' }, { name: 'description', content: 'Отчёты, дисциплина и поддержка бадди.' }, { property: 'og:title', content: 'Бадди-центр — Бизнес-Тиндер + Бадди' }, { property: 'og:description', content: 'Отчёты, дисциплина и поддержка бадди.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }], links: [{ rel: 'manifest', href: '/manifest.webmanifest' }, { rel: 'apple-touch-icon', href: '/business-icon-192.png' }] }),
 component: BuddyPage,
});
