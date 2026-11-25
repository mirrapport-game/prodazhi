import { createFileRoute } from '@tanstack/react-router';
import { BandPage } from '@/components/business/band';
export const Route = createFileRoute('/business/band')({
 head: () => ({ meta: [{ title: 'Моя банда — Бизнес-Тиндер + Бадди' }, { name: 'description', content: 'Окружение предпринимателя и публикации об эксперте дня.' }, { property: 'og:title', content: 'Моя банда — Бизнес-Тиндер + Бадди' }, { property: 'og:description', content: 'Окружение предпринимателя и публикации об эксперте дня.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }], links: [{ rel: 'manifest', href: '/manifest.webmanifest' }, { rel: 'apple-touch-icon', href: '/business-icon-192.png' }] }),
 component: BandPage,
});
