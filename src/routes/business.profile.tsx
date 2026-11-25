import { createFileRoute } from '@tanstack/react-router';
import { ProfilePage } from '@/components/business/profile';
export const Route = createFileRoute('/business/profile')({
 head: () => ({ meta: [{ title: 'Мой профиль — Бизнес-Тиндер + Бадди' }, { name: 'description', content: 'Личный профиль предпринимателя, баллы и результаты.' }, { property: 'og:title', content: 'Мой профиль — Бизнес-Тиндер + Бадди' }, { property: 'og:description', content: 'Личный профиль предпринимателя, баллы и результаты.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }], links: [{ rel: 'manifest', href: '/manifest.webmanifest' }, { rel: 'apple-touch-icon', href: '/business-icon-192.png' }] }),
 component: ProfilePage,
});
