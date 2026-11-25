import { createFileRoute } from '@tanstack/react-router';
import { SettingsPage } from '@/components/business/settings';
export const Route = createFileRoute('/business/settings')({
 head: () => ({ meta: [{ title: 'Настройки — Бизнес-Тиндер + Бадди' }, { name: 'description', content: 'Выходные, фокус, уведомления и офлайн-сохранение.' }, { property: 'og:title', content: 'Настройки — Бизнес-Тиндер + Бадди' }, { property: 'og:description', content: 'Выходные, фокус, уведомления и офлайн-сохранение.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }], links: [{ rel: 'manifest', href: '/manifest.webmanifest' }, { rel: 'apple-touch-icon', href: '/business-icon-192.png' }] }),
 component: SettingsPage,
});
