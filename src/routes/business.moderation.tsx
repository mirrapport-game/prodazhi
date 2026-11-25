import { createFileRoute } from '@tanstack/react-router';
import { ModerationPage } from '@/components/business/moderation';
export const Route = createFileRoute('/business/moderation')({
 head: () => ({ meta: [{ title: 'Демо-модерация — Бизнес-Тиндер + Бадди' }, { name: 'description', content: 'Управление локальными демо-экспертами и черновиками публикаций.' }, { property: 'og:title', content: 'Демо-модерация — Бизнес-Тиндер + Бадди' }, { property: 'og:description', content: 'Управление локальными демо-экспертами и черновиками публикаций.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }], links: [{ rel: 'manifest', href: '/manifest.webmanifest' }, { rel: 'apple-touch-icon', href: '/business-icon-192.png' }] }),
 component: ModerationPage,
});
