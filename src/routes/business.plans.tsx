import { createFileRoute } from '@tanstack/react-router';
import { PlansPage } from '@/components/business/settings';
export const Route = createFileRoute('/business/plans')({
 head: () => ({ meta: [{ title: 'Тарифы — Бизнес-Тиндер + Бадди' }, { name: 'description', content: 'Демонстрационные балансы и тарифы Бизнес-Тиндер + Бадди.' }, { property: 'og:title', content: 'Тарифы — Бизнес-Тиндер + Бадди' }, { property: 'og:description', content: 'Демонстрационные балансы и тарифы Бизнес-Тиндер + Бадди.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }], links: [{ rel: 'manifest', href: '/manifest.webmanifest' }, { rel: 'apple-touch-icon', href: '/business-icon-192.png' }] }),
 component: PlansPage,
});
