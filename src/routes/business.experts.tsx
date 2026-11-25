import { createFileRoute } from '@tanstack/react-router';
import { ExpertsPage } from '@/components/business/experts';
export const Route = createFileRoute('/business/experts')({
 head: () => ({ meta: [{ title: 'Эксперты — Бизнес-Тиндер + Бадди' }, { name: 'description', content: 'Бизнес-знакомства, подарки и рекомендации экспертов.' }, { property: 'og:title', content: 'Эксперты — Бизнес-Тиндер + Бадди' }, { property: 'og:description', content: 'Бизнес-знакомства, подарки и рекомендации экспертов.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }], links: [{ rel: 'manifest', href: '/manifest.webmanifest' }, { rel: 'apple-touch-icon', href: '/business-icon-192.png' }] }),
 component: ExpertsPage,
});
