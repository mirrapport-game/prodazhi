import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { getBotStatus, sendTestSummary } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Настройки — Rapport" }, { name: "description", content: "Статус бота и тестовая сводка." }, { property: "og:title", content: "Настройки — Rapport" }, { property: "og:description", content: "Подключение Telegram-бота и проверка сводки." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: SettingsPage,
});

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}

function SettingsPage() {
  const status = useServerFn(getBotStatus);
  const test = useServerFn(sendTestSummary);
  const [busy, setBusy] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["bot-status"], queryFn: () => status() });

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold">Настройки</h1>
      <div className="rounded-2xl border bg-card px-6">
        {isLoading ? <p className="py-6 text-muted-foreground">Загрузка…</p> : (
          <>
            <Row label="Бот">{data?.botUsername ? `@${data.botUsername}` : "—"}</Row>
            <Row label="Telegram ID владельца">{data?.ownerId ?? "Не задан — отправьте боту /start"}</Row>
            <Row label="Приём сообщений">{data?.webhookUrl ? <span className="text-success">Подключён</span> : <span className="text-destructive">Не подключён</span>}</Row>
            {data?.lastError && <Row label="Последняя ошибка">{data.lastError}</Row>}
            <Row label="Часовой пояс">Москва (UTC+3)</Row>
          </>
        )}
      </div>
      <Button
        className="mt-6"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const r = await test().catch(() => ({ sent: false }));
          setBusy(false);
          r.sent ? toast.success("Сводка отправлена в Telegram") : toast.error("Не удалось отправить. Сначала напишите боту /start.");
        }}
      >
        Отправить тестовую сводку
      </Button>
    </div>
  );
}
